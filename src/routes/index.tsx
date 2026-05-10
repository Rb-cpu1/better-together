import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brain, Activity, ShieldCheck, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { SharkSplash } from "@/components/shark/SharkSplash";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const [splash, setSplash] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!splash && !loading && user) navigate({ to: "/dashboard" }).catch(() => {});
  }, [splash, loading, user, navigate]);

  if (splash) return <SharkSplash onDone={() => setSplash(false)} />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-grid">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-hero)" }} />
      <div className="absolute inset-x-0 h-px animate-scan opacity-30" style={{ background: "linear-gradient(90deg,transparent,var(--shark-glow),transparent)" }} />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦈</span>
          <span className="font-display text-lg font-bold tracking-wider">BOT TUBARÃO</span>
          <span className="ml-2 rounded-md border border-primary/30 px-2 py-0.5 font-mono text-[10px] text-primary">V3</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link to="/login">Entrar</Link></Button>
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
            <Link to="/login" search={{ tab: "register" }}>Começar</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-12 pb-24 animate-fade-up">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-xs text-primary">
            <Sparkles className="h-3 w-3" /> Análise técnica em tempo real
          </div>
          <h1 className="mt-6 font-display text-5xl font-black leading-[1.05] sm:text-6xl text-glow">
            O sistema que <span className="text-ember">caça oportunidades</span><br />
            no mercado financeiro.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Bot Tubarão V3 combina indicadores clássicos (EMA, RSI, MACD, Bollinger, ATR) com confluência ponderada
            para entregar sinais de entrada com nível de confiança transparente.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
              <Link to="/login" search={{ tab: "register" }}>Ativar agora <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary/40">
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </div>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Aviso: ferramenta analítica, não promessa de lucro. Trading envolve risco.
          </p>
        </div>

        {/* Feature grid */}
        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Brain, title: "IA de Confluência", desc: "Score 0–100% baseado em múltiplos indicadores alinhados." },
            { icon: Activity, title: "Dados Reais", desc: "Candles ao vivo da Binance Spot — sem mock." },
            { icon: TrendingUp, title: "SL & TP por ATR", desc: "Gestão de risco calculada do volatilidade real." },
            { icon: ShieldCheck, title: "Conta Segura", desc: "Login criptografado e código de ativação por plano." },
          ].map((f, i) => (
            <div key={f.title} className="glass rounded-2xl p-5 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/50 py-6 text-center font-mono text-xs text-muted-foreground">
        🦈 Tubarão Trading • Bot Tubarão V3 Ultimate
      </footer>
    </div>
  );
}
