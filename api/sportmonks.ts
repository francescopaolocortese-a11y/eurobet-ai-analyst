import type { VercelRequest, VercelResponse } from '@vercel/node';

const BASE_URL = 'https://api.sportmonks.com/v3/football';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Read environment variable inside the handler
  const API_TOKEN = process.env.SPORTMONKS_API_TOKEN || '';

  if (!API_TOKEN) {
    return res.status(500).json({ error: 'API token not configured' });
  }

  try {
    const { endpoint, includes } = req.query;

    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json({ error: 'Missing endpoint parameter' });
    }

    const includesParam = includes ? `&include=${includes}` : '';
    const url = `${BASE_URL}/${endpoint}?api_token=${API_TOKEN}${includesParam}`;

    const response = await fetch(url);
    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error('Sportmonks API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch data from Sportmonks API' });
  }
}
