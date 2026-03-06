import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    status: 'ok',
    service: 'easel-proxy',
    env: {
      CLIENT_TOKEN: !!process.env.CLIENT_TOKEN,
      MINIMAX_API_KEY: !!process.env.MINIMAX_API_KEY,
      MINIMAX_MODEL: process.env.MINIMAX_MODEL ?? null,
    },
  });
}
