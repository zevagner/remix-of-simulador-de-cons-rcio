import { Link } from "react-router-dom";
import { Shield, ArrowLeft, Lock, Eye, FileText, Globe, UserCheck, Clock, MessageSquare, AlertTriangle } from "lucide-react";

/**
 * Política de Privacidade Completa - Conformidade LGPD
 * Atualizada conforme a realidade técnica e operacional do sistema.
 */
export default function PrivacyPolicyPage() {
  const lastUpdate = "04 de junho de 2026";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased pb-20">
      {/* Header Branded */}
      <div className="bg-[#003641] text-white py-12 px-6 mb-8 shadow-md">
        <div className="max-w-4xl mx-auto">
          <Link 
            to="/" 
            className="inline-flex items-center text-white/70 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Voltar para o Início
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-[#F5821F]" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Política de Privacidade</h1>
          </div>
          <p className="text-white/60 text-sm">
            Esta política descreve como tratamos seus dados em conformidade com a LGPD (Lei 13.709/2018).
          </p>
          <div className="mt-6 inline-block bg-white/10 px-3 py-1 rounded-full text-xs font-medium border border-white/10">
            Vigência: {lastUpdate}
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-6 space-y-12">
        
        {/* 1. Introdução */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <UserCheck className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-[#003641]">1. Quem somos e Controlador de Dados</h2>
          </div>
          <div className="text-slate-600 leading-relaxed space-y-4">
            <p>
              O <strong>Simulador de Consórcio</strong> é uma ferramenta desenvolvida e operada por um funcionário da CAIXA Econômica Federal em caráter independente, como pessoa física, para uso colaborativo interno entre colegas (gerentes e funcionários).
            </p>
            <p>
              O controlador dos dados pessoais tratados nesta plataforma é o desenvolvedor independente, não havendo CNPJ ou entidade jurídica associada a esta operação. A CAIXA Econômica Federal não é controladora, operadora ou responsável por este sistema.
            </p>
          </div>
        </section>

        {/* 2. Coleta de Dados */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Eye className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-[#003641]">2. Dados coletados e Finalidade</h2>
          </div>
          <div className="overflow-hidden border border-slate-100 rounded-xl mb-6">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Tipo de Dado</th>
                  <th className="px-4 py-3">Dados Específicos</th>
                  <th className="px-4 py-3">Finalidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-4 font-medium text-slate-700">Identificação do Usuário</td>
                  <td className="px-4 py-4 text-slate-600">Nome ou apelido (informado livremente) e e-mail corporativo.</td>
                  <td className="px-4 py-4 text-slate-600">Autenticação e controle de acesso.</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium text-slate-700">Parâmetros Técnicos</td>
                  <td className="px-4 py-4 text-slate-600">Valores de carta, prazos e taxas simuladas.</td>
                  <td className="px-4 py-4 text-slate-600">Armazenados temporariamente para recuperação de sessão.</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium text-slate-700">Telemetria Interna</td>
                  <td className="px-4 py-4 text-slate-600">Eventos de uso por módulo e performance (sem PII).</td>
                  <td className="px-4 py-4 text-slate-600">Monitoramento e melhoria da ferramenta.</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium text-slate-700">Feedbacks</td>
                  <td className="px-4 py-4 text-slate-600">Sugestões e relatos enviados via texto livre.</td>
                  <td className="px-4 py-4 text-slate-600">Melhoria contínua baseada na experiência do usuário.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Dados não coletados (Privacidade por Design)
            </h3>
            <p className="text-sm text-amber-700 leading-relaxed">
              <strong>Não coletamos nem armazenamos dados de clientes finais</strong> (nome, CPF, telefone ou endereço). Caso algum dado de cliente seja informado para a geração de PDFs, ele é processado exclusivamente em memória durante a operação e descartado imediatamente, nunca sendo salvo em banco de dados ou storage.
            </p>
          </div>
        </section>

        {/* 3. Cookies e Armazenamento Local */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Globe className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-[#003641]">3. Cookies e Armazenamento Local</h2>
          </div>
          <p className="text-slate-600 leading-relaxed mb-4">
            Esta aplicação não utiliza cookies de rastreamento, marketing ou analytics de terceiros.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            O armazenamento local do navegador (localStorage) é utilizado exclusivamente para:
          </p>
          <ul className="space-y-2 mb-6 list-disc list-inside text-sm text-slate-600">
            <li>Manter a sessão de autenticação do usuário (token Supabase)</li>
            <li>Salvar preferência de tema (claro/escuro)</li>
            <li>Auto-salvar os parâmetros da última simulação para recuperação de sessão (sem vínculo a cliente identificável)</li>
            <li>Registrar a decisão de consentimento de telemetria</li>
          </ul>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h3 className="text-sm font-bold text-[#003641] mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Telemetria interna opcional
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              O sistema coleta dados de uso e performance (módulos acessados, erros técnicos) enviados diretamente para o banco de dados interno da aplicação. Nenhum dado é compartilhado com fornecedores externos de analytics ou marketing. Esta coleta é opcional e pode ser recusada no banner de consentimento exibido no primeiro acesso.
            </p>
          </div>
        </section>

        {/* 4. Compartilhamento */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Globe className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-[#003641]">4. Compartilhamento com Terceiros</h2>
          </div>
          <p className="text-slate-600 leading-relaxed mb-4">
            Para o funcionamento da plataforma, utilizamos operadores de dados (subprocessadores) que seguem padrões internacionais de segurança:
          </p>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm text-slate-600">
              <span className="font-bold text-slate-800 w-32 shrink-0">Supabase:</span>
              <span>Infraestrutura de banco de dados, autenticação e armazenamento em nuvem.</span>
            </li>
            <li className="flex gap-3 text-sm text-slate-600">
              <span className="font-bold text-slate-800 w-32 shrink-0">Sentry:</span>
              <span>Monitoramento de erros e bugs técnicos em tempo real para estabilidade do sistema.</span>
            </li>
          </ul>
        </section>

        {/* 5. Transferência Internacional */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ArrowLeft className="h-5 w-5 text-blue-600 rotate-180" />
            </div>
            <h2 className="text-xl font-bold text-[#003641]">5. Transferência Internacional</h2>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Como utilizamos infraestrutura de nuvem global (Supabase e Sentry), seus dados podem ser processados em servidores localizados fora do território nacional, principalmente nos Estados Unidos. Estas transferências são realizadas com base em mecanismos legais que garantem proteção de dados equivalente à LGPD.
          </p>
        </section>

        {/* 6. Retenção de Dados */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-[#003641]">6. Retenção e Exclusão</h2>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Mantemos os dados apenas pelo tempo necessário para cumprir as finalidades descritas:
          </p>
          <ul className="mt-4 space-y-2 list-disc list-inside text-sm text-slate-600">
            <li><strong>Dados de Conta:</strong> Mantidos enquanto o usuário utilizar a ferramenta ou até que solicite a exclusão.</li>
            <li><strong>Logs e Telemetria:</strong> Mantidos por até 12 meses para fins de análise técnica e segurança.</li>
            <li><strong>Feedbacks:</strong> Mantidos por tempo indeterminado para histórico de melhorias do sistema.</li>
          </ul>
        </section>

        {/* 7. Direitos do Titular */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-[#003641]">7. Seus Direitos (Art. 18 LGPD)</h2>
          </div>
          <p className="text-slate-600 leading-relaxed mb-4">
            Você tem direito a solicitar, a qualquer momento:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Confirmação da existência de tratamento",
              "Acesso aos seus dados",
              "Correção de dados incompletos ou inexatos",
              "Anonimização ou bloqueio de dados desnecessários",
              "Portabilidade dos dados",
              "Eliminação dos dados pessoais",
              "Informação sobre compartilhamento",
              "Revogação do consentimento"
            ].map((direito, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {direito}
              </div>
            ))}
          </div>
        </section>

        {/* 8. Segurança */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <Lock className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-[#003641]">8. Segurança dos Dados</h2>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Implementamos medidas técnicas para proteger seus dados contra acessos não autorizados, incluindo criptografia em trânsito e repouso, além de isolamento de dados por usuário via políticas de segurança no banco de dados (Row-Level Security).
          </p>
        </section>

        {/* 9. Contato */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-[#003641]">9. Como exercer seus direitos</h2>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Para exercer qualquer direito previsto na LGPD ou tirar dúvidas sobre esta política, entre em contato diretamente com o desenvolvedor através do e-mail: <span className="font-mono bg-slate-100 px-2 py-1 rounded">jose-vagner.pinto@caixa.gov.br</span>.
          </p>
        </section>

        {/* 10. Alterações */}
        <section className="p-8 border-t border-slate-200 text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-[#003641] mb-2">10. Alterações nesta Política</h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Esta política pode ser atualizada periodicamente. Recomendamos a consulta regular. Alterações significativas serão notificadas através de avisos no sistema.
          </p>
        </section>

        <footer className="text-center pt-8">
          <Link 
            to="/termos" 
            className="text-[#003641] font-semibold hover:underline flex items-center justify-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Ver Termos de Uso
          </Link>
        </footer>
      </article>
    </main>
  );
}