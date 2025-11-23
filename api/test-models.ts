import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const API_KEY = process.env.API_KEY || '';

  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-1.0-pro',
    'gemini-flash',
  ];

  const results: any = {};

  for (const modelName of modelsToTest) {
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hi');
      const text = result.response.text();
      results[modelName] = { success: true, response: text };
    } catch (error: any) {
      results[modelName] = { success: false, error: error.message };
    }
  }

  return res.status(200).json(results);
}
