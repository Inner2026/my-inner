import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArticlesApi } from '../api/endpoints';
import { PublicArticle } from '../types';
import { LoadingScreen } from '../components/LoadingScreen';
import { formatArticleDate } from '../lib/articleFormat';

export function Blog() {
  const [articles, setArticles] = useState<PublicArticle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { ArticlesApi.list().then((res) => setArticles(res.articles)).catch((err) => setError(err.message)); }, []);

  if (!articles && !error) return <LoadingScreen message="Gathering articles..." detail="Reflections and guides are on their way." />;

  return <div className="tests-page min-h-[calc(100vh-74px)] px-4 py-12 sm:px-8 sm:py-16"><div className="mx-auto max-w-6xl">
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#765c8d]">Articles</p>
      <h1 className="mt-4 font-serif text-4xl tracking-tight text-[#283452] sm:text-5xl">Guides for knowing yourself better.</h1>
      <p className="mt-4 text-base leading-7 text-[#62596c]">Reflections on personality, emotions and relationships, written to help you understand the patterns behind how you feel and connect.</p>
    </div>
    {error && <p className="mx-auto mt-10 max-w-xl rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">{error}</p>}
    {articles && articles.length === 0 && <p className="mx-auto mt-12 max-w-md text-center text-sm text-[#737080]">New articles are coming soon. In the meantime, <Link to="/tests" className="font-semibold text-[#765c8d] underline">explore our tests</Link>.</p>}
    {articles && articles.length > 0 && <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => <Link key={article.slug} to={`/blog/${article.slug}`} className="test-card group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-[#eee5e9] bg-white shadow-[0_10px_35px_rgba(73,57,88,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(73,57,88,0.1)]">
        <div className="aspect-[16/9] overflow-hidden bg-[#f4edf7]">{article.coverImageUrl ? <img src={article.coverImageUrl} alt={article.coverImageAlt || ''} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center font-serif text-2xl text-[#765c8d]/50">My Inner</div>}</div>
        <div className="flex flex-1 flex-col p-6">
          <p className="text-xs text-[#9a90a5]">{formatArticleDate(article.publishedAt)}</p>
          <h2 className="mt-2 font-serif text-xl leading-snug text-[#302447]">{article.title}</h2>
          <p className="mt-3 flex-1 text-sm leading-6 text-[#62596c]">{article.excerpt}</p>
          <span className="mt-5 text-sm font-semibold text-[#765c8d]">Read article →</span>
        </div>
      </Link>)}
    </div>}
  </div></div>;
}
