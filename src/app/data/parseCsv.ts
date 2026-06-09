// Parser de CSV simples e robusto o suficiente para os dados do PortoFlow.
// Suporta campos entre aspas, vírgulas dentro de aspas e aspas escapadas ("").

export function parseCsv(text: string): Record<string, string>[] {
  const rows = parseRows(text.trim());
  if (rows.length === 0) return [];

  const headers = rows[0];
  return rows.slice(1).map((cols) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (cols[i] ?? "").trim();
    });
    return obj;
  });
}

function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++; // pula a aspa escapada
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++; // CRLF
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
    } else {
      field += char;
    }
  }

  // último campo/linha (sem quebra final)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
