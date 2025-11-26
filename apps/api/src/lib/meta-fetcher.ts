import { parse } from 'node-html-parser';

export interface LinkMetadata {
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const root = parse(html);

    const metadata: LinkMetadata = {};

    // Get title (try og:title first, then <title>)
    metadata.title =
      root.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      root.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
      root.querySelector('title')?.text ||
      undefined;

    // Get description (try og:description first, then meta description)
    metadata.description =
      root
        .querySelector('meta[property="og:description"]')
        ?.getAttribute('content') ||
      root
        .querySelector('meta[name="twitter:description"]')
        ?.getAttribute('content') ||
      root.querySelector('meta[name="description"]')?.getAttribute('content') ||
      undefined;

    // Get image (OpenGraph or Twitter Card)
    metadata.image =
      root.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
      root
        .querySelector('meta[name="twitter:image"]')
        ?.getAttribute('content') ||
      undefined;

    // Get favicon
    const faviconLink =
      root.querySelector('link[rel="icon"]')?.getAttribute('href') ||
      root.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
      root.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href');

    if (faviconLink) {
      // Make favicon URL absolute
      const urlObj = new URL(url);
      if (faviconLink.startsWith('http')) {
        metadata.favicon = faviconLink;
      } else if (faviconLink.startsWith('//')) {
        metadata.favicon = `${urlObj.protocol}${faviconLink}`;
      } else if (faviconLink.startsWith('/')) {
        metadata.favicon = `${urlObj.protocol}//${urlObj.host}${faviconLink}`;
      } else {
        metadata.favicon = `${urlObj.protocol}//${urlObj.host}/${faviconLink}`;
      }
    } else {
      // Default to /favicon.ico
      const urlObj = new URL(url);
      metadata.favicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
    }

    return metadata;
  } catch (error) {
    console.error('Failed to fetch metadata for', url, error);
    // Return empty metadata on error
    return {};
  }
}
