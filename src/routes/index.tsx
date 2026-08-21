import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button, Card, Field, Input } from "@/components/setu/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Setu-RTN — Live capacity. Real routes." },
      {
        name: "description",
        content:
          "Setu-RTN sign in: live road-transport capacity ledger, 3PL capacity exchange, digital twin replay and predictive load forecasting.",
      },
      { property: "og:title", content: "Setu-RTN — Live capacity. Real routes." },
      {
        property: "og:description",
        content:
          "Sign in to the Setu-RTN capacity engine: one live ledger behind capacity, marketplace, twin replay, ULIP contract and forecasts.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const { user, ready, signIn, signInAsJudge } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: user.role === "3pl" ? "/marketplace" : "/capacity" });
  }, [ready, user, navigate]);

  const validateEmail = () =>
    setErrors((e) => ({
      ...e,
      email: /\S+@\S+\.\S+/.test(email) ? undefined : "Enter a valid email address.",
    }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const next: typeof errors = {};
    if (!/\S+@\S+\.\S+/.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await signIn(email, password);
      navigate({ to: "/capacity" });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Sign-in failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-light px-6 py-16">
      <div className="w-full max-w-[440px] animate-[enter_450ms_ease-out]">
        <h1 className="text-4xl">Setu-RTN</h1>
        <p className="mt-3 text-[17px] text-text-secondary">Live capacity. Real routes.</p>

        <Card hoverable={false} className="mt-8">
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
            <Field label="Email" error={errors.email} htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={validateEmail}
                placeholder="dispatcher@setu-rtn.gov.in"
              />
            </Field>
            <Field label="Password" error={errors.password} htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() =>
                  setErrors((s) => ({
                    ...s,
                    password: password.length >= 6 ? undefined : "Password must be at least 6 characters.",
                  }))
                }
              />
            </Field>
            {errors.form && (
              <p role="alert" className="text-[13px] text-danger">
                {errors.form}
              </p>
            )}
            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>

          <div className="my-8 h-px w-full bg-border-light" />

          <div>
            <p className="micro">Demo access</p>
            <Button variant="secondary" className="mt-3" onClick={() => signInAsJudge()}>
              Enter as Judge — Demo Access
            </Button>
          </div>
        </Card>

        <p className="micro mt-6">Roles: dispatcher · 3pl · directorate</p>
      </div>
    </div>
  );
}
