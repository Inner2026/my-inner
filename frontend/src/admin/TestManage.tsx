import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminApi } from '../api/adminEndpoints';

const SCORING_METHODS = [
  'WEIGHTED_DICHOTOMY',
  'CATEGORY_SUM_RANGE',
  'CATEGORY_SUM_RANKING',
  'CORRECT_ANSWER_PERCENTAGE',
  'TALLY_MAPPING',
  'CATEGORY_AVERAGE_BAND',
  'FRAMEWORK_SNIPPET_ASSEMBLY'
  ,'TRAIT_BAND_ASSEMBLY'
];

const SCORING_METHOD_INFO: Record<string, { label: string; help: string }> = {
  WEIGHTED_DICHOTOMY: { label: 'اختيارات ثنائية بأوزان', help: 'يحسب النتيجة بين اتجاهين أو أكثر باستخدام وزن كل إجابة، مثل MBTI.' },
  CATEGORY_SUM_RANGE: { label: 'مجموع الفئات ونطاقات النتائج', help: 'يجمع نقاط كل فئة ثم يحدد النتيجة حسب نطاق النقاط.' },
  CATEGORY_SUM_RANKING: { label: 'ترتيب الفئات حسب المجموع', help: 'يرتب الفئات من الأعلى إلى الأقل ويحدد النتيجة الأساسية والثانوية.' },
  CORRECT_ANSWER_PERCENTAGE: { label: 'نسبة الإجابات الصحيحة', help: 'يقارن الإجابات الصحيحة بالإجابات الكاملة ويحسب النسبة المئوية.' },
  TALLY_MAPPING: { label: 'تجميع وربط النتائج', help: 'يجمع اختيار المستخدم ويربطه بنتيجة محددة، مثل اختبار الحيوان.' },
  CATEGORY_AVERAGE_BAND: { label: 'متوسط الفئة والنطاق', help: 'يحسب متوسط كل فئة ثم يصنفه إلى منخفض أو متوسط أو مرتفع.' },
  FRAMEWORK_SNIPPET_ASSEMBLY: { label: 'تركيب النتيجة من أجزاء', help: 'يجمع أجزاء وصفية من الإجابات لتكوين نتيجة مركبة، مثل اختبار المكعب.' }
  ,TRAIT_BAND_ASSEMBLY: { label: 'شرائح سمات', help: 'يحسب أوزان السمات ثم يطابقها مع نطاقات النتائج المحددة.' }
};

