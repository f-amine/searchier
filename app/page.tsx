"use client";

import { useEffect, useRef } from "react";

import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    const restartSession = async () => {
      try {
        await authClient.signOut();
      } catch (error) {
        console.error("Failed to sign out from Lightfunnels session", error);
      } finally {
        await authClient.signIn.oauth2({
          providerId: "lightfunnels",
          callbackURL: "/app",
        });
      }
    };

    restartSession();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <Spinner className="size-8" />
        <p className="text-sm text-muted-foreground">Loading</p>
      </div>
    </div>
  );
}
