import { ListingCard } from "@/components/listings/listing-card";
import { searchListings } from "@/lib/data/listings";

type SearchParams = Promise<{ q?: string }>;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const result = await searchListings({ query });
  const { listings, source } = result;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium text-[var(--foreground)]">
          Listings
        </h1>
        {query ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Showing results for <span className="text-[var(--foreground)]">“{query}”</span>
          </p>
        ) : null}
      </header>

      {source === "mock-fallback" ? (
        <div
          role="status"
          className="mb-6 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200"
        >
          Live listings are temporarily unavailable. Showing example properties while we reconnect.
        </div>
      ) : null}

      <form method="get" action="/listings" className="mb-8 flex gap-2">
        <label htmlFor="search-q" className="sr-only">
          Search listings
        </label>
        <input
          id="search-q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="City, keywords…"
          className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Search
        </button>
      </form>

      {listings.length === 0 ? (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-8 text-center text-[var(--muted)]">
          No listings match your search.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <li key={listing.id}>
              <ListingCard listing={listing} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
