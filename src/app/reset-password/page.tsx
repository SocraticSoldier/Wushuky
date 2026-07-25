import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage() {
  // The recovery link establishes a session via /auth/confirm before landing
  // here; without one there is nothing to reset.
  await requireUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 block text-center text-lg font-semibold tracking-tight"
        >
          Wushu Kai
        </Link>
        <h1 className="mb-1 text-2xl font-bold tracking-tight">
          Choose a new password
        </h1>
        <p className="mb-6 text-sm text-foreground/60">
          You&apos;ll be signed in once it&apos;s saved.
        </p>

        <ResetPasswordForm />
      </div>
    </div>
  );
}
