/**
 * REGRA INSTITUCIONAL — HTML dinâmico proibido
 * ------------------------------------------------
 * Renderer seguro para texto narrativo institucional.
 *
 * Permite APENAS:
 *  - texto puro
 *  - **negrito** → <strong>
 *  - quebras de linha (newline)
 *
 * NUNCA usar dangerouslySetInnerHTML / innerHTML / regex de HTML.
 * Toda IA / narrativa / markdown ad-hoc DEVE renderizar via este util.
 */
import React from "react";

type Token =
  | { type: "text"; value: string }
  | { type: "strong"; value: string };

/**
 * Tokeniza segmentos `**negrito**` de forma puramente textual.
 * Não aceita HTML, tags, atributos. Tudo o que não casar com
 * o padrão de negrito é texto literal — React escapa automaticamente.
 */
function tokenizeBold(input: string): Token[] {
  const tokens: Token[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(input)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: input.slice(lastIndex, match.index) });
    }
    tokens.push({ type: "strong", value: match[1] });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < input.length) {
    tokens.push({ type: "text", value: input.slice(lastIndex) });
  }
  return tokens;
}

/**
 * Renderiza texto inline com suporte seguro a **negrito**.
 * Retorna ReactNode — qualquer caractere `<`, `>`, `&`, `"`, `'`
 * é tratado como texto literal pelo React (escape automático).
 */
export function renderSafeFormattedText(text: string): React.ReactNode {
  return tokenizeBold(text).map((tok, i) =>
    tok.type === "strong" ? <strong key={i}>{tok.value}</strong> : <React.Fragment key={i}>{tok.value}</React.Fragment>
  );
}

export type SafeBlock =
  | { kind: "h2"; text: string; key: number }
  | { kind: "li"; text: string; key: number }
  | { kind: "p"; text: string; key: number }
  | { kind: "spacer"; key: number };

/**
 * Converte um texto narrativo (subset de markdown) em blocos seguros.
 * Suporta:
 *   `## titulo` → h2
 *   `- item`    → li
 *   linha vazia → spacer
 *   resto       → p
 */
export function parseSafeNarrative(text: string): SafeBlock[] {
  return text.split("\n").map((line, key) => {
    if (line.startsWith("## ")) return { kind: "h2", text: line.slice(3), key };
    if (line.startsWith("- ")) return { kind: "li", text: line.slice(2), key };
    if (line.trim() === "") return { kind: "spacer", key };
    return { kind: "p", text: line, key };
  });
}

/**
 * Renderer JSX puro para narrativa institucional.
 * Substitui qualquer pipeline baseado em dangerouslySetInnerHTML.
 */
export function SafeNarrative({ text }: { text: string }): React.ReactElement {
  const blocks = parseSafeNarrative(text);
  return (
    <>
      {blocks.map((b) => {
        if (b.kind === "h2") {
          return (
            <h2 key={b.key} className="text-base font-semibold mt-4 mb-2">
              {renderSafeFormattedText(b.text)}
            </h2>
          );
        }
        if (b.kind === "li") {
          return (
            <li key={b.key} className="text-sm ml-4 list-disc">
              {renderSafeFormattedText(b.text)}
            </li>
          );
        }
        if (b.kind === "spacer") {
          return <div key={b.key} className="h-1" />;
        }
        return (
          <p key={b.key} className="text-sm">
            {renderSafeFormattedText(b.text)}
          </p>
        );
      })}
    </>
  );
}
