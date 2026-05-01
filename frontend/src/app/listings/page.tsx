import { ListingCard } from "@/components/listings/listing-card";
import { searchListings } from "@/lib/data/listings";
import { listRegions } from "@/lib/data/locations";

type SearchParams = Promise<{ q?: string; region?: string }>;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const region = typeof params.region === "string" ? params.region : "";

  const [searchResult, regionsResult] = await Promise.all([
    searchListings({ query, region: region || undefined }),
    listRegions(),
  ]);
  const { listings, source } = searchResult;
  const activeRegions = regionsResult.items.filter((r) => {
    const active = r.b_active;
    return active === undefined || active === 1 || active === "1" || active === true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium text-[var(--foreground)]">
          Listings
        </h1>
        {query || region ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            {query ? (
              <>
                Showing results for{" "}
                <span className="text-[var(--foreground)]">“{query}”</span>
              </>
            ) : null}
            {query && region ? " · " : null}
            {region ? (
              <>
                in <span className="text-[var(--foreground)]">{region}</span>
              </>
            ) : null}
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

      <form
        method="get"
        action="/listings"
        className="mb-8 grid gap-2 sm:grid-cols-[1fr_220px_auto]"
      >
        <label htmlFor="search-q" className="sr-only">
          Search listings
        </label>
        <input
          id="search-q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Keywords…"
          className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
        />
        <label htmlFor="search-region" className="sr-only">
          Region
        </label>
        <select
          id="search-region"
          name="region"
          defaultValue={region}
          disabled={activeRegions.length === 0}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] disabled:opacity-60"
        >
          <option value="">All regions</option>
          {activeRegions.map((r) => (
            <option key={String(r.pk_i_id)} value={r.s_name ?? ""}>
              {r.s_name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Search
        </button>
      </form>

      {listings.length === 0 ? (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-8 text-center text-[var(--muted)]">
          {query || region
            ? "No listings match your search."
            : "No listings yet — check back soon."}
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
