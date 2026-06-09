import { Link } from "react-router-dom";
import {
  ShieldCheck, Lock, Bot, Database, FileText, Upload,
  Eye, Users2, Scale, ArrowRight,
} from "lucide-react";

/**
 * Trust Center público — torna visível a governança técnica já implementada.
 *
 * Princípio: zero security theater. Cada item descreve o que existe hoje
 * (RLS, signed URLs, masking de IA, retenção automática, audit logs,
 * subprocessors) e, quando aplicável, declara honestamente o que NÃO existe
 * (ex: antivirus enterprise nativo).
 *
 * Não substitui Política de Privacidade (/privacidade) nem Termos (/termos)
 * — é a camada executiva que linka para ambos.
 */

type Section = {
  id: string;
  icon: typeof ShieldCheck;
  title: string;
  intro: string;
  items: { label: string; detail: string; status?: "active" | "roadmap" }[];
};

const SECTIONS: Section[] = [
  {
    id: "arquitetura",
    icon: ShieldCheck,
    title: "Arquitetura e isolamento",
    intro:
      "Plataforma multi-tenant com isolamento por consultor enforced no banco — não apenas na aplicação.",
    items: [
      { label: "Row-Level Security (RLS)", detail: "Cada consultor acessa apenas seus próprios dados. Política aplicada no banco; aplicação não pode contornar." },
      { label: "Admin sem privilégio horizontal", detail: "Em proposals e pós-venda, admin é tratado como consultor comum. Acesso global apenas em analytics, profiles e feedbacks." },
      { label: "Funções com SECURITY DEFINER auditadas", detail: "RPCs administrativas com search_path fixo, sem recursão de RLS, com trilha em audit_logs." },
    ],
  },
  {
    id: "ia",
    icon: Bot,
    title: "Governança de IA",
    intro:
      "IA generativa atua como camada consultiva. Matemática e regras de negócio são determinísticas e locais.",
    items: [
      { label: "Mascaramento de PII antes do envio", detail: "Nome → [CLIENTE], e-mail/CPF/telefone removidos. Aplicado em todas as edges de IA (sales, proposta, copilot, storytelling)." },
      { label: "Sem treinamento com dados de cliente", detail: "Prompts não alimentam treino dos modelos do gateway. Política contratual e técnica." },
      { label: "Cláusula global anti-garantia", detail: "Toda saída de IA é instruída a nunca prometer contemplação, retorno ou prazo. Aplicada em fragmentos compartilhados (CSAA)." },
      { label: "Rate limit por usuário + cache tenant-aware", detail: "Limite por user_id (fallback IP); cache de respostas com chave por empresa para evitar drift cross-tenant." },
      { label: "Supervisão humana obrigatória", detail: "Nenhuma decisão financeira ou contratual é tomada pela IA. Consultor edita e assume autoria." },
    ],
  },
  {
    id: "dados",
    icon: Database,
    title: "Dados, retenção e LGPD",
    intro:
      "Ciclo de vida explícito, rotina automatizada diária, autoatendimento de direitos do titular dentro da plataforma.",
    items: [
      { label: "Retenção declarada e automatizada", detail: "PDFs em storage: 90 dias · Eventos de telemetria: 180 dias · Trilhas de auditoria: 365 dias · URLs assinadas: 24 horas. Purge diário." },
      { label: "Exportação portável (LGPD Art. 18)", detail: "ZIP com perfil, propostas, pós-venda, eventos e auditoria. Disponível em Configurações → Privacidade." },
      { label: "Exclusão de conta em cascata", detail: "Confirmação tipada, remoção de propostas, pós-venda, PDFs, analytics, auditoria e acesso. Irreversível e auditada." },
      { label: "Consentimento granular de telemetria", detail: "Status permitido/bloqueado/não decidido visível ao usuário; revogável a qualquer momento sem perda de funcionalidade." },
    ],
  },
  {
    id: "documentos",
    icon: FileText,
    title: "PDFs e compartilhamento",
    intro:
      "Documentos institucionais com marca d'água, acesso temporário e renderização auditável.",
    items: [
      { label: "Storage privado por padrão", detail: "Buckets de PDF não são públicos. Acesso apenas via URL assinada com TTL curto." },
      { label: "Marca d'água institucional", detail: "Toda proposta carrega data, ambiente e identificador tokenizado do autor (não-PII)." },
      { label: "Link visual com token 256-bit", detail: "Páginas compartilháveis usam token criptográfico, com expiração configurável e revogação imediata." },
      { label: "Renderização via Chromium real", detail: "PDF gerado por Browserless (JS desligado no render), garantindo fidelidade visual e auditabilidade do output." },
    ],
  },
  {
    id: "uploads",
    icon: Upload,
    title: "Uploads e arquivos importados",
    intro:
      "Validação estrutural ativa hoje. Antivirus enterprise nativo NÃO está implementado — declaramos honestamente.",
    items: [
      { label: "Validação por tipo MIME e extensão", detail: "Apenas formatos esperados são aceitos. Tamanho limitado por endpoint." },
      { label: "Parsing server-side em pipeline auditável", detail: "Importação de assembleias passa por edge function dedicada (preview/commit/rollback) com hash de conteúdo e detecção de drift." },
      { label: "Storage privado", detail: "Arquivos importados ficam em bucket privado, vinculado ao usuário, com mesma política de RLS dos demais dados." },
      { label: "Roadmap — malware scanning enterprise", detail: "Integração com scanner antivirus dedicado está mapeada para release enterprise. Não fingimos cobertura que não existe.", status: "roadmap" },
    ],
  },
  {
    id: "observabilidade",
    icon: Eye,
    title: "Observabilidade sem PII",
    intro:
      "Métricas e erros instrumentados para sustentar operação enterprise, sem expor dados pessoais em logs.",
    items: [
      { label: "Logs sanitizados", detail: "sanitizeLogPayload remove campos sensíveis (nome, e-mail, CPF, telefone, headers Authorization/apikey/cookie) antes de qualquer envio." },
      { label: "User ID tokenizado", detail: "Em traces e métricas, identificador é truncado para 6 últimos chars. Reconciliação possível internamente, não-PII externamente." },
      { label: "Web Vitals em produção", detail: "FCP, LCP, CLS, INP, TTFB e renders >16ms instrumentados no painel Performance Intel (Admin), sem polling e sem PII." },
      { label: "Audit logs imutáveis", detail: "Ações críticas (impersonation, exclusão, exportação, geração de PDF, mudanças de subprocessor) registradas em audit_logs com filtros administrativos." },
    ],
  },
  {
    id: "suboperadores",
    icon: Users2,
    title: "Suboperadores",
    intro:
      "Inventário formal mantido em sincronia com a Política de Privacidade. Mudanças são auditadas.",
    items: [
      { label: "Lovable Cloud (Supabase)", detail: "Banco, autenticação, storage, edge functions. Dados operacionais isolados por RLS." },
      { label: "Browserless.io", detail: "Renderização headless de PDF (stateless, sem persistência do HTML)." },
      { label: "Lovable AI Gateway", detail: "IA generativa consultiva. Prompts com PII mascarada; sem treinamento." },
      { label: "Sentry (opt-in)", detail: "Monitoramento de erros com payload sanitizado. Desativável por DSN." },
    ],
  },
];

