import { useEffect, useState } from "react";

export function SharkSplash({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setProgress((p) => Math.min(100, p + 4)), 60);
    const done = setTimeout(onDone, 1800);
    return () => { clearInterval(t); clearTimeout(done); };
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-grid">
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div className="absolute inset-x-0 h-px animate-scan" style={{ background: "linear-gradient(90deg,transparent,var(--shark-glow),transparent)" }} />
      <div className="relative z-10 flex flex-col items-center gap-5 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full animate-pulse-ring" />
          <div className="text-7xl animate-shark-float">🦈</div>
        </div>
        <h1 className="font-display text-4xl font-black tracking-wider text-glow">BOT TUBARÃO</h1>
        <div className="font-mono text-xs text-primary/80">V3 • INTELIGÊNCIA ARTIFICIAL</div>
        <div className="w-64 h-1.5 rounded-full overflow-hidden bg-muted">
          <div className="h-full transition-all duration-150" style={{ width: `${progress}%`, background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }} />
        </div>
        <p className="text-sm text-muted-foreground font-mono">Conectando ao oceano de dados…</p>
      </div>
    </div>
  );
}
