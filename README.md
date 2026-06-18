# Diagnóstico do Gargalo Oculto

> **O mapa de 60 minutos que revela por que seu faturamento parou de crescer.**

App interativo, **mobile-first** e sem dependências (HTML + CSS + JS puro). A pessoa
marca 30 itens em 4 dimensões do negócio e, ao final, recebe um **gráfico radar** e uma
**leitura automática** apontando o gargalo nº 1 — abrindo a pergunta que conduz à mentoria:
*"agora que sei o gargalo, como resolvo?"*.

## Como funciona

1. **Intro** — hook + promessa do diagnóstico (com retomada automática se a pessoa parar no meio).
2. **4 etapas** (uma por dimensão), cada item marcado como:
   - *Existe e é satisfatório* → pontuação cheia
   - *Existe, mas não é satisfatório* → metade
   - *Não existe* → zero
3. **Resultado** — radar das 4 áreas, faixa de maturidade geral e o **gargalo oculto**
   (a dimensão de menor pontuação) com diagnóstico emocional + sintomas + CTA.

### Dimensões e pesos (cada uma vale 100 pts)

| Dimensão           | Itens | Pts/item |
|--------------------|-------|----------|
| Processos          | 10    | 10       |
| Resultados         | 5     | 20       |
| Sistema de Gestão  | 5     | 20       |
| Pessoas            | 10    | 10       |

## Como rodar

É um site estático. Basta abrir `index.html` ou servir a pasta:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

Hospede em qualquer lugar (GitHub Pages, Netlify, Vercel, hospedagem própria).

## Personalização

- **Perguntas e textos de diagnóstico:** `assets/js/data.js`
- **Link e texto do CTA (mentoria/WhatsApp):** topo de `assets/js/app.js`
  (`CTA_URL` e `CTA_BUTTON`)
- **Visual/cores:** variáveis no topo de `assets/css/styles.css`

As respostas ficam salvas no `localStorage` do navegador (não há backend).
