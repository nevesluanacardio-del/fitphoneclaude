// Endpoint da API (Vercel Serverless Function): GET /api/dados
// Retorna os dados operacionais atuais (variação no tempo) + clima real.

import { obterDados } from "./_lib/obterDados";

export default async function handler(_req: unknown, res: any) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).send(JSON.stringify(await obterDados()));
}
