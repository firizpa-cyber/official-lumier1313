import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const baseUrl = 'http://ant-tv.ddns.net:2223';
  const streamBaseUrl = 'http://ant-tv.ddns.net';
  const login = 'admin';
  const password = 'content';

  try {
    // 1. Login
    const loginParams = new URLSearchParams();
    loginParams.append('login', login);
    loginParams.append('password', password);

    const loginRes = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0'
      },
      body: loginParams,
      redirect: 'manual' // important to see Set-Cookie
    });

    // Get cookie
    const setCookie = loginRes.headers.get('set-cookie');
    let cookie = '';
    if (setCookie) {
      const match = setCookie.match(/PHPSESSID=([^;]+)/);
      if (match) {
        cookie = `PHPSESSID=${match[1]}`;
      }
    }

    // 2. Get Channels List
    const channelsRes = await fetch(`${baseUrl}/channels`, {
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const channelsHtml = await channelsRes.text();
    const $ = cheerio.load(channelsHtml);

    const ids = new Set<string>();
    $("a[href*='page=edit_channel'][href*='id=']").each((_, el) => {
      const href = $(el).attr('href');
      const match = href?.match(/id=(\d+)/);
      if (match) ids.add(match[1]);
    });

    const uniqueIds = Array.from(ids);
    
    // 3. Fetch details
    // We limit concurrency to 5 to prevent timeouts or server blocking
    const channels = [];
    const batchSize = 5;
    
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
        const batch = uniqueIds.slice(i, i + batchSize);
        const promises = batch.map(async (id) => {
            try {
                const editRes = await fetch(`${baseUrl}/channels?page=edit_channel&id=${id}`, {
                    headers: { 'Cookie': cookie, 'User-Agent': 'Mozilla/5.0' }
                });
                const editHtml = await editRes.text();
                const $edit = cheerio.load(editHtml);
                
                let name = $edit("input#name").val();
                if (!name) name = $edit("input[name='name']").val();
                
                let channelName = $edit("input#channel_name").val();
                if (!channelName) channelName = $edit("input[name='channel_name']").val();
                
                const nameStr = typeof name === 'string' ? name : '';
                const channelNameStr = typeof channelName === 'string' ? channelName : '';

                const url = channelNameStr ? `${streamBaseUrl}/${channelNameStr}/index.m3u8` : "";
                
                return {
                    id,
                    title: nameStr || `Канал ID ${id}`,
                    logo: `${baseUrl}/img/channel_logo/${id}.png`,
                    streamUrl: url,
                    category: 'ТВ Каналы'
                };
            } catch (e) {
                console.error(`Error fetching channel ${id}`, e);
                return null;
            }
        });
        
        const results = await Promise.all(promises);
        channels.push(...results.filter(Boolean));
    }

    res.status(200).json(channels);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
