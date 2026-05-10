// Pure technical indicators — no server-only deps. Safe both sides.
export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

export function sma(values: number[], period: number): number[] {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : NaN);
  }
  return out;
}

export function ema(values: number[], period: number): number[] {
  const out: number[] = [];
  const k = 2 / (period + 1);
  let prev = NaN;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { out.push(NaN); continue; }
    if (i === period - 1) {
      let s = 0; for (let j = 0; j < period; j++) s += values[j];
      prev = s / period; out.push(prev); continue;
    }
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

export function rsi(closes: number[], period = 14): number[] {
  const out: number[] = new Array(closes.length).fill(NaN);
  if (closes.length < period + 1) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgG = gain / period, avgL = loss / period;
  out[period] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const g = d > 0 ? d : 0, l = d < 0 ? -d : 0;
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
    out[i] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  }
  return out;
}

export function macd(closes: number[], fast = 12, slow = 26, signal = 9) {
  const ef = ema(closes, fast), es = ema(closes, slow);
  const line = closes.map((_, i) => ef[i] - es[i]);
  const sig = ema(line.map((v) => (isNaN(v) ? 0 : v)), signal);
  const hist = line.map((v, i) => v - sig[i]);
  return { line, signal: sig, hist };
}

export function atr(c: Candle[], period = 14): number[] {
  const out: number[] = new Array(c.length).fill(NaN);
  if (c.length < period + 1) return out;
  const tr: number[] = [];
  for (let i = 0; i < c.length; i++) {
    if (i === 0) { tr.push(c[i].high - c[i].low); continue; }
    tr.push(Math.max(c[i].high - c[i].low, Math.abs(c[i].high - c[i - 1].close), Math.abs(c[i].low - c[i - 1].close)));
  }
  let s = 0; for (let i = 0; i < period; i++) s += tr[i];
  out[period - 1] = s / period;
  for (let i = period; i < c.length; i++) out[i] = (out[i - 1] * (period - 1) + tr[i]) / period;
  return out;
}

// Value Chart (CHT) — normalized price vs short-term volatility band
export function valueChart(c: Candle[], period = 5): number[] {
  const closes = c.map((x) => x.close);
  const m = sma(closes, period);
  const ranges = c.map((x) => x.high - x.low);
  const avgR = sma(ranges, period);
  return c.map((x, i) => {
    const v = (x.close - m[i]) / (0.2 * avgR[i]);
    return isFinite(v) ? v : NaN;
  });
}

export type SessionName = "Sydney" | "Tokyo" | "London" | "New York";
export function activeSessions(date = new Date()): SessionName[] {
  const h = date.getUTCHours();
  const out: SessionName[] = [];
  if (h >= 22 || h < 7) out.push("Sydney");
  if (h >= 0 && h < 9) out.push("Tokyo");
  if (h >= 8 && h < 17) out.push("London");
  if (h >= 13 && h < 22) out.push("New York");
  return out;
}

// ===== Support / Resistance via pivot highs/lows (SS_SupportResistance concept) =====
export type SRLevel = { price: number; kind: "support" | "resistance"; strength: number };
export function pivotLevels(c: Candle[], left = 3, right = 3, lookback = 80): SRLevel[] {
  const out: SRLevel[] = [];
  const start = Math.max(left, c.length - lookback);
  for (let i = start; i < c.length - right; i++) {
    let isHigh = true, isLow = true;
    for (let k = 1; k <= left; k++) { if (c[i - k].high >= c[i].high) isHigh = false; if (c[i - k].low <= c[i].low) isLow = false; }
    for (let k = 1; k <= right; k++) { if (c[i + k].high >= c[i].high) isHigh = false; if (c[i + k].low <= c[i].low) isLow = false; }
    if (isHigh) out.push({ price: c[i].high, kind: "resistance", strength: 1 });
    if (isLow) out.push({ price: c[i].low, kind: "support", strength: 1 });
  }
  // cluster nearby levels
  const clustered: SRLevel[] = [];
  const tol = (c[c.length - 1].close) * 0.0015;
  for (const lv of out) {
    const near = clustered.find((x) => x.kind === lv.kind && Math.abs(x.price - lv.price) <= tol);
    if (near) { near.price = (near.price * near.strength + lv.price) / (near.strength + 1); near.strength += 1; }
    else clustered.push({ ...lv });
  }
  return clustered.sort((a, b) => b.strength - a.strength).slice(0, 6);
}

