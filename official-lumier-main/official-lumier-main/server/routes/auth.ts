import { Router } from 'express';
import axios from 'axios';

const router = Router();

const BASE_URL = 'http://ant-tv.ddns.net:2223/api';
const MASTER_TOKEN = 'Bearer Z4Q2f+QZ97DVto7NlqsvQszwDlB0SSqa8SWlWlmh8LY.WuenZtHmSXTMiDhsIJ8F26vh/p+OJUz7Ecq0JVqpvw4=';

router.post('/', async (req, res) => {
  const { action, phone: rawPhone, code } = req.body;

  // Clean phone number
  let phone = rawPhone || '';
  phone = phone.replace('+992', '');
  phone = phone.replace(/\D/g, '');

  if (!action || !phone) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const targetUrl = `${BASE_URL}/validate/`;
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
    const response = await axios.post(targetUrl, new URLSearchParams(postData), {
      headers: {
        'Authorization': MASTER_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    res.json(response.data);

  } catch (error: any) {
    console.error('Auth API Error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ success: false, message: 'Failed to connect to API server' });
    }
  }
});

export default router;
