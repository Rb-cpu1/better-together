import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBinarySignal, ASSET_LIST, type AssetKey } from "@/lib/signals.functions";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Minus, RefreshCw, Timer, Activity, Gauge, Layers } from "lucide-react";

const TIMEFRAMES = ["5m", "15m", "1h"] as const;

export function BinarySignalEngine() {
  const [asset, setAsset] = useState<AssetKey>("EUR/USD");
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]>("5m");
  const fn = useServerFn(getBinarySignal);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["binary-signal", asset, tf],
    queryFn: () => fn({ data: { asset, timeframe: tf } }),
    refetchInterval: 15_000,
    refetchOnWindowFocus: false,
  });

  const ok = data?.ok;
  const sig = ok ? data.signal : null;

  // live countdown using last fetched candle time
  const liveSeconds = sig ? Math.max(0, sig.candleSecondsLeft - Math.floor((now - data.updatedAt) / 1000)) : 0;
  const totalExpiry = sig ? Math.max(0, sig.expirySeconds - Math.floor((now - data.updatedAt) / 1000)) : 0;

  const actionStyle =
    sig?.action === "CALL" ? "bg-success/15 text-success border-success/40"
    : sig?.action === "PUT" ? "bg-destructive/15 text-destructive border-destructive/40"
    : "bg-muted text-muted-foreground border-border";
  const ActionIcon = sig?.action === "CALL" ? ArrowUp : sig?.action === "PUT" ? ArrowDown : Minus;

  return (
    <div className="space-y-4">
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

      <div className="glass rounded-2xl p-6">
        {isLoading && <p className="text-muted-foreground text-sm">Analisando padrões binários…</p>}
        {!isLoading && !ok && <p className="text-destructive text-sm">⚠️ {data && !data.ok ? data.error : "Falha ao carregar"}</p>}
        {sig && ok && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span>{data.label}</span><span>•</span><span>{data.timeframe}</span><span>•</span>
                <span>{new Date(data.updatedAt).toLocaleTimeString()}</span>
              </div>
              <div className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-display text-2xl font-black tracking-wider ${actionStyle}`}>
                <ActionIcon className="h-6 w-6" />
                {sig.action}
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                  <span>Confiança</span><span>{sig.confidence.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full transition-all duration-500" style={{
                    width: `${sig.confidence}%`,
                    background: sig.action === "CALL" ? "var(--gradient-primary)" : sig.action === "PUT" ? "var(--gradient-ember)" : "var(--muted)",
                  }} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                  <div className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground font-mono"><Timer className="h-3 w-3" />Próxima vela</div>
                  <div className="font-mono text-2xl font-bold text-primary">{fmtTime(liveSeconds)}</div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="text-[10px] uppercase text-muted-foreground font-mono">Expiração sugerida</div>
                  <div className="font-mono text-2xl font-bold">{sig.expiryCandles} vela{sig.expiryCandles > 1 ? "s" : ""}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">~{fmtTime(totalExpiry)}</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Stat label="Preço" value={fmt(sig.price, asset)} />
                <Stat label="Suporte" value={sig.nearestSupport ? fmt(sig.nearestSupport, asset) : "—"} tone="success" />
                <Stat label="Resistência" value={sig.nearestResistance ? fmt(sig.nearestResistance, asset) : "—"} tone="danger" />
              </div>
            </div>

            <div>
              <h3 className="font-display text-sm tracking-wider text-primary mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4" /> CONFLUÊNCIA BINÁRIA
              </h3>
              <ul className="space-y-1.5 text-sm">
                {sig.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-foreground/90">{r}</span>
                  </li>
                ))}
                {sig.reasons.length === 0 && <li className="text-muted-foreground text-xs">Sem confluência — não opere.</li>}
              </ul>

              <h4 className="mt-4 font-display text-xs tracking-wider text-primary flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" /> NÍVEIS S/R
              </h4>
              <div className="mt-2 space-y-1">
                {sig.levels.slice(0, 5).map((lv, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono">
                    <span className={lv.kind === "support" ? "text-success" : "text-destructive"}>
                      {lv.kind === "support" ? "▲ Suporte" : "▼ Resistência"}
                    </span>
                    <span>{fmt(lv.price, asset)}</span>
                    <span className="text-muted-foreground">×{lv.strength}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
                <Mini icon={<Gauge className="h-3 w-3" />} label="RSI" value={sig.indicators.rsi.toFixed(1)} />
                <Mini icon={<Activity className="h-3 w-3" />} label="MACD H." value={sig.indicators.macdHist.toFixed(4)} />
                <Mini icon={<Gauge className="h-3 w-3" />} label="Value Chart" value={sig.indicators.valueChart.toFixed(2)} />
                <Mini icon={<Activity className="h-3 w-3" />} label="ATR %" value={sig.indicators.atrPct.toFixed(2) + "%"} />
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground px-2">
        Opções binárias têm risco elevado. Entre apenas com confiança ≥ 60% e respeite a expiração sugerida. Não é garantia de lucro.
      </p>
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
function fmtTime(s: number) {
  const m = Math.floor(s / 60), r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
function fmt(v: number, asset: AssetKey) {
  if (asset === "USD/JPY") return v.toFixed(3);
  if (asset.startsWith("EUR") || asset.startsWith("GBP")) return v.toFixed(5);
  if (asset === "XAU/USD") return v.toFixed(2);
  return v >= 100 ? v.toFixed(2) : v.toFixed(4);
}
