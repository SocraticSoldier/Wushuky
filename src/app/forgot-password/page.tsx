import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
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
          Reset your password
        </h1>
        <p className="mb-6 text-sm text-foreground/60">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <ForgotPasswordForm />

        <p className="mt-6 text-center text-sm text-foreground/60">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-foreground underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
