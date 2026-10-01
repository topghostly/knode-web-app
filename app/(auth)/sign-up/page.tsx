import type { Metadata } from "next";
import { ViewTransition } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Create account – Knode" };

export default function SignUpPage() {
  return (
    <ViewTransition default="auth-fade">
      <AuthForm mode="sign-up" />
    </ViewTransition>
  );
}
