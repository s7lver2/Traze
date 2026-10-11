import type { MetadataRoute } from 'next';
import { urlDelSitio } from '../seo';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${urlDelSitio()}/sitemap.xml`,
  };
}
