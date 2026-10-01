"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button variant="danger" size="md" onClick={() => authClient.signOut().then(() => router.push("/sign-in"))}>
      Sign out
    </Button>
  );
}
