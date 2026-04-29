"use client";

import { useState, type FormEvent } from "react";

type ContactFormProps = {
  listingTitle: string;
  listingSlug: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

export function ContactForm({ listingTitle, listingSlug }: ContactFormProps) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "submitting") return;
    setStatus({ kind: "submitting" });

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      message: String(formData.get("message") ?? "").trim(),
    };

    try {
      const res = await fetch(
        `/api/listings/${encodeURIComponent(listingSlug)}/contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      form.reset();
      setStatus({ kind: "sent" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send message";
      setStatus({ kind: "error", message });
    }
  }

  const submitting = status.kind === "submitting";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">Contact</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        About: <span className="text-[var(--foreground)]">{listingTitle}</span>
      </p>
      {status.kind === "sent" ? (
        <p className="mt-4 rounded-lg bg-[var(--muted-bg)] px-3 py-2 text-sm text-[var(--foreground)]">
          Thanks — your message has been sent to the listing owner.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
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
          {status.kind === "error" ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {status.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send message"}
          </button>
        </form>
      )}
    </div>
  );
}
