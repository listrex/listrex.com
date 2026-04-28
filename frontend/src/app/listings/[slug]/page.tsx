import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/listings/contact-form";
import { getListingBySlug } from "@/lib/data/mock-listings";

type Params = Promise<{ slug: string }>;

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  if (!listing) return { title: "Not found" };
  return {
    title: listing.title,
    description: listing.description.slice(0, 160),
  };
}

export default async function ListingDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  if (!listing) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-[var(--muted)]">
        <Link href="/listings" className="hover:text-[var(--foreground)]">
          ← All listings
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
        <div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--muted-bg)]">
            <Image
              src={listing.imageSrc}
              alt={listing.imageAlt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
            />
          </div>
          <div className="mt-6">
            <p className="text-2xl font-semibold text-[var(--foreground)]">
              {formatPrice(listing.price, listing.currency)}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight text-[var(--foreground)]">
              {listing.title}
            </h1>
            <p className="mt-2 text-[var(--muted)]">
              {listing.city}, {listing.region}
            </p>
            <dl className="mt-6 flex flex-wrap gap-6 text-sm">
              <div>
                <dt className="text-[var(--muted)]">Bedrooms</dt>
                <dd className="font-medium text-[var(--foreground)]">{listing.beds}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Bathrooms</dt>
                <dd className="font-medium text-[var(--foreground)]">{listing.baths}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Size</dt>
                <dd className="font-medium text-[var(--foreground)]">
                  {listing.sqft.toLocaleString()} sqft
                </dd>
              </div>
            </dl>
            <p className="mt-6 max-w-3xl leading-relaxed text-[var(--muted)]">{listing.description}</p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6">
          <ContactForm listingTitle={listing.title} />
        </aside>
      </div>
    </div>
  );
}
