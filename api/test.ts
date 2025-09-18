import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('--- TEST API HIT ---');
  console.log('Request Body:', req.body);
  res.status(200).json({ message: 'Test successful', body: req.body });
}