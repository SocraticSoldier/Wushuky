import Link from "next/link";
import { signup } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 block text-center text-lg font-semibold tracking-tight"
        >
          Wu Shu Ky Kickboxing
        </Link>
        <h1 className="mb-1 text-2xl font-bold tracking-tight">
          Create your account
        </h1>
        <p className="mb-6 text-sm text-foreground/60">
          Start training with Wu Shu Ky Kickboxing today.
        </p>

        <AuthForm mode="signup" action={signup} />
      </div>
    </div>
  );
}
