import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminApi } from '../api/adminEndpoints';
import type { AdminArticle } from '../types';
import { useAdminFeedback } from './AdminFeedback';

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

export function AdminArticles() {
  const { showSuccess, showError, askConfirmation } = useAdminFeedback();
  const [articles, setArticles] = useState<AdminArticle[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() { AdminApi.listArticles().then((res) => setArticles(res.articles)).catch((err) => setError(err.message)); }
  useEffect(load, []);

  async function remove(article: AdminArticle) {
    const confirmed = await askConfirmation({ title: 'Delete article?', message: `"${article.title}" will be permanently deleted${article.status === 'published' ? ' and removed from the website' : ''}.`, confirmLabel: 'Delete', danger: true });
    if (!confirmed) return;
    try { await AdminApi.deleteArticle(article._id); showSuccess('Article deleted.'); load(); } catch (err: any) { showError(err.message); }
  }

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="text-xl font-semibold text-[#302447]">Articles</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Write guides that answer what people search for on Google, then link each one to a related test.</p></div>
      <Link to="/admin/articles/new" className="action-primary rounded-xl px-5 py-3 text-sm font-semibold shadow-sm">+ New article</Link>
    </div>
    {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {!articles && !error && <p className="mt-8 text-sm text-slate-500">Loading articles...</p>}
    {articles && articles.length === 0 && <div className="mt-8 rounded-2xl border border-dashed border-[#d9cedd] bg-white p-10 text-center"><p className="font-semibold text-[#302447]">No articles yet</p><p className="mt-2 text-sm text-slate-500">Start with a question people ask, for example “What is my love language?”.</p><Link to="/admin/articles/new" className="action-primary mt-5 inline-flex rounded-xl px-5 py-3 text-sm font-semibold">Write the first article</Link></div>}
    {articles && articles.length > 0 && <div className="admin-table-wrap mt-6"><table className="w-full min-w-[640px] text-left text-sm">
      <thead><tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Published</th><th className="px-4 py-3">Last edited</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
      <tbody>{articles.map((article) => <tr key={article._id}>
        <td className="px-4 py-3"><Link to={`/admin/articles/${article._id}`} className="font-semibold text-[#302447] hover:text-[#765c8d]">{article.title}</Link><span className="block text-xs text-slate-400">/blog/{article.slug}</span></td>
        <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${article.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{article.status === 'published' ? 'Published' : 'Draft'}</span></td>
        <td className="px-4 py-3 text-slate-500">{formatDate(article.publishedAt)}</td>
        <td className="px-4 py-3 text-slate-500">{formatDate(article.updatedAt)}</td>
        <td className="px-4 py-3"><div className="flex justify-end gap-2">{article.status === 'published' && <a href={`/blog/${article.slug}`} target="_blank" rel="noreferrer" className="action-link rounded-lg px-3 py-1.5 text-xs font-semibold">View</a>}<Link to={`/admin/articles/${article._id}`} className="action-link rounded-lg px-3 py-1.5 text-xs font-semibold">Edit</Link><button type="button" onClick={() => remove(article)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button></div></td>
      </tr>)}</tbody>
    </table></div>}
  </div>;
}
