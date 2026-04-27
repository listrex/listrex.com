"use client";

import { useState, type FormEvent } from "react";

type ContactFormProps = {
  listingTitle: string;
};

export function ContactForm({ listingTitle }: ContactFormProps) {
  const [status, setStatus] = useState<"idle" | "sent">("idle");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sent");
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">Contact</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        About: <span className="text-[var(--foreground)]">{listingTitle}</span>
      </p>
      {status === "sent" ? (
        <p className="mt-4 rounded-lg bg-[var(--muted-bg)] px-3 py-2 text-sm text-[var(--foreground)]">
          Thanks — when the API is connected, this message will be sent to the listing owner.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="contact-name" className="sr-only">
              Name
            </label>
            <input
              id="contact-name"
              name="name"
              required
              placeholder="Your name"
              autoComplete="name"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="sr-only">
              Email
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              placeholder="Email"
              autoComplete="email"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
            />
          </div>
          <div>
            <label htmlFor="contact-phone" className="sr-only">
              Phone (optional)
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              placeholder="Phone (optional)"
              autoComplete="tel"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
            />
          </div>
          <div>
            <label htmlFor="contact-message" className="sr-only">
              Message
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={4}
              placeholder="Message"
              className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Send message
          </button>
        </form>
      )}
    </div>
  );
}
