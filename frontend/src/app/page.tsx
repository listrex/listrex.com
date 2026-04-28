import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section className="border-b border-[var(--border)] bg-gradient-to-b from-[var(--accent-muted)]/30 to-[var(--background)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="font-[family-name:var(--font-display)] text-4xl font-medium leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
            Find your next home
          </p>
          <p className="mt-4 max-w-xl text-lg text-[var(--muted)]">
            Search listings, compare details, and reach sellers. This app is wired for a custom API
            layer in front of Osclass.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/listings"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Browse listings
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted-bg)]"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--foreground)]">
          What you can build here
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Search & filters",
              body: "Result cards and query params ready to map to your search API.",
            },
            {
              title: "Listing detail + lead form",
              body: "Gallery, facts, and contact UI—swap in POST to your backend when live.",
            },
            {
              title: "Publish flow",
              body: "Starter form for sellers; authenticate and validate on the API side.",
            },
          ].map((item) => (
            <li
              key={item.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
            >
              <p className="font-medium text-[var(--foreground)]">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
