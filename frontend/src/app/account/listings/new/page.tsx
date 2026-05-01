export const metadata = {
  title: "List a property",
};

export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium text-[var(--foreground)]">
        List a property
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Tell buyers about your property. You can edit or remove it anytime from your account.
      </p>
      <form className="mt-8 space-y-5" action="#" method="post">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[var(--foreground)]">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-[var(--foreground)]">
              Price
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              step={1000}
              required
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-[var(--foreground)]">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              defaultValue="USD"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="AED">AED</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-[var(--foreground)]">
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="region" className="block text-sm font-medium text-[var(--foreground)]">
              Area / region
            </label>
            <input
              id="region"
              name="region"
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="beds" className="block text-sm font-medium text-[var(--foreground)]">
              Beds
            </label>
            <input
              id="beds"
              name="beds"
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="baths" className="block text-sm font-medium text-[var(--foreground)]">
              Baths
            </label>
            <input
              id="baths"
              name="baths"
              type="number"
              min={0}
              step={0.5}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="sqft" className="block text-sm font-medium text-[var(--foreground)]">
              Sqft
            </label>
            <input
              id="sqft"
              name="sqft"
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[var(--foreground)]">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            required
            className="mt-1 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Publish listing
        </button>
      </form>
    </div>
  );
}
