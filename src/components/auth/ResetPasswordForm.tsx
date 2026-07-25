"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { updatePassword, type AuthState } from "@/app/auth/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation/auth";

const fieldClass =
  "h-10 w-full rounded-lg border border-black/[.12] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-foreground dark:border-white/[.18]";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Saving…" : "Save password"}
    </Button>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(
    updatePassword,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          className={fieldClass}
        />
      </div>

      {state?.error ? (
        <p
          role="alert"
          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
