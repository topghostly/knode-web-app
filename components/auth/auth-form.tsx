"use client";

import Link from "next/link";
import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { authClient } from "@/lib/auth-client";
import { requestSignIn, signUp } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { GoogleMark } from "./google-mark";

type Mode = "sign-in" | "sign-up";
type Status = "idle" | "sending" | "sent";
type FieldError = { field: "name" | "email"; message: string };

const copy = {
  "sign-in": {
    title: "Welcome back",
    body: "Sign in to start today's session.",
    submit: "Send sign-in code",
    footer: { text: "New to Knode?", link: "Create an account", href: "/sign-up" },
  },
  "sign-up": {
    title: "Keep your edge",
    body: "A ten-minute daily workout for engineers who ship with AI.",
    submit: "Send sign-up code",
    footer: { text: "Already have an account?", link: "Sign in", href: "/sign-in" },
  },
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
};

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-ink/15 bg-surface px-3.5 text-[15px] outline-none transition-colors placeholder:text-ink/40 focus:border-brand focus:ring-2 focus:ring-brand/25 aria-invalid:border-accent aria-invalid:focus:ring-accent/25";

function ErrorText({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="col-span-2 mt-2 text-sm text-accent">
      {message}
    </p>
  );
}

export function AuthForm({ mode, callbackURL = "/" }: { mode: Mode; callbackURL?: string }) {
  const t = copy[mode];
  const id = useId();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<FieldError | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [googleBusy, setGoogleBusy] = useState(false);

  const errorId = `${id}-error`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "sign-up" && (!firstName.trim() || !lastName.trim())) {
      setError({ field: "name", message: "Enter your first and last name." });
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError({ field: "email", message: "Enter a valid email address." });
      return;
    }
    setError(null);
    setStatus("sending");
    try {
      const result =
        mode === "sign-up"
          ? await signUp({ firstName, lastName, email })
          : await requestSignIn({ email });
      if (result.ok) {
        setStatus("sent");
      } else {
        setError({ field: result.field, message: result.message });
        setStatus("idle");
      }
    } catch {
      setError({ field: "email", message: "Something went wrong. Try again." });
      setStatus("idle");
    }
  }

  function signInWithGoogle() {
    setGoogleBusy(true);
    authClient.signIn.social({ provider: "google", callbackURL }).catch(() => {
      setGoogleBusy(false);
      setError({ field: "email", message: "Google sign-in didn't start. Try again." });
    });
  }

  function reset() {
    setStatus("idle");
    setError(null);
  }

  function onChange(setter: (value: string) => void) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (error) setError(null);
    };
  }

  const invalid = (field: FieldError["field"]) => (error?.field === field ? true : undefined);

  return (
    <div>
      {/* logo slot */}
      <div aria-hidden="true" className="mb-8 h-7" />

      <AnimatePresence mode="wait" initial={false}>
        {status === "sent" ? (
          <motion.section key="sent" {...fade} aria-live="polite">
            <h1 className="font-display text-3xl font-medium leading-[1.08] tracking-tight sm:text-4xl">
              Check your inbox
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
              We sent a code to{" "}
              <span className="font-medium text-ink">{email.trim()}</span>. Enter it here to
              continue. It expires in 10 minutes.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-8 h-11 w-full rounded-lg border border-ink/15 bg-surface text-[15px] font-medium transition-colors hover:border-ink/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Use a different email
            </button>
          </motion.section>
        ) : (
          <motion.section key="form" {...fade}>
            <h1 className="font-display text-3xl font-medium leading-[1.08] tracking-tight sm:text-4xl">
              {t.title}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/70">{t.body}</p>

            <motion.button
              type="button"
              onClick={signInWithGoogle}
              disabled={googleBusy}
              whileTap={{ scale: 0.985 }}
              className="mt-8 flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-ink/15 bg-surface text-[15px] font-medium transition-colors hover:border-ink/30 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <GoogleMark className="size-[18px]" />
              Continue with Google
            </motion.button>

            <div className="my-5 flex items-center gap-4 text-sm text-ink/50">
              <span className="h-px flex-1 bg-ink/15" />
              or
              <span className="h-px flex-1 bg-ink/15" />
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {mode === "sign-up" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`${id}-first`} className="block text-sm font-medium">
                      First name
                    </label>
                    <input
                      id={`${id}-first`}
                      name="firstName"
                      autoComplete="given-name"
                      placeholder="Ada"
                      value={firstName}
                      onChange={onChange(setFirstName)}
                      aria-invalid={invalid("name")}
                      aria-describedby={error?.field === "name" ? errorId : undefined}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor={`${id}-last`} className="block text-sm font-medium">
                      Last name
                    </label>
                    <input
                      id={`${id}-last`}
                      name="lastName"
                      autoComplete="family-name"
                      placeholder="Lovelace"
                      value={lastName}
                      onChange={onChange(setLastName)}
                      aria-invalid={invalid("name")}
                      aria-describedby={error?.field === "name" ? errorId : undefined}
                      className={inputClass}
                    />
                  </div>
                  {error?.field === "name" && <ErrorText id={errorId} message={error.message} />}
                </div>
              )}

              <div>
                <label htmlFor={`${id}-email`} className="block text-sm font-medium">
                  Email
                </label>
                <input
                  id={`${id}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={onChange(setEmail)}
                  aria-invalid={invalid("email")}
                  aria-describedby={error?.field === "email" ? errorId : undefined}
                  className={inputClass}
                />
                {error?.field === "email" && <ErrorText id={errorId} message={error.message} />}
              </div>

              <Button type="submit" size="md" width="full" disabled={status === "sending"}>
                {status === "sending" ? "Sending…" : t.submit}
              </Button>
            </form>

            {mode === "sign-up" && (
              <p className="mt-6 text-xs leading-relaxed text-ink/55">
                By continuing you agree to Knode&apos;s{" "}
                <a href="#" className="underline underline-offset-4 hover:text-ink">
                  Terms
                </a>{" "}
                and{" "}
                <a href="#" className="underline underline-offset-4 hover:text-ink">
                  Privacy Policy
                </a>
                .
              </p>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <p className="mt-8 text-sm text-ink/70">
        {t.footer.text}{" "}
        <Link
          href={t.footer.href}
          className="font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {t.footer.link}
        </Link>
      </p>
    </div>
  );
}
