import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const codeInput = z.object({ code: z.string().min(4).max(64) });

export const activateCode = createServerFn({ method: "POST" })
  .inputValidator((d) => codeInput.parse(d))
  .handler(async ({ data }) => {
    const code = data.code.trim().toUpperCase();
    const { data: row, error } = await supabaseAdmin
      .from("activation_codes")
      .select("code, plan, duration_days, used_by")
      .eq("code", code)
      .maybeSingle();
    if (error) return { valid: false as const, error: "Erro ao validar código" };
    if (!row) return { valid: false as const, error: "Código inválido" };
    if (row.used_by) return { valid: false as const, error: "Código já utilizado" };
    return { valid: true as const, plan: row.plan, days: row.duration_days };
  });

const consumeInput = z.object({ code: z.string().min(4).max(64), userId: z.string().uuid() });

export const consumeCode = createServerFn({ method: "POST" })
  .inputValidator((d) => consumeInput.parse(d))
  .handler(async ({ data }) => {
    const code = data.code.trim().toUpperCase();
    const { data: row, error } = await supabaseAdmin
      .from("activation_codes")
      .select("code, plan, duration_days, used_by")
      .eq("code", code)
      .maybeSingle();
    if (error || !row) return { ok: false as const, error: "Código inválido" };
    if (row.used_by) return { ok: false as const, error: "Código já utilizado" };

    const expires = new Date(Date.now() + row.duration_days * 24 * 60 * 60 * 1000).toISOString();

    const { error: subErr } = await supabaseAdmin.from("subscriptions").insert({
      user_id: data.userId,
      plan: row.plan,
      expires_at: expires,
      source: "activation_code",
    });
    if (subErr) return { ok: false as const, error: "Falha ao ativar plano" };

    await supabaseAdmin
      .from("activation_codes")
      .update({ used_by: data.userId, used_at: new Date().toISOString() })
      .eq("code", code);

    return { ok: true as const, plan: row.plan, days: row.duration_days };
  });
