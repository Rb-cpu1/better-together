import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock, User as UserIcon, KeyRound, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const searchSchema = z.object({
  tab: z.enum(["login", "register"]).optional().default("login"),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  const { tab } = Route.useSearch();
  const [active, setActive] = useState<"login" | "register">(tab ?? "login");
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" }).catch(() => {});
  }, [loading, user, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-grid">
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div className="absolute inset-x-0 h-px animate-scan opacity-30" style={{ background: "linear-gradient(90deg,transparent,var(--shark-glow),transparent)" }} />

      <Link to="/" className="relative z-10 inline-flex items-center gap-2 px-6 py-5 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-4 w-4" /> voltar
      </Link>

      <div className="relative z-10 mx-auto flex max-w-md flex-col items-center px-6 pb-20">
        <div className="text-center animate-fade-up">
          <div className="text-5xl animate-shark-float">🦈</div>
          <h1 className="mt-3 font-display text-2xl font-black tracking-wider text-glow">BOT TUBARÃO</h1>
          <div className="mt-1 font-mono text-xs text-primary">V3 ULTIMATE</div>
        </div>

        <div className="mt-8 w-full glass rounded-2xl p-6 animate-fade-up">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/50 p-1">
            <button
              onClick={() => setActive("login")}
              className={`rounded-md py-2 font-display text-sm font-semibold tracking-wider transition ${
                active === "login" ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ENTRAR
            </button>
            <button
              onClick={() => setActive("register")}
              className={`rounded-md py-2 font-display text-sm font-semibold tracking-wider transition ${
                active === "register" ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              CRIAR CONTA
            </button>
          </div>

          <div className="mt-6">{active === "login" ? <LoginForm /> : <RegisterForm onCreated={() => setActive("login")} />}</div>
        </div>

        <p className="mt-4 font-mono text-xs text-muted-foreground text-center">
          🔒 Criptografado · ⚡ Tempo real · 🧠 Análise técnica
        </p>
      </div>
    </div>
  );
}

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

function LoginForm() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password: pass });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setBusy(false);
    if (error) { toast.error(error.message === "Invalid login credentials" ? "Email ou senha inválidos" : error.message); return; }
    toast.success("Bem-vindo de volta, tubarão!");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field icon={<Mail className="h-4 w-4" />} label="Email">
        <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
      </Field>
      <Field icon={<Lock className="h-4 w-4" />} label="Senha">
        <Input type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••" />
      </Field>
      <Button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-display tracking-wider">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "ACESSAR SISTEMA"}
      </Button>
    </form>
  );
}

const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha de no mínimo 6 caracteres"),
  code: z.string().min(4, "Informe o código de ativação"),
});

function RegisterForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse({ name, email, password: pass, code: code.trim().toUpperCase() });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      const { activateCode } = await import("@/lib/activation.functions");
      const validation = await activateCode({ data: { code: parsed.data.code } });
      if (!validation.valid) { toast.error(validation.error ?? "Código inválido"); return; }

      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name: parsed.data.name },
        },
      });
      if (error) { toast.error(error.message); return; }
      const userId = data.user?.id;
      if (!userId) { toast.error("Falha ao criar conta"); return; }

      const { consumeCode } = await import("@/lib/activation.functions");
      const consumed = await consumeCode({ data: { code: parsed.data.code, userId } });
      if (!consumed.ok) { toast.error(consumed.error ?? "Não foi possível ativar o código"); return; }

      toast.success(`Conta criada! Plano ${consumed.plan?.toUpperCase()} ativo por ${consumed.days} dias.`);
      onCreated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field icon={<UserIcon className="h-4 w-4" />} label="Nome">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
      </Field>
      <Field icon={<Mail className="h-4 w-4" />} label="Email">
        <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
      </Field>
      <Field icon={<Lock className="h-4 w-4" />} label="Senha">
        <Input type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="mínimo 6 caracteres" />
      </Field>
      <Field icon={<KeyRound className="h-4 w-4" />} label="Código de ativação">
        <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ex: BASICO-DEMO-001" className="font-mono" />
      </Field>
      <Button type="submit" disabled={busy} className="w-full font-display tracking-wider" style={{ background: "var(--gradient-ember)", boxShadow: "var(--shadow-ember)" }}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "ATIVAR AGORA"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Sem código?{" "}
        <Link to="/login" className="text-primary hover:underline">veja os planos</Link>
      </p>
    </form>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <div className="[&>input]:pl-9 [&>input]:bg-input/60 [&>input]:border-border/60 [&>input]:focus-visible:ring-primary">
          {children}
        </div>
      </div>
    </div>
  );
}
