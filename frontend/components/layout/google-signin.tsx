"use client";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function GoogleSignInButton() {
  return (
    <Button size="lg" className="w-full gap-2 sm:w-auto" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
      Continue with Google
    </Button>
  );
}
