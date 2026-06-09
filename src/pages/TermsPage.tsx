import { Link } from "react-router-dom";

/**
 * Termos de Uso.
 * Objetivos: definir natureza consultiva, limites, propriedade, conduta,
 * disponibilidade, terminação e foro.
 */
export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="max-w-3xl mx-auto px-6 py-12 prose prose-sm dark:prose-invert">
        <header className="mb-8 not-prose">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Voltar
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Termos de Uso</h1>
          <p className="text-sm text-muted-foreground">Última atualização: 17 de maio de 2026</p>
        </header>

        <section>
          <h2>1. Natureza do serviço</h2>
          <p>
            Esta é uma plataforma consultiva de simulação de consórcio destinada a
            gerentes e funcionários da CAIXA Econômica Federal autorizados. Os cálculos exibidos são <strong>simulações
            ilustrativas</strong>, não constituem proposta vinculante, oferta de crédito ou
            garantia de contemplação. Decisões financeiras são de responsabilidade exclusiva
            do usuário e do cliente final.
          </p>
        </section>

        <section>
          <h2>2. Cadastro e elegibilidade</h2>
          <p>
            O acesso é mediante aprovação. Você é responsável por manter as credenciais
            seguras e pela atividade na sua conta.
          </p>
        </section>

        <section>
          <h2>3. Uso aceitável</h2>
          <ul>
            <li>Não use para finalidade ilícita ou contrária à regulação aplicável.</li>
            <li>Não tente burlar controles de segurança, RLS, rate-limits ou marca d'água.</li>
            <li>Não compartilhe credenciais ou exporte dados de terceiros sem base legal.</li>
            <li>Não use o conteúdo gerado por IA como aconselhamento financeiro definitivo.</li>
          </ul>
        </section>

        <section>
          <h2>4. PDFs e propostas</h2>
          <p>
            Todo documento gerado inclui marca d'água com data, ambiente e identificador
            tokenizado do autor, para fins de rastreabilidade e auditoria.
          </p>
        </section>

        <section>
          <h2>5. Inteligência Artificial</h2>
          <p>
            O conteúdo gerado por IA é <strong>auxiliar</strong>. Pode conter imprecisões.
            Sempre revise antes de apresentar a um cliente. PII é mascarada antes de qualquer
            envio ao provedor de IA.
          </p>
        </section>

        <section>
          <h2>6. Disponibilidade</h2>
          <p>
            Esforço razoável para alta disponibilidade, sem SLA contratual implícito.
            Manutenções podem causar indisponibilidades pontuais.
          </p>
        </section>

        <section>
          <h2>7. Propriedade intelectual</h2>
          <p>
            O software e o design desta plataforma foram desenvolvidos e pertencem ao desenvolvedor independente responsável por sua operação, identificado na Política de Privacidade. Os
            dados operacionais inseridos pelo usuário permanecem sob sua titularidade.
          </p>
        </section>

        <section>
          <h2>8. Terminação</h2>
          <p>
            Você pode encerrar sua conta a qualquer momento via <em>Privacidade → Excluir
            conta</em>. O desenvolvedor responsável pode suspender contas em caso de violação destes termos
            ou risco operacional/de segurança.
          </p>
        </section>

        <section>
          <h2>9. Limitação de responsabilidade</h2>
          <p>
            Na máxima extensão permitida em lei, o desenvolvedor responsável não responde por decisões
            financeiras tomadas com base em simulações ilustrativas ou por indisponibilidades
            de suboperadores listados na <Link to="/privacidade">Política de Privacidade</Link>.
          </p>
        </section>

        <section>
          <h2>10. Alterações</h2>
          <p>
            Estes termos podem ser atualizados. A versão vigente é sempre a publicada nesta
            página.
          </p>
        </section>

        <footer className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
          <Link to="/privacidade" className="hover:text-foreground">Política de Privacidade →</Link>
        </footer>
      </article>
    </main>
  );
}
