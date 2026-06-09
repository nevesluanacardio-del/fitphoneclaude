// Endpoint da API (Vercel Serverless Function): GET /api/dados
// Retorna os dados operacionais atuais (com variação suave no tempo).

import { gerarDados } from "./_lib/gerarDados";

export default function handler(_req: unknown, res: any) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).send(JSON.stringify(gerarDados()));
}
