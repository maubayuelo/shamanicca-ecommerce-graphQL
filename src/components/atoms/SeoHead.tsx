import Head from 'next/head';

const SITE_NAME = 'Shamanicca';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shamanicca.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/images/shamanicca-og-default.jpg`;

type SeoHeadProps = {
  title: string;
  description: string;
  /** Absolute canonical URL. Defaults to BASE_URL when omitted. */
  canonical?: string;
  /** Absolute OG image URL. Falls back to DEFAULT_OG_IMAGE. */
  ogImage?: string | null;
  /** 'website' for listing/home pages, 'article' for blog posts, 'product' for PDPs. */
  ogType?: 'website' | 'article' | 'product';
  /** ISO 8601 publish date — used on article pages. */
  publishedAt?: string;
  /** ISO 8601 modified date — used on article pages. */
  modifiedAt?: string;
  /** Serialised JSON-LD object(s). Pass a single object or an array. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

export default function SeoHead({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  publishedAt,
  modifiedAt,
  jsonLd,
}: SeoHeadProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
  const canonicalUrl = canonical ?? BASE_URL;
  const ogImageUrl = ogImage ?? DEFAULT_OG_IMAGE;

  const schemas = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />

      {/* Article-specific dates */}
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      {modifiedAt && <meta property="article:modified_time" content={modifiedAt} />}

      {/* JSON-LD structured data */}
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Head>
  );
}
