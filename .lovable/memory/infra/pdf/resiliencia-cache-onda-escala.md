---
name: PDF Resiliência + Cache
description: generate-pdf com retry SFO→LON, JS desligado no Chromium, sanitização HTML; cliente usa proposal-pdfs bucket + tabela proposal_pdf_cache invalidada por trigger
type: feature
---

## Edge `generate-pdf`
- 2 endpoints Browserless: `production-sfo` (primário) → `production-lon` (fallback). 2 tentativas por endpoint, backoff 500ms.
- `setJavaScriptEnabled: false` — Chromium não executa JS. Recharts já vem como SVG do cliente.
- `waitUntil: 'load'` (era networkidle0).
- Sanitiza HTML: strip `<script>`, `on*=`, `javascript:`. Defesa em profundidade.
- Header `X-Pdf-Source: primary|fallback` na resposta.

## Cache cliente (`src/utils/pdfGenerator.tsx`)
- `generatePdfFromElement({ ..., proposalId })` → tenta baixar de `proposal-pdfs/<user_id>/<proposal_id>.pdf` antes de gerar.
- Após gerar, salva em background (fire-and-forget).
- Bucket `proposal-pdfs` privado, RLS por pasta = user_id.
- Tabela `proposal_pdf_cache` (PK proposal_id) com trigger `invalidate_pdf_cache_on_proposal_change` em UPDATE de proposals (campos: proposal_content, credit_value, term_months, installment, total_cost, bid_percent).

## Proibido
- Reintroduzir html2pdf como fallback (decisão arquitetural; perda de fidelidade visual).
- Habilitar JS no Browserless sem revisar vetor XSS.
