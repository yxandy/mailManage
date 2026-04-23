type PaginationProps = {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  total: number;
  searchParams: Record<string, string | string[] | undefined>;
};

function buildHref(page: number, searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) {
          params.append(key, item);
        }
      });
      return;
    }

    if (value) {
      params.set(key, value);
    }
  });

  params.set("page", String(page));

  return `/dashboard?${params.toString()}`;
}

export function Pagination({
  currentPage,
  pageSize,
  totalPages,
  total,
  searchParams,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(currentPage * pageSize, total);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
      <div className="space-y-1 text-sm text-[var(--muted)]">
        <p>
          第 {currentPage} / {totalPages} 页
        </p>
        <p>
          共 {total} 条，当前显示第 {start} - {end} 条
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {pages.map((page) => {
          const isActive = page === currentPage;

          return (
            <a
              key={page}
              href={buildHref(page, searchParams)}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex min-w-10 items-center justify-center rounded-xl border px-3 py-2 text-center text-sm leading-none transition ${
                isActive
                  ? "border-[var(--primary)] bg-[var(--primary)] !text-[var(--primary-foreground)]"
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
