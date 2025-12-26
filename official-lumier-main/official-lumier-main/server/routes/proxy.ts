import { Router } from 'express';
import axios from 'axios';
import http from 'http';
import https from 'https';

const router = Router();

// Connection pooling (увеличены лимиты для параллельной загрузки)
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 200, maxFreeSockets: 100 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 200, maxFreeSockets: 100 });

// Simple cache for segments (last 20 segments)
const segmentCache = new Map<string, { data: Buffer, contentType: string, timestamp: number }>();
const MAX_CACHE_SIZE = 200; // Увеличен кэш


router.get('/', async (req, res) => {
  const url = req.query.url as string;

  if (!url) {
    return res.status(400).send('Missing URL parameter');
  }

  // Validate URL
  try {
    new URL(url);
  } catch (e) {
    return res.status(400).send('Invalid URL');
  }

  // Check cache
  const cached = segmentCache.get(url);
  if (cached) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Cache', 'HIT');
    return res.end(cached.data);
  }

  try {
    const isHttps = url.startsWith('https');
    // For small files (segments, images), we fetch as arraybuffer to cache them
    // For large/unknown, we stream
    const isSegment = url.includes('.ts') || url.includes('.m4s') || url.includes('.jpg') || url.includes('.png');

    if (isSegment) {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': '*/*',
          'Connection': 'keep-alive'
        },
        timeout: 30000, // Увеличен таймаут
        httpAgent: isHttps ? undefined : httpAgent,
        httpsAgent: isHttps ? httpsAgent : undefined
      });

      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const buffer = Buffer.from(response.data);

      // Cache logic
      if (segmentCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = segmentCache.keys().next().value;
        if (oldestKey) segmentCache.delete(oldestKey);
      }
      segmentCache.set(url, { data: buffer, contentType, timestamp: Date.now() });

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Cache', 'MISS');
      return res.send(buffer);
    }

    const response = await axios.get(url, {
      responseType: 'stream',

      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'identity', // Don't re-compress if it's already a binary segment
        'Connection': 'keep-alive'
      },
      timeout: 45000, // Увеличен таймаут для больших файлов
      maxRedirects: 10,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      httpAgent: isHttps ? undefined : httpAgent,
      httpsAgent: isHttps ? httpsAgent : undefined
    });

    // Set headers
    const contentType = response.headers['content-type'];
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    const contentLength = response.headers['content-length'];
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const cacheControl = response.headers['cache-control'];
    if (cacheControl) {
      res.setHeader('Cache-Control', cacheControl);
    } else {
      // Default cache logic for segments
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // Handle abrupt client disconnect
    req.on('close', () => {
      if (response.data && response.data.destroy) {
        response.data.destroy();
      }
    });

    response.data.pipe(res);

  } catch (error: any) {
    // console.error('Proxy Error:', error.message);
    if (error.response) {
      res.status(error.response.status).send(`Failed to fetch URL: ${url}`);
    } else {
      res.status(500).send(`Failed to fetch URL: ${url}`);
    }
  }
});

export default router;
