import { Router } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = Router();

const BASE_URL = 'http://ant-tv.ddns.net:2223';
const LOGIN = 'admin';
const PASSWORD = 'content';

// Helper to get session cookie
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
    validateStatus: (status) => status >= 200 && status < 400 // Allow redirects (302)
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

    const htmlResponse = await axios.get(`${BASE_URL}/content`, {
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const $ = cheerio.load(htmlResponse.data);
    const links = $("a[href*='page=edit_film'][href*='id=']");
    const ids = new Set<string>();

    links.each((_, el) => {
      const href = $(el).attr('href');
      const match = href?.match(/id=(\d+)/);
      if (match) {
        ids.add(match[1]);
      }
    });

    const movies: any[] = [];
    let count = 0;
    const LIMIT = 100; // Limit as in the PHP script

    for (const id of ids) {
      if (count >= LIMIT) break;

      try {
        const editHtmlResponse = await axios.get(`${BASE_URL}/content?page=edit_film&id=${id}`, {
          headers: {
            'Cookie': cookie,
            'User-Agent': 'Mozilla/5.0'
          }
        });

        const $edit = cheerio.load(editHtmlResponse.data);
        
        const title = $edit("input[name='name']").val();
        const year = $edit("input[name='year']").val();
        const duration = $edit("input[name='duration']").val();
        const rating = $edit("input[name='rating']").val();
        const desc = $edit("textarea[name='description']").val();
        const streamUrl = $edit("input[name='url']").val();

        // Check if streamUrl exists (optional logic from PHP)
        if (streamUrl) {
            movies.push({
                id: id,
                title: title,
                year: year,
                duration: duration,
                rating: rating,
                description: desc,
                streamUrl: streamUrl,
                // These images seem standard in the PHP script logic or hardcoded based on ID?
                // The PHP script had: 'logo' => "http://ant-tv.ddns.net:2223/img/logos/$id.jpg" (inferred)
                // Let's check what the PHP output was exactly. The PHP file snippet showed hardcoded URLs like:
                // 'logo' => 'http://ant-tv.ddns.net:2223/img/logos/249.jpg'
                // It seems they use the ID for the image path.
                logo: `${BASE_URL}/img/logos/${id}.jpg`,
                poster: `${BASE_URL}/img/posters/${id}.jpg`,
                banner: `${BASE_URL}/img/banners/${id}.jpg`,
                language: ['Русский'], // Hardcoded in PHP
                country: '',
                age: ''
            });
            count++;
        }
      } catch (err) {
        console.error(`Failed to fetch movie ${id}`, err);
      }
    }

    res.json(movies);

  } catch (error: any) {
    console.error('Live API Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
