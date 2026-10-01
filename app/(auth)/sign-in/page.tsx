import type { Metadata } from "next";
import { ViewTransition } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { safeRelativePath } from "@/lib/safe-path";

export const metadata: Metadata = { title: "Sign in – Knode" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next } = await searchParams;
  return (
    <ViewTransition default="auth-fade">
      <AuthForm mode="sign-in" callbackURL={safeRelativePath(typeof next === "string" ? next : null)} />
    </ViewTransition>
  );
}
