
/**
 * Utility to proxy image URLs that are served over HTTP or from problematic domains
 * to avoid Mixed Content errors and SSL issues.
 */
export const getProxiedUrl = (url?: string): string | undefined => {
  if (!url) return undefined;

  // Check if the URL is from the problematic domain or if it's an HTTP URL on HTTPS
  const isProblematic = url.includes('ant-tv.ddns.net') || (url.startsWith('http://') && window.location.protocol === 'https:');

  if (isProblematic) {
    // If it's an M3U8 stream, use the CORS proxy which handles playlist rewriting
    if (url.includes('.m3u8')) {
      return `/api/cors-proxy?url=${encodeURIComponent(url)}`;
    }
    // For images and other assets, use the simple stream proxy
    return `/api/proxy?url=${encodeURIComponent(url)}`;
  }

  return url;
};