export default function TrustCenterPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Voltar
          </Link>
          <div className="mt-4 flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Central de Confiança</h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Como tratamos dados, IA, documentos e segurança — sem teatro. Esta página
                consolida as práticas reais já implementadas e, quando algo está no roadmap,
                declaramos explicitamente.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link
              to="/privacidade"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <Scale className="h-3.5 w-3.5" /> Política de Privacidade
            </Link>
            <span className="text-muted-foreground/50">·</span>
            <Link
              to="/termos"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <FileText className="h-3.5 w-3.5" /> Termos de Uso
            </Link>
          </div>
        </div>
      </header>

      {/* Anchor nav */}
      <nav
        aria-label="Seções da Central de Confiança"
        className="border-b border-border bg-muted/30"
      >
        <div className="max-w-5xl mx-auto px-6 py-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="hover:text-foreground transition-colors"
            >
              {s.title}
            </a>
          ))}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              <div className="flex items-start gap-3 mb-4">
                <div className="rounded-md bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {section.intro}
                  </p>
                </div>
              </div>
              <ul className="grid md:grid-cols-2 gap-3">
                {section.items.map((item) => (
                  <li
                    key={item.label}
                    className="rounded-md border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground/70" />
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.status === "roadmap" && (
                        <span className="ml-auto text-[10px] uppercase tracking-wide text-warning font-semibold">
                          Roadmap
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/90 leading-relaxed">
                      {item.detail}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <section className="rounded-lg border border-border bg-muted/30 p-6">
          <h3 className="text-base font-semibold mb-2">Due diligence corporativa</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            Para times de TI, segurança e jurídico que precisam responder por
            arquitetura, LGPD, IA, retenção, uploads, PDFs ou suboperadores,
            esta página cobre o necessário para validação de primeiro nível.
            Documentos formais (DPA, inventário detalhado de suboperadores,
            relatórios de auditoria) são fornecidos sob solicitação via canal
            de feedback (categoria <em>Privacidade</em>).
          </p>
          <Link
            to="/privacidade"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Política de Privacidade completa <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>

        <footer className="pt-6 border-t border-border text-xs text-muted-foreground">
          Última revisão: maio de 2026. Atualizada a cada wave de governança ou
          mudança de suboperador.
        </footer>
      </div>
    </main>
  );
}
