import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const API_KEY = process.env.API_KEY || '';

  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // List available models
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
