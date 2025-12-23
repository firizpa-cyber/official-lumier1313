export default async function handler(req, res) {
    // CORS logic
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.query;
    if (!url) {
        return res.status(400).send('No URL provided');
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            redirect: 'follow'
        });

        // Forward status and content type
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        res.status(response.status);
        res.setHeader('Content-Type', contentType);

        const text = await response.text();
        let finalBody = text;

        // Rewrite M3U8
        if (contentType.includes('mpegurl') || contentType.includes('x-mpegURL') || url.endsWith('.m3u8')) {
            const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

            // Determine current host for proxy prefix
            // In Vercel, we can try relative path, but for M3U8 we often need absolute.
            // We can use the 'host' header to reconstruct it.
            const protocol = req.headers['x-forwarded-proto'] || 'https';
            const host = req.headers['host'];
            const proxyPrefix = `${protocol}://${host}/api/cors-proxy?url=`;

            // 1. Rewrite URI="..."
            finalBody = finalBody.replace(/URI="([^"]+)"/g, (match, uri) => {
                let absoluteUrl = uri;
                if (!uri.startsWith('http')) {
                    absoluteUrl = new URL(uri, baseUrl).toString();
                }
                return `URI="${proxyPrefix}${encodeURIComponent(absoluteUrl)}"`;
            });

            // 2. Rewrite segment lines
            const lines = finalBody.split('\n');
            const newLines = lines.map(line => {
                const l = line.trim();
                if (!l) return line;
                if (l.startsWith('#')) return line;

                let absoluteUrl = l;
                if (!l.startsWith('http')) {
                    absoluteUrl = new URL(l, baseUrl).toString();
                }
                return `${proxyPrefix}${encodeURIComponent(absoluteUrl)}`;
            });
            finalBody = newLines.join('\n');
        }

        res.send(finalBody);

    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).send('Proxy failed');
    }
}
