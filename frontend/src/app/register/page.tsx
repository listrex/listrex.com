import Link from "next/link";

export const metadata = {
  title: "Sign up",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium text-[var(--foreground)]">
        Create account
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Wire this form to your registration endpoint on the custom backend when it is ready.
      </p>
      <form className="mt-8 space-y-4" action="#" method="post">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)]">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)]">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Sign up
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
