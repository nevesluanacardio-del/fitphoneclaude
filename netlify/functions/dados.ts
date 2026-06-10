// Endpoint da API (Netlify Function): GET /api/dados (via redirect)
// Retorna os dados operacionais atuais (variação no tempo) + clima real.

import { obterDados } from "../../api/_lib/obterDados";

export const handler = async () => ({
  statusCode: 200,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(await obterDados()),
});
