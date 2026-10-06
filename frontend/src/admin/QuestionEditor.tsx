import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AdminApi } from '../api/adminEndpoints';

const emptyOption = () => ({ text: '', numericalValue: '', scoringCategory: '', scoringDirection: '', resultMapping: '', isCorrect: false, order: 1 });
const emptyQuestion = () => ({ categoryKey: '', questionText: '', questionType: 'multiple_choice', order: 1, answerOptions: [emptyOption(), { ...emptyOption(), order: 2 }] });

export function QuestionEditor() {
  const { versionId } = useParams<{ versionId: string }>();
  const [questions, setQuestions] = useState<any[]>([]);
  const [draft, setDraft] = useState<any>(emptyQuestion());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [version, setVersion] = useState<any>(null);
  const isMbti = version?.scoringMethod === 'WEIGHTED_DICHOTOMY';

  const refresh = () => { if (!versionId) return; setLoading(true); AdminApi.listQuestions(versionId).then((res) => setQuestions(res.questions)).catch((e) => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(() => {
    if (!versionId) return;
    AdminApi.getVersion(versionId).then((res) => setVersion(res.version)).catch((e) => setError(e.message));
    refresh();
  }, [versionId]);

  function edit(question: any) { setEditingId(question._id); setDraft({ ...question, categoryKey: question.categoryKey ?? '', answerOptions: question.answerOptions.map((option: any) => ({ ...option, numericalValue: option.numericalValue ?? '', scoringCategory: option.scoringCategory ?? '', scoringDirection: option.scoringDirection ?? '', resultMapping: option.resultMapping ?? '', isCorrect: option.isCorrect === true })) }); setMessage(null); }
  function reset() { setEditingId(null); setDraft({ ...emptyQuestion(), order: questions.length + 1 }); }
  function updateOption(index: number, key: string, value: unknown) { setDraft((current: any) => ({ ...current, answerOptions: current.answerOptions.map((option: any, i: number) => i === index ? { ...option, [key]: value } : option) })); }
  function markCorrect(index: number) { setDraft((current: any) => ({ ...current, answerOptions: current.answerOptions.map((option: any, i: number) => ({ ...option, isCorrect: i === index })) })); }
  function addOption() { setDraft((current: any) => ({ ...current, answerOptions: [...current.answerOptions, { ...emptyOption(), order: current.answerOptions.length + 1 }] })); }
  function removeOption(index: number) { setDraft((current: any) => ({ ...current, answerOptions: current.answerOptions.filter((_: any, i: number) => i !== index).map((option: any, i: number) => ({ ...option, order: i + 1 })) })); }

  async function syncApprovedMbti() {
    if (!versionId || version?.status !== 'draft' || !window.confirm('Replace the current MBTI questions with the approved 60-question assessment?')) return;
    setError(null); setMessage(null);
    try {
      await AdminApi.syncMbtiVersion(versionId);
      setMessage('تم استبدال أسئلة وإجابات MBTI بالنسخة المعتمدة ذات الأربع اختيارات.');
      reset();
      refresh();
    } catch (e: any) { setError(e.message); }
  }

  async function save() {
    if (!versionId || !draft.questionText.trim() || draft.answerOptions.length < 2 || draft.answerOptions.some((option: any) => !option.text.trim())) { setError('اكتبي السؤال واختاري إجابتين على الأقل، وكل إجابة يجب أن تحتوي على نص.'); return; }
    setSaving(true); setError(null); setMessage(null);
    const payload = { ...draft, testVersionId: versionId, order: Number(draft.order), categoryKey: draft.categoryKey || null, answerOptions: draft.answerOptions.map((option: any, index: number) => ({ ...option, order: index + 1, numericalValue: option.numericalValue === '' ? null : Number(option.numericalValue), scoringCategory: option.scoringCategory || null, scoringDirection: option.scoringDirection || null, resultMapping: option.resultMapping || null, isCorrect: option.isCorrect === true })) };
    try { if (editingId) await AdminApi.updateQuestion(editingId, payload); else await AdminApi.addQuestion(payload); setMessage(editingId ? 'تم تحديث السؤال.' : 'تمت إضافة السؤال.'); reset(); refresh(); }
    catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }

  async function remove(question: any) { if (!window.confirm('هل تريدين حذف هذا السؤال؟')) return; try { await AdminApi.deleteQuestion(question._id); setMessage('تم حذف السؤال.'); refresh(); } catch (e: any) { setError(e.message); } }

  return <div><div className="flex flex-wrap items-start justify-between gap-3"><div><Link to="-1" onClick={(event) => { event.preventDefault(); window.history.back(); }} className="text-xs font-semibold text-[#765c8d]">← Back</Link><h1 className="mt-3 text-xl font-semibold text-[#302447]">Questions</h1><p className="mt-1 text-sm text-slate-500">أضيفي وعدّلي الأسئلة والاختيارات من هنا. لا يمكن تعديل النسخ المنشورة؛ انسخيها أولًا.</p></div><div className="flex flex-wrap gap-2">{isMbti && <button onClick={syncApprovedMbti} disabled={version?.status !== 'draft'} className="rounded-xl bg-[#f1ebf5] px-4 py-2 text-sm font-semibold text-[#765c8d] disabled:cursor-not-allowed disabled:opacity-50">Sync approved MBTI answers</button>}<button onClick={reset} className="rounded-xl bg-[#765c8d] px-4 py-2 text-sm font-semibold text-white">Add question</button></div></div>
    {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}{message && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
    <section className="mt-5 rounded-2xl border border-[#eee5e9] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold text-[#302447]">{editingId ? 'Edit question' : 'New question'}</h2>{editingId && <button onClick={reset} className="text-xs text-slate-500">Cancel</button>}</div>{isMbti && <p className="mt-3 rounded-xl bg-[#f1ebf5] px-4 py-3 text-sm text-[#5d4b82]">MBTI: اختاري لكل إجابة Scoring category (مثل E أو I) وNumerical value = 1. لا تحتاجين اختيار Correct answer أو Result mapping.</p>}<div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="admin-field sm:col-span-2">Question text<input value={draft.questionText} onChange={(e) => setDraft({ ...draft, questionText: e.target.value })} className="admin-input" /></label><label className="admin-field">Order<input type="number" min="1" value={draft.order} onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })} className="admin-input" /></label><label className="admin-field">Category key<input value={draft.categoryKey} onChange={(e) => setDraft({ ...draft, categoryKey: e.target.value })} className="admin-input" /></label><label className="admin-field">Question type<select value={draft.questionType} onChange={(e) => setDraft({ ...draft, questionType: e.target.value })} className="admin-input"><option value="multiple_choice">Multiple choice</option><option value="likert">Likert</option></select></label></div><h3 className="mt-6 text-sm font-semibold text-[#302447]">Answer options</h3><p className="mt-1 text-xs text-slate-500">{isMbti ? 'كل اختيار لازم يكون مربوطاً بأحد حروف MBTI.' : 'For score-by-correct-answer tests, mark one correct option.'}</p><div className="mt-3 space-y-3">{draft.answerOptions.map((option: any, index: number) => <div key={index} className={`rounded-xl border p-3 ${option.isCorrect ? 'border-emerald-300 bg-emerald-50/40' : 'border-[#eee5e9] bg-[#fcfafc]'}`}><div className="flex gap-2"><input placeholder={`Option ${index + 1}`} value={option.text} onChange={(e) => updateOption(index, 'text', e.target.value)} className="admin-input flex-1" />{!isMbti && <label className="flex items-center gap-2 whitespace-nowrap px-2 text-xs font-semibold text-emerald-700"><input type="radio" name="correct-option" checked={option.isCorrect === true} onChange={() => markCorrect(index)} /> Correct</label>}<button onClick={() => removeOption(index)} disabled={draft.answerOptions.length <= 2} className="px-2 text-sm text-red-500 disabled:opacity-30">Remove</button></div><div className={`mt-2 grid gap-2 ${isMbti ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}><input placeholder="Numerical value" value={option.numericalValue} onChange={(e) => updateOption(index, 'numericalValue', e.target.value)} className="admin-input" /><input placeholder="Scoring category" value={option.scoringCategory} onChange={(e) => updateOption(index, 'scoringCategory', e.target.value)} className="admin-input" /><select value={option.scoringDirection} onChange={(e) => updateOption(index, 'scoringDirection', e.target.value)} className="admin-input"><option value="">Direction</option><option value="positive">Positive</option><option value="negative">Negative</option></select>{!isMbti && <input placeholder="Result mapping" value={option.resultMapping} onChange={(e) => updateOption(index, 'resultMapping', e.target.value)} className="admin-input" />}</div></div>)}</div><div className="mt-4 flex flex-wrap gap-2"><button onClick={addOption} className="rounded-lg border border-[#d9cedd] px-3 py-2 text-xs font-semibold text-[#765c8d]">+ Add option</button><button onClick={save} disabled={saving} className="rounded-lg bg-[#765c8d] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : editingId ? 'Save changes' : 'Add question'}</button></div></section>
    <section className="mt-5"><h2 className="font-semibold text-[#302447]">Saved questions ({questions.length})</h2>{loading ? <p className="mt-3 text-sm text-slate-500">Loading questions...</p> : questions.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-[#d9cedd] p-8 text-center text-sm text-slate-500">No questions yet.</p> : <div className="mt-3 space-y-3">{questions.map((question) => <div key={question._id} className="rounded-2xl border border-[#eee5e9] bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[#765c8d]">#{question.order} · {question.categoryKey || 'No category'}</p><p className="mt-1 font-medium text-[#302447]">{question.questionText}</p><p className="mt-2 text-xs text-slate-500">{question.answerOptions.length} answer options</p></div><div className="flex gap-2"><button onClick={() => edit(question)} className="rounded-lg bg-[#f1ebf5] px-3 py-2 text-xs font-semibold text-[#765c8d]">Edit</button><button onClick={() => remove(question)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">Delete</button></div></div></div>)}</div>}</section>
  </div>;
}