export function nearestLevel(price: number, levels: SRLevel[], kind: "support" | "resistance") {
  const pool = levels.filter((l) => l.kind === kind && (kind === "support" ? l.price <= price : l.price >= price));
  if (!pool.length) return null;
  return pool.reduce((a, b) => Math.abs(a.price - price) < Math.abs(b.price - price) ? a : b);
}

// ===== Candle timer =====
export function candleSecondsLeft(lastCandleTime: number, timeframeMs: number, now = Date.now()) {
  const end = lastCandleTime + timeframeMs;
  return Math.max(0, Math.floor((end - now) / 1000));
}
export const TF_MS: Record<string, number> = { "5m": 300_000, "15m": 900_000, "1h": 3_600_000 };

// ===== Binary Options signal (AM Binary Indicator concept) =====
export type BinaryAction = "CALL" | "PUT" | "NO TRADE";
export type BinarySignal = {
  action: BinaryAction;
  confidence: number;
  expiryCandles: number;
  expirySeconds: number;
  reasons: string[];
  levels: SRLevel[];
  nearestSupport: number | null;
  nearestResistance: number | null;
  price: number;
  candleSecondsLeft: number;
  indicators: { rsi: number; macdHist: number; valueChart: number; ema9: number; ema21: number; atrPct: number };
};

export function generateBinarySignal(c: Candle[], timeframe: "5m" | "15m" | "1h"): BinarySignal | null {
  if (c.length < 60) return null;
  const closes = c.map((x) => x.close);
  const e9 = ema(closes, 9), e21 = ema(closes, 21);
  const r = rsi(closes, 14);
  const m = macd(closes);
  const a = atr(c, 14);
  const vc = valueChart(c, 5);
  const i = c.length - 1;
  const last = c[i].close;
  const levels = pivotLevels(c);
  const sup = nearestLevel(last, levels, "support");
  const res = nearestLevel(last, levels, "resistance");
  const atrPct = (a[i] / last) * 100;

  let call = 0, put = 0;
  const reasons: string[] = [];

  // 1) Value Chart extremes (mean reversion at S/R) — weight 30
  if (vc[i] <= -6) { call += 25; reasons.push(`Value Chart sobrevendido (${vc[i].toFixed(1)})`); }
  if (vc[i] >= 6) { put += 25; reasons.push(`Value Chart sobrecomprado (+${vc[i].toFixed(1)})`); }

  // 2) RSI extremes — weight 20
  if (r[i] < 30) { call += 18; reasons.push(`RSI sobrevendido (${r[i].toFixed(1)})`); }
  else if (r[i] > 70) { put += 18; reasons.push(`RSI sobrecomprado (${r[i].toFixed(1)})`); }

  // 3) Proximity to support/resistance — weight 25
  const distSup = sup ? Math.abs(last - sup.price) / last : 1;
  const distRes = res ? Math.abs(res.price - last) / last : 1;
  if (sup && distSup < 0.0025) { call += 20; reasons.push(`Preço tocando suporte ${sup.price.toFixed(5)} (×${sup.strength})`); }
  if (res && distRes < 0.0025) { put += 20; reasons.push(`Preço tocando resistência ${res.price.toFixed(5)} (×${res.strength})`); }

  // 4) Momentum confirmation (MACD hist direction) — weight 15
  const h = m.hist[i], hPrev = m.hist[i - 1];
  if (h > hPrev) call += 12; else if (h < hPrev) put += 12;

  // 5) Micro-trend filter (EMA 9 vs 21) — weight 10
  if (e9[i] > e21[i]) call += 8; else put += 8;

  // 6) Volatility filter — penalize extreme low or high ATR%
  if (atrPct < 0.05 || atrPct > 1.5) {
    call -= 10; put -= 10;
    reasons.push(`Volatilidade fora do ideal (ATR ${atrPct.toFixed(2)}%) — cautela`);
  }

  const max = Math.max(call, put);
  const action: BinaryAction = max < 45 ? "NO TRADE" : call > put ? "CALL" : "PUT";
  const confidence = Math.max(0, Math.min(100, max));

  // Expiry: 2 candles for 5m/15m, 1 candle for 1h
  const expiryCandles = timeframe === "1h" ? 1 : 2;
  const tfMs = TF_MS[timeframe];
  const csl = candleSecondsLeft(c[i].time, tfMs);
  const expirySeconds = csl + (expiryCandles - 1) * (tfMs / 1000);

  return {
    action,
    confidence,
    expiryCandles,
    expirySeconds,
    reasons,
    levels,
    nearestSupport: sup?.price ?? null,
    nearestResistance: res?.price ?? null,
    price: last,
    candleSecondsLeft: csl,
    indicators: { rsi: r[i], macdHist: h, valueChart: vc[i], ema9: e9[i], ema21: e21[i], atrPct },
  };
}

