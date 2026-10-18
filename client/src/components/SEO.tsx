import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogUrl?: string;
  noindex?: boolean;
}

const BASE_URL = 'https://cracked1-afy4.onrender.com';
const DEFAULT_IMAGE = `${BASE_URL}/og.png`;

export const SEO: React.FC<SEOProps> = ({
  title = 'Cracked? — Peer-Reviewed Case Competitions & Consulting Credibility',
  description = 'Peer-reviewed case competitions for consulting credibility. Solve real business problems, get reviewed by peers, earn credibility tiers, and share your certificate with recruiters.',
  ogImage = DEFAULT_IMAGE,
  ogUrl = BASE_URL,
  noindex = false,
}) => {
  const fullTitle = title.includes('Cracked?') ? title : `${title} | Cracked?`;
  const fullUrl = ogUrl.startsWith('http') ? ogUrl : `${BASE_URL}${ogUrl}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content="Cracked?" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
      <meta property="twitter:creator" content="@cracked_platform" />

      {/* Canonical */}
      <link rel="canonical" href={fullUrl} />
    </Helmet>
  );
};
