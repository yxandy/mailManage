type PaginationProps = {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  total: number;
  searchParams: Record<string, string | string[] | undefined>;
};

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
