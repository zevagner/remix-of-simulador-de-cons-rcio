import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calculator, BarChart3, Target, TrendingUp, ShieldCheck,
  CheckCircle2, ArrowRight, Plus, Clock, FileBadge, Timer,
  FileText, ListChecks, LayoutDashboard,
  MessageSquare, Star, Quote, Zap, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LandingNav } from '@/components/landing/LandingNav';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={stagger}
      className={`px-4 md:px-8 py-20 md:py-28 ${className}`}
    >
      <div className="max-w-7xl mx-auto">{children}</div>
    </motion.section>
  );
}

export default function LandingPage() {
  const nav = useNavigate();
  const goSignup = () => nav('/signup');

  return (
    <div className="landing-v2 min-h-screen bg-landing-bg text-landing-fg font-sans antialiased">
      <LandingNav />

      {/* ====== 1. HERO ====== */}
      <section className="relative bg-[#003641] text-white overflow-hidden" style={{ fontFamily: "'Work Sans', sans-serif" }}>
        <div className="relative w-full max-w-7xl mx-auto px-6 md:px-8 pt-28 md:pt-32 pb-24 md:pb-32">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* ---- Copy ---- */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="lg:col-span-7 space-y-7 z-10 relative"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#005F7F]/30 border border-[#005F7F]/50 text-[#E8F4F7] text-xs font-semibold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5821F] animate-pulse" aria-hidden="true" />
                Para Consultores e Gerentes de Consórcio
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight text-white font-bold"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Você já sabe vender consórcio. Agora tem a ferramenta que merecia.
              </motion.h1>

              <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-white/80 max-w-xl leading-relaxed font-medium">
                Simulação completa, estratégia de lance e proposta profissional — em 30 segundos. Do primeiro contato ao fechamento.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap items-center gap-8 pt-2">
                <button
                  onClick={goSignup}
                  className="px-8 py-4 bg-[#F5821F] text-[#003641] font-bold rounded-xl text-base md:text-lg shadow-xl shadow-[#F5821F]/25 hover:scale-[1.03] transition-transform active:scale-[0.98]"
                >
                  Criar minha conta
                </button>
                <button
                  onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm md:text-base font-medium text-white/70 hover:text-white transition-colors"
                >
                  Ver a plataforma &rarr;
                </button>
              </motion.div>

              <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-white/40 uppercase tracking-[0.15em] pt-2">
                <span>Acesso imediato</span>
              </motion.div>
            </motion.div>

            {/* ---- Mockup ---- */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5 relative flex justify-center lg:justify-end"
            >
              <div className="absolute -inset-10 bg-[#005F7F] opacity-20 blur-[80px] rounded-full pointer-events-none" aria-hidden="true" />
              
              {/* Simplified high-impact mockup card */}
              <div className="relative w-full max-w-[380px] bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-6">
                {/* Header Section */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Simulação de Consórcio</p>
                  <h3 className="text-3xl font-black text-[#003641] tabular-nums">R$ 350.000,00</h3>
                  <p className="text-xs text-slate-500 font-medium">Crédito Imobiliário · 200 meses</p>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Values Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Parcela Mensal</p>
                    <p className="text-lg font-bold text-[#003641] tabular-nums">R$ 1.842,50</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Lance Sugerido</p>
                    <p className="text-lg font-bold text-[#F5821F] tabular-nums">25%</p>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Probability Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Probabilidade de Contemplação</p>
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded tracking-tighter">ALTA</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* PDF Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">Proposta_Imobiliaria_v1.pdf</p>
                      <p className="text-[10px] text-slate-400 font-medium">Gerada há 15 segundos</p>
                    </div>
                  </div>
                  <button className="w-full py-3.5 bg-[#003641] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#002B34] transition-colors">
                    Visualizar Proposta Profissional
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ====== BARRA DE MÉTRICAS ====== */}
      <div className="bg-[#003641] border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-8 text-center">
          {[
            { value: '30s', label: 'para gerar uma simulação completa', highlight: true },
            { value: '100%', label: 'dados de mercado' },
            { value: 'Zero', label: 'planilhas. Zero improviso.' },
          ].map((s, i) => (
            <div key={s.label} className={`flex flex-col items-center ${i > 0 ? 'md:border-l md:border-white/10' : ''}`}>
              <span className={`text-display font-black tabular-nums ${s.highlight ? 'text-[#F5821F] text-5xl md:text-6xl' : 'text-white text-4xl md:text-5xl'}`}>
                {s.value}
              </span>
              <span className="mt-3 text-xs md:text-sm uppercase tracking-[0.2em] text-white/50 font-bold max-w-[200px]">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ====== 2. PROBLEMA ====== */}
      <Section id="problema" className="bg-white">
        <motion.div variants={fadeUp} className="max-w-2xl mb-14">
          <div className="lv2-eyebrow mb-4" style={{ color: 'hsl(var(--landing-muted))' }}>Para quem é</div>
          <h2 className="text-3xl md:text-[2.5rem] font-bold text-landing-heading leading-[1.15] tracking-tight">
            Reconhece algum desses cenários?
          </h2>
        </motion.div>
        <motion.ul variants={stagger} className="max-w-4xl divide-y divide-landing-border border-y border-landing-border">
          {[
            'Simulações feitas na mão, em planilhas sem padrão',
            'Propostas montadas do zero a cada atendimento',
            'Clientes que somem após receber a planilha',
            'Dificuldade em explicar lance e contemplação com clareza',
            'Sem registro do histórico de cada cliente',
            'Sem processo — cada venda depende do improviso do dia',
          ].map((p, i) => (
            <motion.li key={p} variants={fadeUp} className="flex items-start gap-6 py-5 group">
              <span className="text-xs font-mono text-blue-600 pt-1 tabular-nums font-semibold">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-subtitle md:text-base text-landing-heading/90 leading-relaxed flex-1">{p}</p>
            </motion.li>
          ))}
        </motion.ul>
        <motion.div variants={fadeUp} className="mt-16 max-w-2xl">
          <p className="text-2xl font-medium text-[#003641] leading-relaxed">
            Não é falta de competência. É falta de ferramenta.
          </p>
        </motion.div>
      </Section>

      {/* ====== 3. TRANSIÇÃO ====== */}
      <section className="relative bg-[#003641] py-20 px-4">
        <div className="absolute inset-0 lv2-grain opacity-[0.03] pointer-events-none" aria-hidden="true" />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                    className="max-w-3xl mx-auto text-center">
          <LayoutDashboard className="h-9 w-9 text-blue-400 mx-auto mb-5" strokeWidth={1.6} />
          <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight tracking-tight">
            Uma plataforma feita para quem leva consórcio a sério.
          </h2>
        </motion.div>
      </section>

      {/* ====== 4. FEATURES ====== */}
      <Section id="beneficios" className="bg-white">
        <motion.div variants={fadeUp} className="max-w-2xl mb-14">
          <h2 className="text-3xl md:text-[2.5rem] font-bold text-[#003641] leading-[1.15] tracking-tight">
            Tudo que você precisa em um atendimento
          </h2>
          <p className="mt-4 text-landing-muted text-lg leading-relaxed">Cinco recursos integrados no mesmo fluxo de trabalho.</p>
        </motion.div>

        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Timer, title: 'Simulação em 30 segundos', desc: 'Informe crédito, prazo e perfil do cliente. A plataforma calcula parcela, custo total e estratégia de lance em segundos.' },
            { icon: FileText, title: 'Proposta gerada automaticamente', desc: 'Documento completo, pronto para enviar por e-mail ou compartilhar o link. Sem montar slide, sem improvisar.' },
            { icon: BarChart3, title: 'Estratégia de lance com dados reais', desc: 'Análise das assembleias para definir o lance ideal com base em dados reais do mercado.' },
          ].map((b) => (
            <motion.div key={b.title} variants={fadeUp} className="p-8 rounded-2xl border bg-white border-slate-200 shadow-sm">
              <b.icon className="h-7 w-7 text-[#F5821F] mb-6 shrink-0" strokeWidth={2} />
              <h3 className="text-xl font-bold mb-4 tracking-tight text-[#003641]">{b.title}</h3>
              <p className="text-base leading-relaxed text-landing-muted">{b.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {[
            { text: 'Respostas prontas para cada dúvida do cliente' },
            { text: 'Pipeline organizado por etapa de contemplação' },
            { text: 'Método consultivo em cada proposta' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#F5821F] shrink-0" />
              <span className="text-base font-medium text-[#003641]">{item.text}</span>
            </div>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className="text-center mt-16">
          <Button size="lg" onClick={goSignup} className="bg-[#F5821F] hover:bg-[#F5821F]/90 text-[#003641] font-bold px-10 py-6 h-auto">
            Criar minha conta
          </Button>
        </motion.div>
      </Section>

      {/* ====== 5. COMO FUNCIONA — steps editoriais ====== */}
      <Section id="como-funciona" className="bg-[#f8f8f8]">
        <motion.div variants={fadeUp} className="max-w-2xl mb-14">
          <h2 className="text-3xl md:text-[2.5rem] font-bold text-landing-heading leading-[1.15] tracking-tight">
            Simples assim
          </h2>
        </motion.div>
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { step: '01', title: 'Simule', desc: 'Informe crédito, prazo e perfil. A plataforma calcula tudo e sugere a estratégia de lance em segundos.' },
            { step: '02', title: 'Gere a proposta', desc: 'Um documento completo, pronto para enviar por e-mail ou compartilhar o link.' },
            { step: '03', title: 'Acompanhe e feche', desc: 'Registre o cliente no pipeline, defina o próximo passo e receba alertas de follow-up automáticos.' },
          ].map((s) => (
            <div key={s.step} className="space-y-4">
              <div className="text-5xl font-black text-[#F5821F]/40">{s.step}</div>
              <h3 className="text-xl font-bold text-[#003641]">{s.title}</h3>
              <p className="text-base text-landing-muted leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </motion.div>
      </Section>

      {/* ====== 6. DIFERENCIAIS — Feito para Gerentes ====== */}
      <Section className="bg-[#003641] text-white">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-[2.5rem] font-bold tracking-tight">Feito para quem vende consórcio todos os dias</h2>
          <p className="mt-4 text-white/70 text-lg">Uma plataforma construída com gerentes de carteira, para gerentes de carteira.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-12 text-center">
          {[
            { icon: Clock, text: 'Proposta em 30 segundos', desc: 'Do crédito ao documento, em segundos.' },
            { icon: FileBadge, text: 'PDF profissional gerado automaticamente', desc: 'Pronto para enviar, sem montar slide.' },
            { icon: TrendingUp, text: 'Estratégia de lance baseada em dados reais', desc: 'Lance ideal com base no histórico do grupo.' },
          ].map((item) => (
            <div key={item.text} className="space-y-4">
              <item.icon className="h-7 w-7 text-[#F5821F] mx-auto" />
              <div className="space-y-2">
                <p className="text-xl font-bold">{item.text}</p>
                <p className="text-white/60 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-16">
          <Button onClick={goSignup} className="bg-[#F5821F] hover:bg-[#F5821F]/90 text-[#003641] font-bold px-10 py-6 h-auto">Criar minha conta</Button>
        </div>
      </Section>

      {/* ====== 7. FAQ — accordion ====== */}
      <Section id="duvidas" className="bg-white">
        <h2 className="text-3xl font-bold text-[#003641] mb-12">Perguntas frequentes</h2>
        <Accordion type="single" collapsible className="max-w-3xl space-y-4">
          {[
            { q: 'Em que dados as simulações e os estudos de lance são baseados?', a: 'As simulações usam fórmulas financeiras padrão de consórcio com parâmetros reais de mercado: taxa de administração, fundo de reserva e prazo. Os estudos de lance são baseados no histórico real das assembleias do grupo.' },
            { q: 'Qual é a curva de aprendizado para começar a usar?', a: 'A plataforma foi desenhada para quem já conhece consórcio. Na primeira simulação você já entende o fluxo completo — sem treinamento, sem manual.' },
            { q: 'Como a plataforma se posiciona em relação a planilhas próprias?', a: 'Planilhas são estáticas e dependem de quem as criou. A plataforma recalcula tudo em tempo real, gera a proposta automaticamente e mantém o histórico de cada cliente organizado.' },
            { q: 'Existe alguma cobrança ao criar a conta?', a: 'Não. O acesso é imediato e sem custo. Crie sua conta e use a plataforma completa.' },
            { q: 'A plataforma pode ser utilizada em dispositivos móveis?', a: 'Sim. O layout é responsivo e funciona bem em celular e tablet, tanto para simular quanto para gerar e compartilhar propostas.' },
          ].map((faq, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`} className="border border-slate-200 rounded-xl px-6">
              <AccordionTrigger className="font-bold text-[#003641]">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-landing-muted">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      {/* ====== 8. GARANTIA ====== */}
      <Section className="bg-[#f8f8f8] text-center">
        <ShieldCheck className="h-16 w-16 text-[#003641] mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-[#003641] mb-4">Sem risco. Sem compromisso.</h2>
        <p className="text-lg text-slate-600 mb-10">Crie sua conta, teste a plataforma completa e decida com calma. Acesso imediato para consultores e gerentes.</p>
        <div className="flex flex-wrap justify-center gap-8">
          {[
            { icon: ShieldCheck, text: "Dados seguros" },
            { icon: CheckCircle2, text: "Acesso imediato" },
            { icon: X, text: "Cancele quando quiser" }
          ].map((t) => (
            <div key={t.text} className="flex items-center gap-2">
              <t.icon className="h-5 w-5 text-[#F5821F]" />
              <span className="font-bold text-[#003641]">{t.text}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ====== 9. CTA FINAL ====== */}
      <section className="bg-[#003641] py-28 px-4 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Comece agora. Acesso imediato.</h2>
        <p className="text-white/70 text-xl mb-12">Plataforma completa. Acesso imediato para gerentes e consultores.</p>
        <Button onClick={goSignup} className="bg-[#F5821F] hover:bg-[#F5821F]/90 text-[#003641] font-bold px-12 py-7 text-xl h-auto">Criar minha conta</Button>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="bg-[#003641] border-t border-white/10 py-16 px-8 text-white/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 text-sm">
          <div className="space-y-4">
            <img src="/logo-landing.png" className="h-10 opacity-80" />
            <p>Plataforma consultiva para venda de consórcio.</p>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold">Plataforma</h4>
            <ul className="space-y-2">
              <li><button onClick={() => nav('/login')} className="hover:text-white transition-colors">Simulador</button></li>
              <li><button onClick={() => nav('/login')} className="hover:text-white transition-colors">Estudo de Lances</button></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
              <li><Link to="/termos" className="hover:text-white transition-colors">Termos</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
