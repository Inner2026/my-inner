import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminApi } from '../api/adminEndpoints';

const scoringMethods = [
  ['WEIGHTED_DICHOTOMY', 'Weighted dichotomy (MBTI-style)'],
  ['CATEGORY_SUM_RANGE', 'Category sum + result ranges'],
  ['CATEGORY_SUM_RANKING', 'Category sum ranking'],
  ['CORRECT_ANSWER_PERCENTAGE', 'Correct-answer percentage'],
  ['TALLY_MAPPING', 'Tally mapping'],
  ['CATEGORY_AVERAGE_BAND', 'Category average bands'],
  ['FRAMEWORK_SNIPPET_ASSEMBLY', 'Framework snippet assembly'],
  ['TRAIT_BAND_ASSEMBLY', 'Trait bands']
] as const;

export function CreateTest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ slug: '', name: '', description: '', imageUrl: '', priceCents: 499, versionLabel: '1.0', expectedQuestionCount: 30, scoringMethod: 'CATEGORY_SUM_RANGE', categoriesText: '', scoringConfigText: '{}' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadImage(file?: File) {
    if (!file) return;
    setUploading(true); setError(null);
    try { const { imageUrl } = await AdminApi.uploadImage(file); setForm((current) => ({ ...current, imageUrl })); } catch (e: any) { setError(e.message); } finally { setUploading(false); }
  }

  async function create() {
    setSaving(true); setError(null);
    try {
      const { test } = await AdminApi.createTest({ slug: form.slug, name: form.name, description: form.description, imageUrl: form.imageUrl, priceCents: form.priceCents });
      let scoringConfig: Record<string, unknown>;
      try { scoringConfig = JSON.parse(form.scoringConfigText || '{}'); } catch { throw new Error('Scoring config must be valid JSON.'); }
      const categories = form.categoriesText.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => { const [key, ...nameParts] = line.split('|'); return { key: key.trim(), name: nameParts.join('|').trim() || key.trim() }; });
      await AdminApi.createVersion({ testId: test._id, versionLabel: form.versionLabel, expectedQuestionCount: form.expectedQuestionCount, scoringMethod: form.scoringMethod, categories, scoringConfig });
      navigate(`/admin/tests/${test._id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return <div className="mx-auto max-w-4xl">
    <Link to="/admin/tests" className="text-xs font-semibold text-[#765c8d]">← Back to tests</Link>
    <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#765c8d]">Test builder</p><h1 className="mt-2 text-3xl font-semibold text-[#302447]">Create a complete test</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Add the public test details and create its first draft version. The next screen contains the full editors for questions, answers, scoring, and result definitions.</p></div>
    {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

    <section className="mt-7 rounded-2xl border border-[#eee5e9] bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-3"><span className="admin-step">1</span><div><h2 className="font-semibold text-[#302447]">Test details</h2><p className="text-sm text-slate-500">This information appears on the public test page.</p></div></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="admin-field">Test name<input placeholder="Inner Child Self-Reflection Test" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="admin-input" /></label><label className="admin-field">Slug<span className="admin-help">Lowercase URL key, for example inner-child</span><input placeholder="inner-child" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="admin-input" /></label><label className="admin-field sm:col-span-2">Description<textarea placeholder="What will the customer discover?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input min-h-32" /></label><div className="admin-field sm:col-span-2"><span>Test image</span><span className="admin-help">Upload PNG, JPEG, WEBP, or GIF up to 5MB. Leave empty to use the default image.</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => uploadImage(e.target.files?.[0])} disabled={uploading} className="admin-input" />{uploading && <p className="mt-2 text-xs text-slate-500">Uploading image...</p>}{form.imageUrl && <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><img src={form.imageUrl} alt="New test preview" className="h-52 w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} /></div>}</div><label className="admin-field">Price in cents<input type="number" min="0" value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) })} className="admin-input" /></label></div></section>

    <section className="mt-5 rounded-2xl border border-[#eee5e9] bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-3"><span className="admin-step">2</span><div><h2 className="font-semibold text-[#302447]">First content version</h2><p className="text-sm text-slate-500">Questions and answers belong to a version so published tests remain immutable.</p></div></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="admin-field">Version label<input value={form.versionLabel} onChange={(e) => setForm({ ...form, versionLabel: e.target.value })} className="admin-input" /></label><label className="admin-field">Expected question count<span className="admin-help">Must match the final number of questions</span><input type="number" min="1" value={form.expectedQuestionCount} onChange={(e) => setForm({ ...form, expectedQuestionCount: Number(e.target.value) })} className="admin-input" /></label><label className="admin-field sm:col-span-2">Scoring method<select value={form.scoringMethod} onChange={(e) => setForm({ ...form, scoringMethod: e.target.value })} className="admin-input">{scoringMethods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div></section>

    <section className="mt-5 rounded-2xl border border-[#eee5e9] bg-white p-6 shadow-sm sm:p-8"><h2 className="font-semibold text-[#302447]">Scoring setup</h2><p className="mt-1 text-sm text-slate-500">Optional advanced settings. Add one category per line using: key | display name.</p><div className="mt-4 grid gap-5 sm:grid-cols-2"><label className="admin-field">Categories<textarea value={form.categoriesText} onChange={(e) => setForm({ ...form, categoriesText: e.target.value })} className="admin-input min-h-28" placeholder={'E | Extraversion\nI | Introversion'} /></label><label className="admin-field">Scoring config JSON<textarea value={form.scoringConfigText} onChange={(e) => setForm({ ...form, scoringConfigText: e.target.value })} className="admin-input min-h-28 font-mono text-xs" /></label></div></section>

    <div className="mt-6 flex flex-wrap justify-end gap-3"><Link to="/admin/tests" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600">Cancel</Link><button onClick={create} disabled={saving || uploading || !form.name || !form.slug || !form.description || !form.versionLabel || form.expectedQuestionCount < 1} className="rounded-xl bg-[#765c8d] px-6 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-50">{saving ? 'Creating draft...' : 'Create test and continue'}</button></div>
  </div>;
}
