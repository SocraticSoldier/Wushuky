"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import {
  updateProfileAction,
  type ProfileState,
} from "@/app/(dashboard)/profile/actions";
import {
  MAX_BELT_LENGTH,
  MAX_NAME_LENGTH,
} from "@/lib/validation/profile";

const fieldClass =
  "h-10 w-full rounded-lg border border-black/[.12] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-foreground dark:border-white/[.18]";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

export function ProfileForm({
  initialFullName,
  initialBelt,
}: {
  initialFullName: string;
  initialBelt: string;
}) {
  const [state, formAction] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    null,
  );

  return (
    <form
      action={formAction}
      className="rounded-xl border border-black/[.08] p-5 dark:border-white/[.1]"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-sm font-medium">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            defaultValue={initialFullName}
            maxLength={MAX_NAME_LENGTH}
            placeholder="Your name"
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="belt" className="text-sm font-medium">
            Belt / grade
          </label>
          <input
            id="belt"
            name="belt"
            defaultValue={initialBelt}
            maxLength={MAX_BELT_LENGTH}
            placeholder="e.g. Blue"
            className={fieldClass}
          />
        </div>
      </div>

      {state && "error" in state ? (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
        >
          {state.error}
        </p>
      ) : null}

      {state && "success" in state ? (
        <p className="mt-4 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          {state.success}
        </p>
      ) : null}

      <div className="mt-5">
        <SubmitButton />
      </div>
    </form>
  );
}
