import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { SignalEngine } from "@/components/shark/SignalEngine";
import { BinarySignalEngine } from "@/components/shark/BinarySignalEngine";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"forex" | "binary">("forex");
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" }).catch(() => {});
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-grid">
      <header className="glass border-b border-border/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🦈</span>
            <span className="font-display font-bold tracking-wider">BOT TUBARÃO</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground hidden sm:block">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 animate-fade-up">
        <div className="mb-4">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-glow">
            SHARK {mode === "binary" ? "BINARY" : "FOREX"} ENGINE
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {mode === "binary"
              ? "CALL/PUT com Suporte/Resistência · Value Chart · RSI · MACD · timer da próxima vela."
              : "Motor multi-ativo com EMA · RSI · MACD · ATR · Value Chart · Sessões — dados ao vivo."}
          </p>
        </div>
        <div className="mb-4 inline-flex rounded-xl border border-border bg-muted/30 p-1">
          <button
            onClick={() => setMode("forex")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition ${
              mode === "forex" ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Forex / Cripto
          </button>
          <button
            onClick={() => setMode("binary")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition ${
              mode === "binary" ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Opções Binárias
          </button>
        </div>
        {mode === "forex" ? <SignalEngine /> : <BinarySignalEngine />}
      </main>
    </div>
  );
}
