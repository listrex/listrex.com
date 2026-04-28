import { ListingCard } from "@/components/listings/listing-card";
import { filterListings } from "@/lib/data/mock-listings";

type SearchParams = Promise<{ q?: string }>;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const listings = filterListings(query);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium text-[var(--foreground)]">
          Listings
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Demo results from mock data. Replace with API calls using{" "}
          <code className="rounded bg-[var(--muted-bg)] px-1 py-0.5 font-mono text-xs">
            NEXT_PUBLIC_API_URL
          </code>
          .
        </p>
      </header>

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
