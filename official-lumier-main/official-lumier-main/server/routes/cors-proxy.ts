import { Router } from 'express';
import axios from 'axios';

const router = Router();

// Simple in-memory cache for manifests
const manifestCache = new Map<string, { body: any, contentType: string, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

router.get('/', async (req, res) => {
  const url = req.query.url as string;

  if (!url) {
    return res.status(400).send('No URL provided');
  }

  // Check cache
  const cached = manifestCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Cache', 'HIT');
    return res.send(cached.body);
  }

  try {
    const response = await axios.get(url, {
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Connection': 'keep-alive',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache'
      },
      timeout: 30000, // Увеличили до 30 секунд
      maxRedirects: 10, // Больше редиректов
      validateStatus: () => true, // Принимаем любой статус
      maxContentLength: Infinity, // Нет лимита на размер
      maxBodyLength: Infinity
    });

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('X-Cache', 'MISS');

    let body = response.data;

    // Rewrite M3U8 content
    if (contentType.includes('mpegurl') || contentType.includes('x-mpegURL') || url.endsWith('.m3u8')) {
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      const manifestProxyPrefix = `/api/cors-proxy?url=`;
      const segmentProxyPrefix = `/api/proxy?url=`;

      const getProxyUrl = (targetUrl: string) => {
        const isManifest = targetUrl.includes('.m3u8') || targetUrl.includes('.mpd');
        const prefix = isManifest ? manifestProxyPrefix : segmentProxyPrefix;
        return `${prefix}${encodeURIComponent(targetUrl)}`;
      };

      // 1. Rewrite URI="..." attributes (usually keys or sub-manifests)
      body = body.replace(/URI="([^"]+)"/g, (_match: string, uri: string) => {
        let absoluteUrl = uri;
        if (!uri.startsWith('http')) {
          try {
            absoluteUrl = new URL(uri, baseUrl).toString();
          } catch (e) {
            return _match;
          }
        }
        return `URI="${getProxyUrl(absoluteUrl)}"`;
      });

      // 2. Rewrite segment lines and sub-manifest lines
      const lines = body.split('\n');
      const newLines = lines.map((line: string) => {
        const l = line.trim();
        if (!l || l.startsWith('#')) return line;

        let absoluteUrl = l;
        if (!l.startsWith('http')) {
          try {
            absoluteUrl = new URL(l, baseUrl).toString();
          } catch (e) {
            return line;
          }
        }
        return getProxyUrl(absoluteUrl);
      });
      body = newLines.join('\n');
    }

    // Cache the result
    manifestCache.set(url, { body, contentType, timestamp: Date.now() });

    res.send(body);

  } catch (error: any) {
    // console.error('CORS Proxy Error:', error.message);

    // If we have a stale cache, use it as fallback
    if (cached) {
      console.log('Using stale cache as fallback for:', url);
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('X-Cache', 'STALE');
      return res.send(cached.body);
    }

    if (error.response) {
      res.status(error.response.status).send(`Failed to fetch URL: ${url}`);
    } else {
      res.status(500).send('Proxy failed');
    }
  }
});


export default router;
