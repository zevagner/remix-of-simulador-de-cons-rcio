import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Fachada core/finance — bloqueia imports diretos de motores financeiros.
      // Modo Onda 5: "error". Bloqueia também imports de `core/finance/internal/*`
      // fora da própria fachada.
      // Exceções: src/core/finance/** (fachada) e src/utils/calculations/** (fontes reais de IR e lances).
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: [
              "@/core/finance/internal",
              "@/core/finance/internal/*",
              "**/core/finance/internal",
              "**/core/finance/internal/*",
            ],
            message:
              "core/finance/internal é privado. Importe da fachada pública: '@/core/finance'.",
          },
          {
            group: [
              "@/utils/calculations",
              "@/utils/calculations/*",
              "**/utils/calculations",
              "**/utils/calculations/*",
            ],
            message:
              "Import direto de @/utils/calculations está bloqueado. Use '@/core/finance' (ver src/core/finance/README.md).",
          },
          {
            // Onda Full Edge UX Cutover — parsers de assembleia ficam só no edge.
            // Browser não interpreta assembleias. Exceções: legacy infra
            // (excelLoader.ts, AssembliesContext) e tests, via override abaixo.
            group: [
              "@/utils/excelFileParser",
              "**/utils/excelFileParser",
            ],
            message:
              "Onda Full Edge UX Cutover: parser xlsx client-side bloqueado. Use parseXlsxServer/parsePasteServer de '@/services/assembliesImport'.",
          },
        ],
        paths: [
          {
            name: "@/utils/mipRates",
            importNames: ["getMIPRateByAge", "MIP_AGE_RANGES", "getMIPAgeRangeLabel"],
            message:
              "Onda 2B: API legada do Prestamista REMOVIDA. Use 'getPrestamistaRate' / 'calculatePrestamistaPremium' / 'PRESTAMISTA_RATE_CURRENT' de '@/core/finance'. Idade NÃO entra no prêmio.",
          },
          {
            name: "@/utils/assemblyData",
            importNames: ["parseExcelPaste"],
            message:
              "Onda Full Edge UX Cutover: parseExcelPaste client-side bloqueado. Use parsePasteServer de '@/services/assembliesImport'.",
          },
          {
            name: "@/components/modules/assemblies/AssembliesContext",
            message:
              "Onda Legacy Context Removal: AssembliesContext foi removido. Use useAssembliesView() de '@/hooks/useAssembliesView' e useSelectedGroup() de '@/contexts/SelectedGroupContext'.",
          },
          {
            // Onda Admin Fee Manual Governance — taxa é 100% explícita.
            name: "@/config/consortiumRates",
            importNames: ["getSuggestedAdminFee"],
            message:
              "Onda Admin Fee Manual Governance: a taxa administrativa é estado explícito do usuário. Não importe getSuggestedAdminFee em UI/contexto/hook — qualquer auto-suggest/apply/recompute é proibido.",
          },
          {
            name: "@/config/businessRules",
            importNames: ["getSuggestedAdminFee"],
            message:
              "Onda Admin Fee Manual Governance: getSuggestedAdminFee não pode ser usado para preencher/sobrescrever adminFeePercent. Taxa é 100% explícita.",
          },
        ],
      }],
      // Onda 2B — Migration guard: percentuais hardcoded do Prestamista
      // só podem aparecer na engine canônica (src/core/finance/prestamista/).
      "no-restricted-syntax": ["error",
        {
          selector: "Literal[value=0.0765]",
          message: "Onda 2B: 0.0765 (Prestamista cota nova) é constante canônica. Use PRESTAMISTA_RATE_CURRENT de '@/core/finance'.",
        },
        {
          selector: "Literal[value=0.000765]",
          message: "Onda 2B: 0.000765 (Prestamista cota nova decimal) é constante canônica. Use PRESTAMISTA_RATE_CURRENT de '@/core/finance'.",
        },
        {
          selector: "Literal[value=0.0680]",
          message: "Onda 2B: 0.0680 (Prestamista cota antiga) é constante canônica. Use PRESTAMISTA_RATE_LEGACY de '@/core/finance'.",
        },
        {
          selector: "Literal[value=0.000680]",
          message: "Onda 2B: 0.000680 (Prestamista cota antiga decimal) é constante canônica. Use PRESTAMISTA_RATE_LEGACY de '@/core/finance'.",
        },
        // Onda Final UX — proíbe identificadores que sugerem prêmio por idade.
        // Idade entra APENAS em validatePrestamistaEligibility.
        {
          selector: "Identifier[name=/^(insuranceAge|mipAge|ageBracket|rateByAge|premiumByAge)$/]",
          message: "Onda Final UX: identificadores que acoplam idade ao prêmio são proibidos. Idade só é usada em 'validatePrestamistaEligibility' (@/core/finance).",
        },
        // Label legado "Seguro MIP" (e variações) — substituído por "Seguro Prestamista".
        {
          selector: "Literal[value=/Seguro MIP/]",
          message: "Onda Final UX: label legado 'Seguro MIP' substituído por 'Seguro Prestamista'.",
        },
        {
          selector: "TemplateElement[value.raw=/Seguro MIP/]",
          message: "Onda Final UX: label legado 'Seguro MIP' substituído por 'Seguro Prestamista'.",
        },
        // Onda B1 — Investment Engine canônico.
        // Math.pow para juros compostos / equivalência de taxas / Price PMT
        // só pode existir em src/core/finance/**. Toda UI/hook/serviço
        // consome de '@/core/finance' (annualToMonthlyRate, compoundGrowth,
        // futureValueOfSeries, inccAdjust, pricePmt, ...).
        // Exceção legítima: estatística (variance) e arredondamento decimal
        // (Math.pow(10, n)) — esses ficam fora do escopo financeiro.
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='pow']",
          message: "Onda B1: Math.pow para math financeiro está bloqueado fora de '@/core/finance'. Use compoundGrowth/futureValueOfSeries/annualToMonthlyRate/pricePmt/inccAdjust de '@/core/finance'. Estatística e arredondamento devem ficar em arquivos da allowlist (eslint override).",
        },
        // ============================================================
        // ANTI-XSS GOVERNANCE — HTML dinâmico proibido institucionalmente.
        // Renderer único: SafeNarrative / renderSafeFormattedText em
        // src/utils/safeFormattedText.tsx. Exceções devem ser explícitas
        // via override (atualmente: apenas src/utils/pdfGenerator.tsx,
        // que serializa o DOM já renderizado para Browserless).
        // ============================================================
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "Anti-XSS: dangerouslySetInnerHTML proibido. Use SafeNarrative/renderSafeFormattedText de '@/utils/safeFormattedText'.",
        },
        {
          selector: "AssignmentExpression[left.property.name='innerHTML']",
          message: "Anti-XSS: atribuição a .innerHTML proibida. Use textContent ou SafeNarrative.",
        },
        {
          selector: "AssignmentExpression[left.property.name='outerHTML']",
          message: "Anti-XSS: atribuição a .outerHTML proibida.",
        },
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message: "Anti-XSS: insertAdjacentHTML proibido. Construa elementos via DOM/JSX.",
        },
        {
          selector: "MemberExpression[object.name='document'][property.name='write']",
          message: "Anti-XSS: document.write proibido.",
        },
        {
          selector: "MemberExpression[object.name='document'][property.name='writeln']",
          message: "Anti-XSS: document.writeln proibido.",
        },
        {
          selector: "NewExpression[callee.name='DOMParser']",
          message: "Anti-XSS: DOMParser ad-hoc proibido. Use parser institucional aprovado.",
        },
        // Fase 4 — navegação: bloqueia IDs legados em call sites de navegação.
        // Aliases `strategies`/`compare` ainda funcionam via LEGACY_ID_MAP em
        // runtime (compat), mas código novo deve usar `wealth`/`comparator`.
        {
          selector: "CallExpression[callee.name=/^(setActiveModule|navigateTo|onModuleChange)$/] > Literal[value=/^(strategies|compare)$/]",
          message: "Fase 4 nav: use o ID canônico ('wealth' p/ 'strategies', 'comparator' p/ 'compare'). LEGACY_ID_MAP é só compat de runtime.",
        },
        {
          selector: "JSXAttribute[name.name='targetModule'] > Literal[value=/^(strategies|compare)$/]",
          message: "Fase 4 nav: targetModule deve usar o ID canônico ('wealth' p/ 'strategies', 'comparator' p/ 'compare').",
        },
      ],
    },
  },
  // Permite que a fachada, motores e o shim canônico do Prestamista referenciem
  // constantes/funções "proibidas" no resto da app.
  {
    files: [
      "src/core/finance/**/*.{ts,tsx}",
      "src/utils/calculations/**/*.{ts,tsx}",
      "src/utils/calculations.ts",
      "src/utils/mipRates.ts",
      "src/test/**/*.{ts,tsx}",
      "src/tests/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": "off",
      "no-restricted-syntax": "off",
    },
  },
  // Onda Full Edge UX Cutover — exceções para legacy compatibility.
  // Estes módulos predam o cutover edge e seguem uma rota separada de
  // remoção definitiva (ver .lovable/audit/assemblies-full-edge-ux-cutover-wave.md).
  {
    files: [
      "src/utils/excelLoader.ts",
      "src/utils/excelFileParser.ts",
      "src/utils/assemblyData.ts",
      "src/utils/data/index.ts",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Math.pow legítimo NÃO-financeiro (estatística, arredondamento decimal).
  // Mantém o guard B1 ativo no resto da UI.
  {
    files: [
      "src/utils/bidAnalysis/**/*.{ts,tsx}",
      "src/components/ui/percent-input.tsx",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  // PDFs são consumidores passivos: não podem importar lógica financeira.
  // Apenas type-only imports de @/core/finance são tolerados (não geram código em runtime).
  {
    files: ["src/components/pdf/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-restricted-imports": ["error", {
        patterns: [
          {
            group: [
              "@/core/finance",
              "@/core/finance/*",
              "**/core/finance",
              "**/core/finance/*",
              "@/utils/calculations",
              "@/utils/calculations/*",
              "**/utils/calculations",
              "**/utils/calculations/*",
            ],
            message:
              "PDF não pode usar cálculo direto. Use dados consolidados (props/contexts/fachada useProposalData).",
            allowTypeImports: true,
          },
        ],
      }],
    },
  },
  // ════════════════════════════════════════════════════════════════════

  // WEALTH SSoT GOVERNANCE — Estratégias NÃO calculam consórcio.
  // Simulador é a fonte única; wealth/** só pode interpretar ctx.sim.*.
  // ════════════════════════════════════════════════════════════════════
  {
    files: ["src/components/modules/wealth/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        // Identificadores de shadow engine — proibidos definitivamente.
        {
          selector: "Identifier[name=/^(ADM_TOTAL|PARCELA_FATOR|DEFAULT_REFERENCE_CREDIT)$/]",
          message:
            "Wealth SSoT: identificador de shadow engine proibido. Use ctx.sim.* (costPlan / totalCost / fullInstallment / termMonths) — Simulador é fonte única.",
        },
        {
          // REF_* (REF_TERM_M, REF_ADM, REF_FR, etc.) — não pode existir em wealth/**.
          // Permite REFERENCE em prosa via Literal/string; bloqueia apenas identificadores.
          selector: "Identifier[name=/^REF_[A-Z0-9_]+$/]",
          message:
            "Wealth SSoT: identificador REF_* proibido em wealth/**. Use ctx.sim.* — sem reconstrução paralela de prazo/taxa/FR.",
        },
        // VariableDeclarator que defina ADM_TOTAL/PARCELA_FATOR/REF_* — defesa em profundidade.
        {
          selector:
            "VariableDeclarator[id.name=/^(ADM_TOTAL|PARCELA_FATOR|DEFAULT_REFERENCE_CREDIT)$/]",
          message:
            "Wealth SSoT: declaração de constante de shadow engine proibida. Use ctx.sim.*.",
        },
        {
          selector: "VariableDeclarator[id.name=/^REF_[A-Z0-9_]+$/]",
          message:
            "Wealth SSoT: declaração REF_* proibida em wealth/**. Use ctx.sim.*.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // Engines financeiras pesadas — wealth só pode importar helpers de
              // formatação/equivalência (annualToMonthly/compoundGrowth/brl) e
              // tipos. Cálculo de plano de consórcio vem inteiro do ctx.sim.
              group: [
                "@/utils/calculations",
                "@/utils/calculations/*",
                "**/utils/calculations",
                "**/utils/calculations/*",
              ],
              message:
                "Wealth SSoT: wealth/** não pode importar @/utils/calculations. Use ctx.sim.* (Simulador) ou helpers puros de '@/core/finance'.",
            },
          ],
        },
      ],
    },
  },
);
