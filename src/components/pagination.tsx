type PaginationProps = {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
};

function buildHref(page: number, searchParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  params.set("page", String(page));

  return `/dashboard?${params.toString()}`;
}

export function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
      <p className="text-sm text-[var(--muted)]">
        第 {currentPage} / {totalPages} 页
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {pages.map((page) => {
          const isActive = page === currentPage;

          return (
            <a
              key={page}
              href={buildHref(page, searchParams)}
              className={`min-w-10 rounded-xl border px-3 py-2 text-sm transition ${
                isActive
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--primary)]"
              }`}
            >
              {page}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
