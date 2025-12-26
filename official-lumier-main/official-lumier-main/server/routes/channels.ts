import { Router } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = Router();

const BASE_URL = 'http://ant-tv.ddns.net:2223';
const STREAM_BASE_URL = 'http://ant-tv.ddns.net';
const LOGIN = 'admin';
const PASSWORD = 'content';

async function getSessionCookie() {
  const params = new URLSearchParams();
  params.append('login', LOGIN);
  params.append('password', PASSWORD);

  const response = await axios.post(BASE_URL, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0'
    },
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400
  });

  const setCookie = response.headers['set-cookie'];
  if (setCookie && setCookie.length > 0) {
    const match = setCookie[0].match(/PHPSESSID=([^;]+)/);
    if (match) {
      return `PHPSESSID=${match[1]}`;
    }
  }
  return null;
}

router.get('/', async (req, res) => {
  try {
    const cookie = await getSessionCookie();
    if (!cookie) {
      return res.status(401).json({ error: 'Failed to authenticate' });
    }

    const htmlResponse = await axios.get(`${BASE_URL}/channels`, {
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const $ = cheerio.load(htmlResponse.data);
    const links = $("a[href*='page=edit_channel'][href*='id=']");
    const ids = new Set<string>();

    links.each((_, el) => {
      const href = $(el).attr('href');
      const match = href?.match(/id=(\d+)/);
      if (match) {
        ids.add(match[1]);
      }
    });

    const channels: any[] = [];

    for (const id of ids) {
      try {
        const editHtmlResponse = await axios.get(`${BASE_URL}/channels?page=edit_channel&id=${id}`, {
          headers: {
            'Cookie': cookie,
            'User-Agent': 'Mozilla/5.0'
          }
        });

        const $edit = cheerio.load(editHtmlResponse.data);

        let name = $edit("input[id='name']").val();
        if (!name) name = $edit("input[name='name']").val();

        let channelName = $edit("input[id='channel_name']").val();
        if (!channelName) channelName = $edit("input[name='channel_name']").val();

        const url = channelName ? `${STREAM_BASE_URL}/${channelName}/index.m3u8` : "";

        channels.push({
            id: id,
            title: name || `Канал ID ${id}`,
            logo: `${BASE_URL}/img/channel_logo/${id}.png`,
            streamUrl: url,
            category: 'ТВ Каналы'
        });

      } catch (err) {
        console.error(`Failed to fetch channel ${id}`, err);
      }
    }

    res.json(channels);

  } catch (error: any) {
    console.error('Channels API Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
