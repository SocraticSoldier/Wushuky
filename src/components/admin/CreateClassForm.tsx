"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import {
  createClassAction,
  type AdminClassState,
} from "@/app/admin/classes/actions";
import { CLASS_LEVELS } from "@/lib/validation/class";

const fieldClass =
  "h-10 w-full rounded-lg border border-black/[.12] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-foreground dark:border-white/[.18]";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Scheduling…" : "Schedule class"}
    </Button>
  );
}

export function CreateClassForm() {
  const [state, formAction] = useActionState<AdminClassState, FormData>(
    createClassAction,
    null,
  );

  return (
    <form
      action={formAction}
      className="rounded-xl border border-black/[.08] p-5 dark:border-white/[.1]"
    >
      <h2 className="text-lg font-semibold tracking-tight">Schedule a class</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={120}
            placeholder="Foundations of Wushu"
            className={`mt-1.5 ${fieldClass}`}
          />
        </div>

        <div>
          <label htmlFor="instructor" className="text-sm font-medium">
            Instructor
          </label>
          <input
            id="instructor"
            name="instructor"
            placeholder="Sifu Chen"
            className={`mt-1.5 ${fieldClass}`}
          />
        </div>

        <div>
          <label htmlFor="level" className="text-sm font-medium">
            Level
          </label>
          <select
            id="level"
            name="level"
            defaultValue="all"
            className={`mt-1.5 ${fieldClass}`}
          >
            {CLASS_LEVELS.map((level) => (
              <option key={level} value={level} className="capitalize">
                {level}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="startsAt" className="text-sm font-medium">
            Starts at
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            className={`mt-1.5 ${fieldClass}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="durationMinutes" className="text-sm font-medium">
              Minutes
            </label>
            <input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min={1}
              max={600}
              defaultValue={60}
              className={`mt-1.5 ${fieldClass}`}
            />
          </div>
          <div>
            <label htmlFor="capacity" className="text-sm font-medium">
              Capacity
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              max={1000}
              defaultValue={20}
              className={`mt-1.5 ${fieldClass}`}
            />
          </div>
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
