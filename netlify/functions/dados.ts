// Endpoint da API (Netlify Function): GET /api/dados (via redirect)
// Retorna os dados operacionais atuais (com variação suave no tempo).

import { gerarDados } from "../../api/_lib/gerarDados";

export const handler = async () => ({
  statusCode: 200,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(gerarDados()),
});
