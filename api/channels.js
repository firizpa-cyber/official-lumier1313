export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const baseUrl = 'http://ant-tv.ddns.net:2223';
    const streamBaseUrl = 'http://ant-tv.ddns.net';
    const login = 'admin';
    const password = 'content';

    try {
        // 1. Auth to get cookie
        const loginRes = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0'
            },
            body: new URLSearchParams({ login, password }).toString(),
            redirect: 'manual'
        });

        // Get cookie from headers
        const setCookie = loginRes.headers.get('set-cookie');
        let cookie = '';
        if (setCookie) {
            const match = setCookie.match(/PHPSESSID=([^;]+)/);
            if (match) {
                cookie = `PHPSESSID=${match[1]}`;
            }
        }

        // 2. Get channels list
        const channelsRes = await fetch(`${baseUrl}/channels`, {
            headers: {
                'Cookie': cookie,
                'User-Agent': 'Mozilla/5.0'
            }
        });
        const html = await channelsRes.text();

        // 3. Parse IDs
        // PHP: //a[contains(@href,'page=edit_channel') and contains(@href,'id=')]
        // Regex fallback since we don't have DOM parser
        const linkRegex = /href=["'][^"']*page=edit_channel[^"']*id=(\d+)[^"']*["']/g;
        const ids = new Set();
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
            ids.add(match[1]);
        }

        // 4. Fetch details for each channel
        // Using Promise.all for concurrency (faster than PHP loop)
        const channelsData = await Promise.all(Array.from(ids).map(async (id) => {
            try {
                const editRes = await fetch(`${baseUrl}/channels?page=edit_channel&id=${id}`, {
                    headers: {
                        'Cookie': cookie,
                        'User-Agent': 'Mozilla/5.0'
                    }
                });
                const editHtml = await editRes.text();

                // Extract name and channel_name (stream path)
                // PHP logic: input id='name' value, or name='name' value
                let name = '';
                const nameMatch = editHtml.match(/<input[^>]*id=['"]name['"][^>]*value=['"]([^'"]*)['"]/i) ||
                    editHtml.match(/<input[^>]*name=['"]name['"][^>]*value=['"]([^'"]*)['"]/i);
                if (nameMatch) name = nameMatch[1];

                let channelName = '';
                const cNameMatch = editHtml.match(/<input[^>]*id=['"]channel_name['"][^>]*value=['"]([^'"]*)['"]/i) ||
                    editHtml.match(/<input[^>]*name=['"]channel_name['"][^>]*value=['"]([^'"]*)['"]/i);
                if (cNameMatch) channelName = cNameMatch[1];

                const streamUrl = channelName ? `${streamBaseUrl}/${channelName}/index.m3u8` : "";

                return {
                    id: parseInt(id),
                    title: name || `Канал ID ${id}`,
                    logo: `${baseUrl}/img/channel_logo/${id}.png`,
                    streamUrl: streamUrl,
                    category: 'ТВ Каналы'
                };
            } catch (e) {
                console.error(`Error fetching channel ${id}`, e);
                return null;
            }
        }));

        res.status(200).json(channelsData.filter(c => c !== null));

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Failed to fetch channels' });
    }
}
