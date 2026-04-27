import Link from "next/link";

const nav = [
  { href: "/listings", label: "Search" },
  { href: "/account/listings/new", label: "List property" },
  { href: "/login", label: "Log in" },
  { href: "/register", label: "Sign up" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight text-[var(--foreground)]">
          Listrex
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] sm:px-3"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
