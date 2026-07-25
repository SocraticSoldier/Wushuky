import Link from "next/link";
import { login } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth/AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  // In this version of Next.js, `searchParams` is a Promise.
  searchParams: Promise<{
    redirectTo?: string;
    message?: string;
    error?: string;
  }>;
}) {
  const { redirectTo, message, error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 block text-center text-lg font-semibold tracking-tight"
        >
          Wushu Kai
        </Link>
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mb-6 text-sm text-foreground/60">
          Sign in to continue your training.
        </p>

        {message ? (
          <p className="mb-4 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
            {message}
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        ) : null}

        <AuthForm mode="login" action={login} redirectTo={redirectTo} />

        <p className="mt-4 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-foreground/60 underline hover:text-foreground"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  );
}
