import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const baseUrl = "http://ant-tv.ddns.net:2223/api";
  // In production, this should be an environment variable
  const masterToken = "Bearer Z4Q2f+QZ97DVto7NlqsvQszwDlB0SSqa8SWlWlmh8LY.WuenZtHmSXTMiDhsIJ8F26vh/p+OJUz7Ecq0JVqpvw4=";

  const { action, phone: rawPhone, code } = req.body || {};
  
  // Clean phone
  let phone = rawPhone ? rawPhone.toString().replace('+992', '').replace(/\D/g, '') : '';

  if (!action || !phone) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const targetUrl = `${baseUrl}/validate/`;
  const postData: any = {
    iptv: 'true'
  };

  if (action === 'send_code') {
    postData.sendcode = 'true';
    postData.phone = phone;
  } else if (action === 'verify_code') {
    postData.phone = phone;
    postData.code = code;
  } else {
    return res.status(400).json({ success: false, message: 'Invalid action' });
  }

  try {
    const apiRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': masterToken,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0'
      },
      body: new URLSearchParams(postData)
    });

    const data = await apiRes.json();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to connect to API server' });
  }
}
