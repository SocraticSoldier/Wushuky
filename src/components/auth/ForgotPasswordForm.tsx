"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import {
  requestPasswordReset,
  type AuthFeedback,
} from "@/app/auth/actions";

const fieldClass =
  "h-10 w-full rounded-lg border border-black/[.12] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-foreground dark:border-white/[.18]";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Sending…" : "Send reset link"}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<AuthFeedback, FormData>(
    requestPasswordReset,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={fieldClass}
        />
      </div>

      {state && "error" in state ? (
        <p
          role="alert"
          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
        >
          {state.error}
        </p>
      ) : null}

      {state && "success" in state ? (
        <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          {state.success}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
