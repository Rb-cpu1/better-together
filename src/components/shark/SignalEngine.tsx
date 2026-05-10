import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSignal, ASSET_LIST, type AssetKey } from "@/lib/signals.functions";
import { activeSessions } from "@/lib/indicators";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, Minus, RefreshCw, TrendingUp, Activity, Gauge, Clock } from "lucide-react";

const TIMEFRAMES = ["5m", "15m", "1h"] as const;

export function SignalEngine() {
  const [asset, setAsset] = useState<AssetKey>("BTC/USDT");
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]>("15m");
  const fn = useServerFn(getSignal);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["signal", asset, tf],
    queryFn: () => fn({ data: { asset, timeframe: tf } }),
    refetchInterval: 20_000,
    refetchOnWindowFocus: false,
  });

  const ok = data?.ok;
  const sig = ok ? data.signal : null;
  const sessions = activeSessions();

  const actionStyle =
    sig?.action === "BUY" ? "bg-success/15 text-success border-success/40"
    : sig?.action === "SELL" ? "bg-destructive/15 text-destructive border-destructive/40"
    : "bg-muted text-muted-foreground border-border";

  const ActionIcon = sig?.action === "BUY" ? ArrowUp : sig?.action === "SELL" ? ArrowDown : Minus;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ASSET_LIST.map((a) => (
            <button
              key={a.key}
              onClick={() => setAsset(a.key)}
              className={`font-mono text-xs px-2.5 py-1 rounded-md border transition ${
                asset === a.key ? "bg-primary text-primary-foreground border-primary glow-primary" : "border-border hover:border-primary/60"
              }`}
            >
              {a.key}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex gap-1">
            {TIMEFRAMES.map((t) => (
              <button
                key={t}
                onClick={() => setTf(t)}
                className={`font-mono text-xs px-2 py-1 rounded-md border ${
                  tf === t ? "bg-secondary text-secondary-foreground border-secondary" : "border-border hover:border-secondary/60"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Main signal card */}
      <div className="glass rounded-2xl p-6 relative overflow-hidden">
        {isFetching && <div className="absolute inset-x-0 top-0 h-px animate-shimmer" />}
        {isLoading && <p className="text-muted-foreground text-sm">Analisando o oceano de dados…</p>}
        {!isLoading && !ok && (
          <p className="text-destructive text-sm">⚠️ {data && !data.ok ? data.error : "Falha ao carregar"}</p>
        )}
        {sig && ok && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span>{data.label}</span>
                <span>•</span>
                <span>{data.timeframe}</span>
                <span>•</span>
                <span>{new Date(data.updatedAt).toLocaleTimeString()}</span>
              </div>
              <div className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-display text-2xl font-black tracking-wider ${actionStyle}`}>
                <ActionIcon className="h-6 w-6" />
                {sig.action}
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                  <span>Confiança</span>
                  <span>{sig.confidence.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${sig.confidence}%`,
                      background: sig.action === "BUY" ? "var(--gradient-primary)" : sig.action === "SELL" ? "var(--gradient-ember)" : "var(--muted)",
                    }}
                  />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat label="Entrada" value={fmt(sig.entry, asset)} />
                <Stat label="Stop Loss" value={fmt(sig.sl, asset)} tone="danger" />
                <Stat label="Take Profit" value={fmt(sig.tp, asset)} tone="success" />
              </div>
            </div>
            <div>
              <h3 className="font-display text-sm tracking-wider text-primary mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4" /> CONFLUÊNCIA
              </h3>
              <ul className="space-y-1.5 text-sm">
                {sig.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-foreground/90">{r}</span>
                  </li>
                ))}
                {sig.reasons.length === 0 && <li className="text-muted-foreground text-xs">Sem confluência clara — aguarde.</li>}
              </ul>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
                <Mini icon={<TrendingUp className="h-3 w-3" />} label="EMA 9/21/50" value={`${sig.indicators.ema9.toFixed(2)} / ${sig.indicators.ema21.toFixed(2)} / ${sig.indicators.ema50.toFixed(2)}`} />
                <Mini icon={<Gauge className="h-3 w-3" />} label="RSI" value={sig.indicators.rsi.toFixed(1)} />
                <Mini icon={<Activity className="h-3 w-3" />} label="MACD H." value={sig.indicators.macdHist.toFixed(4)} />
                <Mini icon={<Activity className="h-3 w-3" />} label="ATR" value={sig.indicators.atr.toFixed(4)} />
                <Mini icon={<Gauge className="h-3 w-3" />} label="Value Chart" value={sig.indicators.valueChart.toFixed(2)} />
                <Mini icon={<Clock className="h-3 w-3" />} label="Sessões" value={sessions.join("+") || "—"} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Session clock */}
      <div className="glass rounded-2xl p-4">
        <h3 className="font-display text-xs tracking-wider text-primary mb-2 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" /> RELÓGIO DE SESSÕES (UTC)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["Sydney", "Tokyo", "London", "New York"] as const).map((s) => {
            const active = sessions.includes(s);
            return (
              <div key={s} className={`rounded-lg border p-2 text-center transition ${active ? "border-primary/60 bg-primary/10" : "border-border bg-muted/30"}`}>
                <div className={`text-xs font-mono ${active ? "text-primary" : "text-muted-foreground"}`}>{s}</div>
                <div className="text-[10px] text-muted-foreground">{active ? "● ativa" : "○ fechada"}</div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Assistente analítico baseado em indicadores técnicos clássicos. Não é garantia de lucro — opere com gerenciamento de risco.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" | "success" }) {
  const color = tone === "danger" ? "text-destructive" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2">
      <div className="text-[10px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className={`font-mono text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground">{icon}{label}</div>
      <div className="text-foreground truncate">{value}</div>
    </div>
  );
}

function fmt(v: number, asset: AssetKey) {
  if (asset === "USD/JPY") return v.toFixed(3);
  if (asset.includes("USD") && (asset.startsWith("EUR") || asset.startsWith("GBP"))) return v.toFixed(5);
  if (asset === "XAU/USD") return v.toFixed(2);
  return v >= 100 ? v.toFixed(2) : v.toFixed(4);
}