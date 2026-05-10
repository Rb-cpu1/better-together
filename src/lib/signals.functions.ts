import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateSignal, type Candle } from "./indicators";

const ASSETS = {
  // Crypto via Binance
  "BTC/USDT": { source: "binance", symbol: "BTCUSDT", label: "Bitcoin", kind: "crypto" },
  "ETH/USDT": { source: "binance", symbol: "ETHUSDT", label: "Ethereum", kind: "crypto" },
  "SOL/USDT": { source: "binance", symbol: "SOLUSDT", label: "Solana", kind: "crypto" },
  // Forex + Gold via Yahoo
  "EUR/USD": { source: "yahoo", symbol: "EURUSD=X", label: "Euro / Dólar", kind: "forex" },
  "GBP/USD": { source: "yahoo", symbol: "GBPUSD=X", label: "Libra / Dólar", kind: "forex" },
  "USD/JPY": { source: "yahoo", symbol: "JPY=X", label: "Dólar / Iene", kind: "forex" },
  "XAU/USD": { source: "yahoo", symbol: "GC=F", label: "Ouro", kind: "metal" },
} as const;

export type AssetKey = keyof typeof ASSETS;
export const ASSET_LIST = Object.entries(ASSETS).map(([k, v]) => ({ key: k as AssetKey, ...v }));

const TF_BINANCE: Record<string, string> = { "5m": "5m", "15m": "15m", "1h": "1h" };
const TF_YAHOO: Record<string, { interval: string; range: string }> = {
  "5m": { interval: "5m", range: "5d" },
  "15m": { interval: "15m", range: "10d" },
  "1h": { interval: "60m", range: "30d" },
};

async function fetchBinance(symbol: string, tf: string): Promise<Candle[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${TF_BINANCE[tf]}&limit=200`;
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`Binance ${r.status}`);
  const raw = (await r.json()) as unknown[][];
  return raw.map((row) => ({
    time: Number(row[0]),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5]),
  }));
}

async function fetchYahoo(symbol: string, tf: string): Promise<Candle[]> {
  const cfg = TF_YAHOO[tf];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${cfg.interval}&range=${cfg.range}`;
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`Yahoo ${r.status}`);
  const j: any = await r.json();
  const res = j?.chart?.result?.[0];
  if (!res) throw new Error("Yahoo: sem dados");
  const ts: number[] = res.timestamp ?? [];
  const q = res.indicators?.quote?.[0] ?? {};
  const out: Candle[] = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i], v = q.volume?.[i] ?? 0;
    if (o == null || h == null || l == null || c == null) continue;
    out.push({ time: ts[i] * 1000, open: o, high: h, low: l, close: c, volume: v });
  }
  return out;
}

const Schema = z.object({
  asset: z.enum(Object.keys(ASSETS) as [AssetKey, ...AssetKey[]]),
  timeframe: z.enum(["5m", "15m", "1h"]),
});

export const getSignal = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => Schema.parse(d))
  .handler(async ({ data }) => {
    const cfg = ASSETS[data.asset];
    try {
      const candles = cfg.source === "binance"
        ? await fetchBinance(cfg.symbol, data.timeframe)
        : await fetchYahoo(cfg.symbol, data.timeframe);
      const sig = generateSignal(candles);
      if (!sig) return { ok: false as const, error: "Dados insuficientes" };
      return {
        ok: true as const,
        asset: data.asset,
        label: cfg.label,
        kind: cfg.kind,
        timeframe: data.timeframe,
        signal: sig,
        updatedAt: Date.now(),
      };
    } catch (e: any) {
      console.error("getSignal error", e);
      return { ok: false as const, error: e?.message ?? "Falha ao buscar dados" };
    }
  });