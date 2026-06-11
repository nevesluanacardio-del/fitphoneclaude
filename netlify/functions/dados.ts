// Endpoint da API (Netlify Function): GET /api/dados[?aceleracao=N] (via redirect)
// Retorna o snapshot atual da simulação M/G/4 ao vivo + clima real.

import { obterDados } from "../../api/_lib/obterDados.js";

export const handler = async (event: any) => {
  const acel = Number(event?.queryStringParameters?.aceleracao) || 1;
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(await obterDados(Date.now(), acel)),
  };
};
