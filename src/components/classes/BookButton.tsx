"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import {
  bookClassAction,
  cancelBookingAction,
} from "@/app/(dashboard)/classes/actions";

interface BookButtonProps {
  classId: string;
  isBooked: boolean;
  isFull: boolean;
}

export function BookButton({ classId, isBooked, isFull }: BookButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = isBooked
        ? await cancelBookingAction(classId)
        : await bookClassAction(classId);
      if (!result.ok) setError(result.error);
    });
  };

  const disabled = pending || (!isBooked && isFull);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant={isBooked ? "outline" : "primary"}
        onClick={handleClick}
        disabled={disabled}
        aria-live="polite"
      >
        {pending
          ? "…"
          : isBooked
            ? "Cancel"
            : isFull
              ? "Full"
              : "Book"}
      </Button>
      {error ? (
        <span role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      ) : null}
    </div>
  );
}
