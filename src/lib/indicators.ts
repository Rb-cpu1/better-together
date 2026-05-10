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