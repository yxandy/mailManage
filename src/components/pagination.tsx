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

function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

export function Pagination({
  currentPage,
  pageSize,
  totalPages,
  total,
  searchParams,
}: PaginationProps) {
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(currentPage * pageSize, total);
  const sanitizedCurrentPage = clampPage(currentPage, totalPages);
  const firstPage = 1;
  const lastPage = Math.max(totalPages, 1);
  const prevPage = clampPage(sanitizedCurrentPage - 1, totalPages);
  const nextPage = clampPage(sanitizedCurrentPage + 1, totalPages);
  const canGoPrev = sanitizedCurrentPage > firstPage;
  const canGoNext = sanitizedCurrentPage < lastPage;

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
        <a
          href={buildHref(firstPage, searchParams)}
          aria-disabled={!canGoPrev}
          className={`rounded-xl border px-3 py-2 text-sm transition ${
            canGoPrev
              ? "border-[var(--border)] bg-white hover:border-[var(--primary)]"
              : "pointer-events-none border-[var(--border)] bg-stone-100 text-[var(--muted)]"
          }`}
        >
          首页
        </a>
        <a
          href={buildHref(prevPage, searchParams)}
          aria-disabled={!canGoPrev}
          className={`rounded-xl border px-3 py-2 text-sm transition ${
            canGoPrev
              ? "border-[var(--border)] bg-white hover:border-[var(--primary)]"
              : "pointer-events-none border-[var(--border)] bg-stone-100 text-[var(--muted)]"
          }`}
        >
          上一页
        </a>
        <a
          href={buildHref(nextPage, searchParams)}
          aria-disabled={!canGoNext}
          className={`rounded-xl border px-3 py-2 text-sm transition ${
            canGoNext
              ? "border-[var(--border)] bg-white hover:border-[var(--primary)]"
              : "pointer-events-none border-[var(--border)] bg-stone-100 text-[var(--muted)]"
          }`}
        >
          下一页
        </a>
        <a
          href={buildHref(lastPage, searchParams)}
          aria-disabled={!canGoNext}
          className={`rounded-xl border px-3 py-2 text-sm transition ${
            canGoNext
              ? "border-[var(--border)] bg-white hover:border-[var(--primary)]"
              : "pointer-events-none border-[var(--border)] bg-stone-100 text-[var(--muted)]"
          }`}
        >
          尾页
        </a>
      </div>
      <form action="/dashboard" method="get" className="flex items-center gap-2 text-sm">
        {Object.entries(searchParams).map(([key, value]) =>
          Array.isArray(value)
            ? value
                .filter(Boolean)
                .map((item, index) => (
                  <input key={`${key}-${item}-${index}`} type="hidden" name={key} value={item} />
                ))
            : value
              ? <input key={key} type="hidden" name={key} value={value} />
              : null,
        )}
        <label className="text-[var(--muted)]" htmlFor="page-jump-input">
          跳转到
        </label>
        <input
          id="page-jump-input"
          name="page"
          type="number"
          min={1}
          max={Math.max(totalPages, 1)}
          defaultValue={sanitizedCurrentPage}
          className="w-24 rounded-xl border border-[var(--border)] bg-white px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 transition hover:border-[var(--primary)]"
        >
          回车跳转
        </button>
      </form>
    </nav>
  );
}
