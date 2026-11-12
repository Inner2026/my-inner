import { useParams } from 'react-router-dom';
import { GuideArticle } from '../components/SeoContent';
import { guideBySlug } from '../seo/siteContent';
import { NotFound } from './NotFound';

export function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? guideBySlug(slug) : undefined;
  return guide ? <GuideArticle guide={guide} /> : <NotFound />;
}