export type SignalAction = "BUY" | "SELL" | "WAIT";
export type SignalResult = {
  action: SignalAction;
  confidence: number;
  entry: number;
  sl: number;
  tp: number;
  reasons: string[];
  indicators: {
    ema9: number; ema21: number; ema50: number;
    rsi: number; macdHist: number; atr: number;
    valueChart: number;
  };
  sessions: SessionName[];
  candles: { time: number; close: number }[];
};

export function generateSignal(c: Candle[]): SignalResult | null {
  if (c.length < 60) return null;
  const closes = c.map((x) => x.close);
  const e9 = ema(closes, 9), e21 = ema(closes, 21), e50 = ema(closes, 50);
  const r = rsi(closes, 14);
  const m = macd(closes);
  const a = atr(c, 14);
  const vc = valueChart(c, 5);
  const i = c.length - 1;
  const last = c[i].close;

  let bull = 0, bear = 0;
  const reasons: string[] = [];

  // 1) Trend (EMA stack) — weight 25
  if (e9[i] > e21[i] && e21[i] > e50[i]) { bull += 25; reasons.push("Tendência de alta (EMA 9>21>50)"); }
  else if (e9[i] < e21[i] && e21[i] < e50[i]) { bear += 25; reasons.push("Tendência de baixa (EMA 9<21<50)"); }
  else if (e9[i] > e21[i]) { bull += 10; reasons.push("Cruzamento de alta de curto prazo"); }
  else if (e9[i] < e21[i]) { bear += 10; reasons.push("Cruzamento de baixa de curto prazo"); }

  // 2) RSI — weight 20
  if (r[i] < 30) { bull += 20; reasons.push(`RSI sobrevendido (${r[i].toFixed(1)})`); }
  else if (r[i] > 70) { bear += 20; reasons.push(`RSI sobrecomprado (${r[i].toFixed(1)})`); }
  else if (r[i] > 50) { bull += 8; }
  else if (r[i] < 50) { bear += 8; }

  // 3) MACD histogram — weight 20
  const h = m.hist[i], hPrev = m.hist[i - 1];
  if (h > 0 && h > hPrev) { bull += 20; reasons.push("MACD acelerando para cima"); }
  else if (h < 0 && h < hPrev) { bear += 20; reasons.push("MACD acelerando para baixo"); }
  else if (h > 0) bull += 8;
  else if (h < 0) bear += 8;

  // 4) Value Chart — weight 20
  if (vc[i] <= -8) { bull += 20; reasons.push(`Value Chart extremo (${vc[i].toFixed(1)})`); }
  else if (vc[i] >= 8) { bear += 20; reasons.push(`Value Chart extremo (+${vc[i].toFixed(1)})`); }
  else if (vc[i] <= -4) bull += 10;
  else if (vc[i] >= 4) bear += 10;

  // 5) Session liquidity — weight 15
  const sessions = activeSessions();
  const overlap = sessions.length >= 2;
  if (overlap) {
    bull += 8; bear += 8;
    reasons.push(`Sessões sobrepostas: ${sessions.join(" + ")} (alta liquidez)`);
  }

  const action: SignalAction = bull >= bear ? (bull >= 40 ? "BUY" : "WAIT") : (bear >= 40 ? "SELL" : "WAIT");
  const confidence = Math.min(100, action === "BUY" ? bull : action === "SELL" ? bear : Math.max(bull, bear));
  const atrV = a[i];
  const sl = action === "BUY" ? last - 1.5 * atrV : action === "SELL" ? last + 1.5 * atrV : last;
  const tp = action === "BUY" ? last + 2.5 * atrV : action === "SELL" ? last - 2.5 * atrV : last;

  return {
    action,
    confidence,
    entry: last,
    sl,
    tp,
    reasons,
    indicators: { ema9: e9[i], ema21: e21[i], ema50: e50[i], rsi: r[i], macdHist: h, atr: atrV, valueChart: vc[i] },
    sessions,
    candles: c.slice(-60).map((x) => ({ time: x.time, close: x.close })),
  };
}