export function TestManage() {
  const { testId } = useParams<{ testId: string }>();
  const [tests, setTests] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newVersion, setNewVersion] = useState({ versionLabel: '1.0', expectedQuestionCount: 10, scoringMethod: SCORING_METHODS[0], categoriesJson: '[]', scoringConfigJson: '{}' });

  // NOTE: the backend does not (yet) expose a "list versions for a test" endpoint,
  // so this simplified admin view lets you create a version and jump straight to
  // its question/result editors, and validate/publish once versionId is known.
  const [versionId, setVersionId] = useState('');
  const [validation, setValidation] = useState<{ valid: boolean; issues: any[] } | null>(null);
  const [testForm, setTestForm] = useState({ name: '', description: '', imageUrl: '', priceCents: 0, active: false });
  const [savingTest, setSavingTest] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [marketingMessage, setMarketingMessage] = useState<string | null>(null);
  const [versionForm, setVersionForm] = useState({ versionLabel: '', expectedQuestionCount: 0, scoringMethod: SCORING_METHODS[0], categoriesJson: '[]', scoringConfigJson: '{}' });

  useEffect(() => {
    if (!testId) return;
    Promise.all([AdminApi.listTests(), AdminApi.listVersions(testId)]).then(([testRes, versionRes]) => { setTests(testRes.tests); setVersions(versionRes.versions); setVersionId(versionRes.versions.find((version) => version.isCurrent)?._id ?? versionRes.versions[0]?._id ?? ''); }).catch((e) => setError(e.message));
  }, [testId]);

  const test = tests.find((t) => t._id === testId);
  const isMbti = test?.slug === 'mbti-style';
  useEffect(() => { if (test) setTestForm({ name: test.name, description: test.description, imageUrl: test.imageUrl ?? '', priceCents: test.price?.amount ?? 0, active: test.active }); }, [test]);
  useEffect(() => {
    const selected = versions.find((version) => version._id === versionId);
    if (selected) setVersionForm({
      versionLabel: selected.versionLabel,
      expectedQuestionCount: selected.expectedQuestionCount,
      scoringMethod: selected.scoringMethod,
      categoriesJson: JSON.stringify(selected.categories ?? [], null, 2),
      scoringConfigJson: JSON.stringify(selected.scoringConfig ?? {}, null, 2)
    });
  }, [versionId, versions]);

  async function handleSaveTest() {
    if (!testId) return;
    setSavingTest(true); setError(null);
    try { const { test: updated } = await AdminApi.updateTest(testId, testForm); setTests((prev) => prev.map((item) => item._id === updated._id ? updated : item)); }
    catch (e: any) { setError(e.message); } finally { setSavingTest(false); }
  }

  async function handleCreateVersion() {
    if (!testId) return;
    setError(null);
    try {
      const categories = JSON.parse(newVersion.categoriesJson);
      const scoringConfig = JSON.parse(newVersion.scoringConfigJson);
      if (!Array.isArray(categories) || typeof scoringConfig !== 'object' || scoringConfig === null || Array.isArray(scoringConfig)) throw new Error('Categories must be an array and scoring config must be a JSON object.');
      const { version } = await AdminApi.createVersion({ testId, versionLabel: newVersion.versionLabel, expectedQuestionCount: newVersion.expectedQuestionCount, scoringMethod: newVersion.scoringMethod, categories, scoringConfig });
      setVersionId(version._id);
      setVersions((prev) => [version, ...prev]);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleCloneVersion() {
    const current = versions.find((version) => version._id === versionId);
    if (!current) return;
    try { const { version } = await AdminApi.cloneVersion(current._id, `${current.versionLabel}-draft`); setVersions((prev) => [version, ...prev]); setVersionId(version._id); }
    catch (e: any) { setError(e.message); }
  }

  async function handleSaveVersion() {
    if (!versionId) return;
    setSavingVersion(true); setError(null);
    try {
      const categories = JSON.parse(versionForm.categoriesJson);
      const scoringConfig = JSON.parse(versionForm.scoringConfigJson);
      if (!Array.isArray(categories) || typeof scoringConfig !== 'object' || scoringConfig === null || Array.isArray(scoringConfig)) throw new Error('Categories must be an array and scoring config must be a JSON object.');
      const { version } = await AdminApi.updateVersion(versionId, { versionLabel: versionForm.versionLabel, expectedQuestionCount: versionForm.expectedQuestionCount, scoringMethod: versionForm.scoringMethod, categories, scoringConfig });
      setVersions((prev) => prev.map((item) => item._id === version._id ? version : item));
    }
    catch (e: any) { setError(e.message); } finally { setSavingVersion(false); }
  }

  async function handleValidate() {
    if (!versionId) return;
    const report = await AdminApi.validateVersion(versionId);
    setValidation(report);
  }

  async function handlePreview() {
    if (!versionId) return;
    setError(null); setPreviewResult(null);
    try {
      const { questions } = await AdminApi.listQuestions(versionId);
      if (!questions.length) throw new Error('Add questions before previewing this version.');
      const answers = questions.map((question: any) => ({ questionId: question._id, answerOptionId: question.answerOptions[0]?._id })).filter((answer: any) => answer.answerOptionId);
      const { result } = await AdminApi.previewVersion(versionId, answers);
      setPreviewResult(result);
    } catch (e: any) { setError(e.message); }
  }

  async function handleMarketingNotification() {
    if (!testId || !window.confirm('Send this notification to opted-in users with email addresses?')) return;
    setError(null); setMarketingMessage(null);
    try { const result = await AdminApi.sendNewTestNotification(testId); setMarketingMessage(`Notification: ${result.sent} sent, ${result.skipped} skipped, ${result.failed} failed.`); }
    catch (e: any) { setError(e.message); }
  }


  async function handlePublish() {
    if (!versionId) return;
    setError(null);
    try {
      await AdminApi.publishVersion(versionId);
      alert('Version published. You can now choose Active or Inactive from the test details or Tests list.');
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleSyncMbti() {
    if (!versionId || !window.confirm('Replace this draft with the approved 60-question MBTI assessment?')) return;
    setError(null);
    try {
      const { version } = await AdminApi.syncMbtiVersion(versionId);
      setVersions((prev) => prev.map((item) => item._id === version._id ? version : item));
      alert('MBTI questions and scoring were synced from the approved assessment.');
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4"><div><Link to="/admin" className="text-xs font-semibold text-[#765c8d]">← Back to tests</Link><h1 className="mt-3 text-xl font-semibold text-slate-900">{test?.name ?? 'Test'}</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Create and publish the content version that customers will take. A version keeps questions, scoring, and result definitions together.</p></div>{test && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${test.active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{test.active ? 'Published' : 'Draft'}</span>}</div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {marketingMessage && <p className="mt-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{marketingMessage}</p>}

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4"><h2 className="font-medium text-slate-900">Edit test details</h2><p className="mt-1 text-sm text-slate-500">Update the public name, description, image, price, or availability. Published question content remains versioned.</p><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="admin-field">Name<input value={testForm.name} onChange={(e) => setTestForm({ ...testForm, name: e.target.value })} className="admin-input" /></label><label className="admin-field">Price in cents<input type="number" min="0" value={testForm.priceCents} onChange={(e) => setTestForm({ ...testForm, priceCents: Number(e.target.value) })} className="admin-input" /></label><label className="admin-field md:col-span-2">Description<textarea value={testForm.description} onChange={(e) => setTestForm({ ...testForm, description: e.target.value })} className="admin-input min-h-24" /></label><label className="admin-field md:col-span-2">Test page image URL<span className="admin-help">Use an https image URL or a path such as /test-backgrounds/inner-child.png. Leave blank to use the default image.</span><input value={testForm.imageUrl} onChange={(e) => setTestForm({ ...testForm, imageUrl: e.target.value })} className="admin-input" placeholder="https://... or /test-backgrounds/..." /></label>{testForm.imageUrl && <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 md:col-span-2"><img src={testForm.imageUrl} alt="Test page preview" className="h-44 w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} /></div>}<label className="flex items-center gap-2 text-sm font-semibold text-[#302447]"><input type="checkbox" checked={testForm.active} onChange={(e) => setTestForm({ ...testForm, active: e.target.checked })} /> Active on public website</label></div><button onClick={handleSaveTest} disabled={savingTest || !testForm.name || !testForm.description} className="mt-4 rounded-xl bg-[#765c8d] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{savingTest ? 'Saving...' : 'Save test details'}</button></div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3"><span className="admin-step">1</span><div><h2 className="font-medium text-slate-900">Create a new version</h2><p className="mt-1 text-sm text-slate-500">Start here before adding questions or result definitions.</p></div></div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="admin-field">Version label<span className="admin-help">Example: 1.0</span>
          <input
            placeholder="Version label (e.g. 1.0)"
            value={newVersion.versionLabel}
            onChange={(e) => setNewVersion({ ...newVersion, versionLabel: e.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          /></label>
          <label className="admin-field">Expected question count<span className="admin-help">Must match the questions you upload</span>
          <input
            type="number"
            placeholder="Expected question count"
            value={newVersion.expectedQuestionCount}
            onChange={(e) => setNewVersion({ ...newVersion, expectedQuestionCount: parseInt(e.target.value, 10) })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          /></label>
          <label className="admin-field">طريقة احتساب النتيجة<span className="admin-help">كيف تتحول الإجابات إلى نتيجة</span>
          <select
            value={newVersion.scoringMethod}
            onChange={(e) => setNewVersion({ ...newVersion, scoringMethod: e.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {SCORING_METHODS.map((m) => (
              <option key={m} value={m}>{SCORING_METHOD_INFO[m].label}</option>
            ))}
          </select><span className="admin-help">{SCORING_METHOD_INFO[newVersion.scoringMethod]?.help}</span></label>
          <label className="admin-field md:col-span-3">Categories JSON<span className="admin-help">Example: [{`{ "key": "trust", "name": "Trust" }`}]</span><textarea value={newVersion.categoriesJson} onChange={(e) => setNewVersion({ ...newVersion, categoriesJson: e.target.value })} className="admin-input min-h-24 font-mono text-xs" /></label>
          <label className="admin-field md:col-span-3">Scoring configuration JSON<span className="admin-help">Example: {`{ "dichotomies": [["E", "I"], ["S", "N"]] }`}</span><textarea value={newVersion.scoringConfigJson} onChange={(e) => setNewVersion({ ...newVersion, scoringConfigJson: e.target.value })} className="admin-input min-h-24 font-mono text-xs" /></label>
        </div>
        <button onClick={handleCreateVersion} className="mt-5 rounded-xl bg-[#765c8d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
          Create version
        </button>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="font-medium text-slate-900">Version history</h2><p className="mt-1 text-sm text-slate-500">Published versions remain immutable so historical results stay traceable.</p></div><button onClick={handleCloneVersion} disabled={!versionId} className="rounded-lg bg-[#f1ebf5] px-3 py-2 text-xs font-semibold text-[#765c8d] disabled:opacity-40">Clone selected</button></div><div className="mt-4 space-y-2">{versions.length === 0 ? <p className="text-sm text-slate-500">No versions yet.</p> : versions.map((version) => <button key={version._id} onClick={() => setVersionId(version._id)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm ${version._id === versionId ? 'border-[#765c8d] bg-[#faf6fc]' : 'border-slate-200'}`}><span><b>{version.versionLabel}</b><small className="ml-2 text-slate-400">{version.expectedQuestionCount} questions · {version.scoringMethod}</small></span><span className="text-xs text-slate-500">{version.isCurrent ? 'Current · ' : ''}{version.status}</span></button>)}</div></div>

      {versionId && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3"><span className="admin-step">2</span><div><h2 className="font-medium text-slate-900">{isMbti ? 'Publish the MBTI test' : 'Build and publish this version'}</h2><p className="mt-1 text-sm text-slate-500">{isMbti ? 'The approved 60 questions are ready. Follow the three buttons below.' : 'Add all questions and result definitions, validate the version, then publish it for customers.'}</p></div></div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {!isMbti && <><Link to={`/admin/versions/${versionId}/questions`} className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-700">Manage questions</Link><Link to={`/admin/versions/${versionId}/results`} className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-700">Manage result definitions</Link><button onClick={handlePreview} className="rounded-md bg-[#f1ebf5] px-3 py-1.5 text-[#765c8d]">Preview scoring</button><button onClick={handleMarketingNotification} disabled={!test?.active} className="rounded-md bg-[#f1ebf5] px-3 py-1.5 text-[#765c8d] disabled:opacity-40">Notify subscribers</button></>}
            {isMbti && versions.find((version) => version._id === versionId)?.status === 'draft' && <button onClick={handleSyncMbti} className="rounded-md bg-[#765c8d] px-4 py-2 font-semibold text-white">1. Sync questions</button>}
            <button onClick={handleValidate} className="rounded-md bg-slate-100 px-4 py-2 font-semibold text-slate-700">{isMbti ? '2. Check version' : 'Validate'}</button>
            <button onClick={handlePublish} className="rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white">{isMbti ? '3. Publish MBTI' : 'Publish version'}</button>
          </div>
          {versions.find((version) => version._id === versionId)?.status === 'draft' && !isMbti && <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-3"><label className="admin-field">Version label<input value={versionForm.versionLabel} onChange={(e) => setVersionForm({ ...versionForm, versionLabel: e.target.value })} className="admin-input" /></label><label className="admin-field">Expected questions<input type="number" min="1" value={versionForm.expectedQuestionCount} onChange={(e) => setVersionForm({ ...versionForm, expectedQuestionCount: Number(e.target.value) })} className="admin-input" /></label><label className="admin-field">Scoring method<select value={versionForm.scoringMethod} onChange={(e) => setVersionForm({ ...versionForm, scoringMethod: e.target.value })} className="admin-input">{SCORING_METHODS.map((method) => <option key={method} value={method}>{SCORING_METHOD_INFO[method].label}</option>)}</select></label><label className="admin-field md:col-span-3">Categories JSON<textarea value={versionForm.categoriesJson} onChange={(e) => setVersionForm({ ...versionForm, categoriesJson: e.target.value })} className="admin-input min-h-24 font-mono text-xs" /></label><label className="admin-field md:col-span-3">Scoring configuration JSON<span className="admin-help">Use this for dichotomies or bands.</span><textarea value={versionForm.scoringConfigJson} onChange={(e) => setVersionForm({ ...versionForm, scoringConfigJson: e.target.value })} className="admin-input min-h-24 font-mono text-xs" /></label><button onClick={handleSaveVersion} disabled={savingVersion || !versionForm.versionLabel || versionForm.expectedQuestionCount < 1} className="w-fit rounded-xl bg-[#765c8d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{savingVersion ? 'Saving...' : 'Save version settings'}</button></div>}
          {validation && (
            <div className="mt-3 text-sm">
              <p className={validation.valid ? 'text-emerald-600' : 'text-amber-600'}>
                {validation.valid ? 'Valid -- ready to publish.' : 'Not ready to publish:'}
              </p>
              <ul className="mt-1 list-disc pl-5 text-slate-600">
                {validation.issues.map((issue, i) => (
                  <li key={i}>
                    [{issue.field}] {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {previewResult && <div className="mt-4 rounded-xl border border-[#d9cedd] bg-[#faf6fc] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#765c8d]">Preview result</p><h3 className="mt-1 font-semibold text-[#302447]">{previewResult.snapshot?.title}</h3><p className="mt-1 whitespace-pre-line text-sm text-slate-600">{previewResult.snapshot?.description}</p><p className="mt-2 text-xs text-slate-500">Result key: {previewResult.resultKey}</p></div>}
        </div>
      )}
    </div>
  );
}
