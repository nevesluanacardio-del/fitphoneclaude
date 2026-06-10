// Endpoint da API (Vercel Serverless Function): GET /api/dados[?aceleracao=N]
// Retorna o snapshot atual da simulação M/G/4 ao vivo + clima real.

import { obterDados } from "./_lib/obterDados.js";

export default async function handler(req: any, res: any) {
  const acel = Number(new URL(req.url, "http://localhost").searchParams.get("aceleracao")) || 1;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).send(JSON.stringify(await obterDados(Date.now(), acel)));
}
