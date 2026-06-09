import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '#problema', label: 'O Problema' },
  { href: '#beneficios', label: 'Benefícios' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#resultados', label: 'Resultados' },
  { href: '#duvidas', label: 'Dúvidas' },
];

export function LandingNav() {
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="absolute top-0 inset-x-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-8 h-20">
        <button onClick={() => nav('/')} className="flex items-center gap-2.5 group">
          <span className="w-8 h-8 rounded-lg bg-[#F5821F] shadow-md shadow-[#F5821F]/20 transition-transform group-hover:scale-105" aria-hidden="true" />
          <span className="font-semibold text-lg tracking-tight text-white">
            Simulador de <span className="text-[#F5821F]">Consórcio</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => nav('/login')}
            className="hidden sm:inline-flex px-5 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Já tenho conta
          </button>
          <button
            onClick={() => nav('/signup')}
            className="hidden sm:inline-flex px-5 py-2.5 rounded-full border border-white/20 text-sm font-semibold text-white hover:bg-white/10 transition-all"
          >
            Área do Gerente
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-white/80 hover:text-white transition-colors"
            aria-label="Abrir menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden absolute inset-x-0 top-20 bg-[#003641]/95 backdrop-blur-lg border-b border-white/10 shadow-xl animate-fade-in">
          <nav className="flex flex-col px-6 py-4 gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 text-base font-medium text-white/80 hover:text-[#F5821F] transition-colors border-b border-white/10 last:border-0"
              >
                {l.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              <button
                onClick={() => { nav('/signup'); setMenuOpen(false); }}
                className="px-6 py-3 rounded-xl bg-[#F5821F] text-[#003641] font-bold w-full"
              >
                Criar minha conta
              </button>
              <button
                onClick={() => { nav('/login'); setMenuOpen(false); }}
                className="px-6 py-3 rounded-xl border border-white/20 text-white font-medium w-full"
              >
                Já tenho conta
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
