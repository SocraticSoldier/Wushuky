"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { deleteClassAction } from "@/app/admin/classes/actions";

/**
 * Two-step delete: the first click arms the button, the second confirms.
 * Deleting a class cascades to its bookings, so it should not be one click.
 */
export function DeleteClassButton({
  classId,
  title,
}: {
  classId: string;
  title: string;
}) {
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteClassAction(classId);
      if (!result.ok) {
        setError(result.error);
        setArmed(false);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {armed && !pending ? (
          <button
            type="button"
            onClick={() => setArmed(false)}
            className="text-xs text-foreground/60 underline"
          >
            Cancel
          </button>
        ) : null}
        <Button
          size="sm"
          variant={armed ? "primary" : "ghost"}
          onClick={handleClick}
          disabled={pending}
          aria-label={
            armed ? `Confirm deleting ${title}` : `Delete ${title}`
          }
        >
          {pending ? "Deleting…" : armed ? "Confirm" : "Delete"}
        </Button>
      </div>
      {error ? (
        <span role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      ) : null}
    </div>
  );
}
