export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-[var(--muted)] sm:px-6">
        <p>
          Demo listings use placeholder data. Connect{" "}
          <code className="rounded bg-[var(--muted-bg)] px-1 py-0.5 font-mono text-xs">
            NEXT_PUBLIC_API_URL
          </code>{" "}
          when your API is ready.
        </p>
      </div>
    </footer>
  );
}
