import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminApi } from '../api/adminEndpoints';
import type { ArticleInput } from '../types';
import { Markdown } from '../components/Markdown';
import { readingMinutes } from '../lib/articleFormat';
import { useAdminFeedback } from './AdminFeedback';

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://my-inner.com').replace(/\/$/, '');
const emptyForm: ArticleInput = { title: '', slug: '', excerpt: '', content: '', coverImageUrl: '', coverImageAlt: '', relatedTestSlug: '', status: 'draft' };

function slugify(value: string) {
  return value.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/g, '');
}

type ToolbarAction = { label: string; title: string; apply: (selected: string) => { text: string; block?: boolean } };
const toolbar: ToolbarAction[] = [
  { label: 'H2', title: 'Section heading', apply: (s) => ({ text: `## ${s || 'Section heading'}`, block: true }) },
  { label: 'H3', title: 'Sub-heading', apply: (s) => ({ text: `### ${s || 'Sub-heading'}`, block: true }) },
  { label: 'B', title: 'Bold', apply: (s) => ({ text: `**${s || 'bold text'}**` }) },
  { label: 'I', title: 'Italic', apply: (s) => ({ text: `*${s || 'italic text'}*` }) },
  { label: '• List', title: 'Bulleted list', apply: (s) => ({ text: (s || 'First point\nSecond point').split('\n').map((line) => `- ${line}`).join('\n'), block: true }) },
  { label: '1. List', title: 'Numbered list', apply: (s) => ({ text: (s || 'First step\nSecond step').split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n'), block: true }) },
  { label: '“ Quote', title: 'Quote', apply: (s) => ({ text: `> ${s || 'Quote'}`, block: true }) },
  { label: 'Link', title: 'Link (use /tests/... for a test page)', apply: (s) => ({ text: `[${s || 'link text'}](/tests/)` }) }
];

function Counter({ value, min, max }: { value: number; min: number; max: number }) {
  const ok = value >= min && value <= max;
  return <span className={`text-xs font-semibold ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>{value} / {min}–{max}</span>;
}

export function ArticleEditor() {
  const { articleId } = useParams<{ articleId: string }>();
  const isNew = !articleId || articleId === 'new';
  const navigate = useNavigate();
  const { showSuccess, showError, askConfirmation } = useAdminFeedback();
  const [form, setForm] = useState<ArticleInput>(emptyForm);
  const [savedStatus, setSavedStatus] = useState<'draft' | 'published'>('draft');
  const [slugTouched, setSlugTouched] = useState(false);
  const [tests, setTests] = useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { AdminApi.listTests({ pageSize: 100 }).then((res) => setTests(res.tests.map((t: any) => ({ slug: t.slug, name: t.name })))).catch(() => undefined); }, []);
  useEffect(() => {
    if (isNew) return;
    AdminApi.getArticle(articleId!).then(({ article }) => {
      setForm({ title: article.title, slug: article.slug, excerpt: article.excerpt, content: article.content ?? '', coverImageUrl: article.coverImageUrl, coverImageAlt: article.coverImageAlt, relatedTestSlug: article.relatedTestSlug, status: article.status });
      setSavedStatus(article.status); setSlugTouched(true);
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [articleId, isNew]);

  function update<K extends keyof ArticleInput>(key: K, value: ArticleInput[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'title' && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
  }

  function applyTool(action: ToolbarAction) {
    const el = contentRef.current; if (!el) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const { text, block } = action.apply(value.slice(start, end));
    const before = value.slice(0, start); const after = value.slice(end);
    const prefix = block && before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
    const suffix = block && after && !after.startsWith('\n') ? '\n\n' : '';
    const next = `${before}${prefix}${text}${suffix}${after}`;
    update('content', next);
    requestAnimationFrame(() => { el.focus(); const pos = (before + prefix + text).length; el.setSelectionRange(pos, pos); });
  }

  async function uploadCover(file?: File) {
    if (!file) return;
    setUploading(true); setError(null);
    try { const { imageUrl } = await AdminApi.uploadImage(file); update('coverImageUrl', imageUrl); } catch (err: any) { setError(err.message); } finally { setUploading(false); }
  }

  async function save(status: 'draft' | 'published') {
    setSaving(true); setError(null);
    const payload: ArticleInput = { ...form, status, slug: form.slug || undefined };
    try {
      const result = isNew ? await AdminApi.createArticle(payload) : await AdminApi.updateArticle(articleId!, payload);
      setSavedStatus(result.article.status); setForm((current) => ({ ...current, status: result.article.status, slug: result.article.slug }));
      showSuccess(status === 'published' ? (savedStatus === 'published' ? 'Changes published.' : 'Article published.') + (result.rebuildTriggered ? ' The search-ready page will update in about 2 minutes.' : '') : 'Draft saved.');
      if (isNew) navigate(`/admin/articles/${result.article._id}`, { replace: true });
    } catch (err: any) { setError(err.message); showError(err.message); } finally { setSaving(false); }
  }

  async function unpublish() {
    const confirmed = await askConfirmation({ title: 'Unpublish article?', message: 'The article will be removed from the website and return to draft.', confirmLabel: 'Unpublish' });
    if (confirmed) await save('draft');
  }

  if (loading) return <p className="text-sm text-slate-500">Loading article...</p>;
  const ready = form.title.trim().length >= 5 && form.excerpt.trim().length >= 50 && form.excerpt.trim().length <= 170 && form.content.trim().length >= 300;
  const googleTitle = `${form.title || 'Article title'} | My Inner`;

  return <div className="mx-auto max-w-5xl">
    <Link to="/admin/articles" className="text-xs font-semibold text-[#765c8d]">← Back to articles</Link>
    <div className="mt-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#765c8d]">{isNew ? 'New article' : savedStatus === 'published' ? 'Published article' : 'Draft'}</p><h2 className="mt-2 text-2xl font-semibold text-[#302447]">{form.title || 'Untitled article'}</h2></div>{!isNew && savedStatus === 'published' && <a href={`/blog/${form.slug}`} target="_blank" rel="noreferrer" className="action-link rounded-xl px-4 py-2 text-xs font-semibold">View on website ↗</a>}</div>
    {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

    <section className="mt-6 rounded-2xl border border-[#eee5e9] bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-5">
        <label className="admin-field">Title<input value={form.title} onChange={(e) => update('title', e.target.value)} className="admin-input" placeholder="What Is My Love Language? A Simple Guide" /><span className="mt-1 block text-xs font-normal text-slate-400">Use the question or phrase people type into Google. Aim for under 60 characters. <Counter value={form.title.length} min={5} max={60} /></span></label>
        <label className="admin-field">Page address (URL)<div className="flex items-center overflow-hidden rounded-[.65rem] border border-[#e5dce8]"><span className="shrink-0 bg-[#faf7fb] px-3 py-[.7rem] text-xs text-slate-400">my-inner.com/blog/</span><input value={form.slug} onChange={(e) => { setSlugTouched(true); update('slug', slugify(e.target.value)); }} className="w-full px-3 py-[.7rem] text-sm text-[#302447] outline-none" placeholder="what-is-my-love-language" /></div>{!isNew && savedStatus === 'published' && <span className="mt-1 block text-xs font-normal text-amber-600">Changing the address of a published article breaks links people already shared.</span>}</label>
        <label className="admin-field">Summary (Google description)<textarea value={form.excerpt} onChange={(e) => update('excerpt', e.target.value)} className="admin-input min-h-20" placeholder="One or two sentences that tell readers what they will learn." /><span className="mt-1 block text-xs font-normal text-slate-400">Shown under the title in Google and on the articles page. <Counter value={form.excerpt.trim().length} min={50} max={170} /></span></label>
      </div>
      <div className="mt-6 rounded-xl border border-[#eee5e9] bg-[#fcfbfd] p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Google preview</p><p className="mt-2 truncate text-xs text-slate-500">{SITE_URL.replace(/^https?:\/\//, '')} › blog › {form.slug || '...'}</p><p className="mt-1 truncate text-lg text-[#1a0dab]">{googleTitle}</p><p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">{form.excerpt || 'Your summary will appear here.'}</p></div>
    </section>

    <section className="mt-5 rounded-2xl border border-[#eee5e9] bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold text-[#302447]">Article</h3><div className="flex rounded-xl bg-[#f4eff6] p-1 text-xs font-semibold">{(['write', 'preview'] as const).map((value) => <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-lg px-4 py-1.5 ${tab === value ? 'bg-white text-[#302447] shadow-sm' : 'text-slate-500'}`}>{value === 'write' ? 'Write' : 'Preview'}</button>)}</div></div>
      {tab === 'write' ? <>
        <div className="mt-4 flex flex-wrap gap-1.5">{toolbar.map((action) => <button key={action.label} type="button" title={action.title} onClick={() => applyTool(action)} className="rounded-lg border border-[#e5dce8] bg-white px-3 py-1.5 text-xs font-semibold text-[#62596c] hover:bg-[#f4edf8]">{action.label}</button>)}</div>
        <textarea ref={contentRef} value={form.content} onChange={(e) => update('content', e.target.value)} className="admin-input mt-3 min-h-[28rem] font-mono text-[13px] leading-6" placeholder={'Start with a short introduction that answers the question directly.\n\n## First section heading\n\nWrite in short paragraphs...'} />
        <p className="mt-2 text-xs text-slate-400">Use the buttons for headings and lists. Leave an empty line between paragraphs. {form.content.trim().length < 300 ? <span className="font-semibold text-amber-600">Write at least 300 characters.</span> : <span>{readingMinutes(form.content)} min read.</span>}</p>
      </> : <div className="mt-4 min-h-[28rem] rounded-xl border border-[#eee5e9] p-6">{form.content.trim() ? <Markdown source={form.content} /> : <p className="text-sm text-slate-400">Nothing to preview yet.</p>}</div>}
    </section>

    <section className="mt-5 grid gap-5 rounded-2xl border border-[#eee5e9] bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-8">
      <div><p className="admin-field">Cover image <span className="font-normal text-slate-400">(optional)</span></p>{form.coverImageUrl ? <div className="mt-2"><img src={form.coverImageUrl} alt="" className="aspect-[16/9] w-full rounded-xl object-cover" /><button type="button" onClick={() => update('coverImageUrl', '')} className="mt-2 text-xs font-semibold text-red-600">Remove image</button></div> : <label className="mt-2 flex aspect-[16/9] cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#d9cedd] bg-[#fcfbfd] text-sm text-slate-500 hover:bg-[#f7f2f9]">{uploading ? 'Uploading...' : 'Click to upload (wide image, max 5MB)'}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => uploadCover(e.target.files?.[0])} /></label>}<label className="admin-field mt-3">Image description<input value={form.coverImageAlt} onChange={(e) => update('coverImageAlt', e.target.value)} className="admin-input" placeholder="Woman journaling by a window" /><span className="mt-1 block text-xs font-normal text-slate-400">Describes the image for Google and screen readers.</span></label></div>
      <div><label className="admin-field">Related test<select value={form.relatedTestSlug} onChange={(e) => update('relatedTestSlug', e.target.value)} className="admin-input"><option value="">No related test</option>{tests.map((test) => <option key={test.slug} value={test.slug}>{test.name}</option>)}</select><span className="mt-1 block text-xs font-normal text-slate-400">A “Take the test” box appears at the end of the article. This is how articles turn readers into customers.</span></label>
        <div className="mt-5 rounded-xl bg-[#f7f2f9] p-4 text-xs leading-5 text-[#62596c]"><p className="font-semibold text-[#302447]">Tips for ranking on Google</p><ul className="mt-2 list-disc space-y-1 pl-4"><li>Answer the question in the first paragraph.</li><li>Use H2 headings for each main point.</li><li>Write original content, at least 800 words for important topics.</li><li>Link to related tests and other articles.</li></ul></div></div>
    </section>

    <div className="sticky bottom-0 z-10 mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[#eee5e9] bg-[#f8f6f8]/95 py-4 backdrop-blur">
      {!ready && <p className="mr-auto text-xs text-amber-600">Add a title, a 50–170 character summary and at least 300 characters of article text to save.</p>}
      {savedStatus === 'published' && !isNew ? <>
        <button type="button" onClick={unpublish} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 disabled:opacity-50">Unpublish</button>
        <button type="button" onClick={() => save('published')} disabled={saving || uploading || !ready} className="rounded-xl bg-[#765c8d] px-6 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-50">{saving ? 'Saving...' : 'Update article'}</button>
      </> : <>
        <button type="button" onClick={() => save('draft')} disabled={saving || uploading || !ready} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 disabled:opacity-50">{saving ? 'Saving...' : 'Save draft'}</button>
        <button type="button" onClick={() => save('published')} disabled={saving || uploading || !ready} className="rounded-xl bg-[#765c8d] px-6 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-50">Publish</button>
      </>}
    </div>
  </div>;
}
