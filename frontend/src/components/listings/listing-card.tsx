import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/lib/types/listing";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

type ListingCardProps = {
  listing: Listing;
};

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <article className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/listings/${listing.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--muted-bg)]">
          <Image
            src={listing.imageSrc}
            alt={listing.imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
        <div className="space-y-1 p-4">
          <p className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
            {formatPrice(listing.price, listing.currency)}
          </p>
          <h2 className="line-clamp-2 text-base font-medium leading-snug text-[var(--foreground)]">
            {listing.title}
          </h2>
          <p className="text-sm text-[var(--muted)]">
            {listing.city}, {listing.region}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {listing.beds} bd · {listing.baths} ba · {listing.sqft.toLocaleString()} sqft
          </p>
        </div>
      </Link>
    </article>
  );
}
