import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArticlesApi, TestsApi } from '../api/endpoints';
import { PublicArticle, PublicTest } from '../types';
import { LoadingScreen } from '../components/LoadingScreen';
import { Markdown } from '../components/Markdown';
import { formatArticleDate, readingMinutes } from '../lib/articleFormat';
import { NotFound } from './NotFound';

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<PublicArticle | null>(null);
  const [missing, setMissing] = useState(false);
  const [relatedTest, setRelatedTest] = useState<PublicTest | null>(null);
  const [moreArticles, setMoreArticles] = useState<PublicArticle[]>([]);

  useEffect(() => {
    let cancelled = false;
    setArticle(null); setMissing(false); setRelatedTest(null);
    if (!slug) return;
    ArticlesApi.getBySlug(slug).then((res) => {
      if (cancelled) return;
      setArticle(res.article);
      if (res.article.relatedTestSlug) TestsApi.getBySlug(res.article.relatedTestSlug).then((t) => { if (!cancelled) setRelatedTest(t.test); }).catch(() => undefined);
    }).catch(() => { if (!cancelled) setMissing(true); });
    ArticlesApi.list().then((res) => { if (!cancelled) setMoreArticles(res.articles.filter((item) => item.slug !== slug).slice(0, 3)); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [slug]);

  if (missing) return <NotFound />;
  if (!article) return <LoadingScreen message="Opening the article..." detail="Settling in with something to read." />;

  return <div className="min-h-[calc(100vh-74px)] bg-[#fcfaf9] px-4 py-8 sm:px-8 sm:py-12"><article className="mx-auto max-w-3xl">
    <nav aria-label="Breadcrumb" className="text-xs text-[#9a90a5]"><Link to="/" className="hover:text-[#765c8d]">Home</Link><span className="mx-2">/</span><Link to="/blog" className="hover:text-[#765c8d]">Articles</Link></nav>
    <header className="mt-6">
      <h1 className="font-serif text-4xl leading-tight tracking-tight text-[#283452] sm:text-5xl">{article.title}</h1>
      <p className="mt-4 text-lg leading-8 text-[#62596c]">{article.excerpt}</p>
      <p className="mt-5 text-sm text-[#9a90a5]">{article.publishedAt && <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>}{article.content && <> · {readingMinutes(article.content)} min read</>}</p>
    </header>
    {article.coverImageUrl && <img src={article.coverImageUrl} alt={article.coverImageAlt || ''} className="mt-8 aspect-[16/9] w-full rounded-[1.5rem] object-cover shadow-[0_18px_60px_rgba(73,57,88,0.08)]" />}
    <Markdown source={article.content ?? ''} className="mt-10" />

    {relatedTest && <aside className="mt-14 overflow-hidden rounded-[1.75rem] border border-white bg-gradient-to-r from-[#f3e9ed] via-[#fbf5f3] to-[#f1ebf5] p-7 shadow-[0_18px_50px_rgba(73,57,88,0.07)] sm:p-9">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#765c8d]">Take the test</p>
      <h2 className="mt-3 font-serif text-2xl text-[#302447]">{relatedTest.name}</h2>
      <p className="mt-3 text-sm leading-6 text-[#62596c]">{relatedTest.description}</p>
      <Link to={`/tests/${relatedTest.slug}`} className="mt-6 inline-flex rounded-full bg-[#765c8d] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#765c8d]/20 transition hover:-translate-y-0.5 hover:bg-[#634a78]">Start the test →</Link>
    </aside>}

    {moreArticles.length > 0 && <section className="mt-16 border-t border-[#eee5e9] pt-10">
      <h2 className="font-serif text-2xl text-[#302447]">More to read</h2>
      <ul className="mt-6 space-y-4">{moreArticles.map((item) => <li key={item.slug}><Link to={`/blog/${item.slug}`} className="group block rounded-2xl border border-[#eee5e9] bg-white p-5 transition hover:border-[#d9cedd]"><span className="font-serif text-lg text-[#302447] group-hover:text-[#765c8d]">{item.title}</span><span className="mt-1 block text-sm leading-6 text-[#737080]">{item.excerpt}</span></Link></li>)}</ul>
    </section>}
  </article></div>;
}
