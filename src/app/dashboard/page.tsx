import { DashboardClient } from "@/components/dashboard-client";
import { requireSession } from "@/lib/auth/auth";
import {
  getEmailAccountDashboardStats,
  listEmailAccountDomainOptions,
  listEmailAccounts,
} from "@/lib/email-accounts/repository";

type DashboardPageProps = {
  searchParams: Promise<{
    keyword?: string;
    domain?: string;
    linked?: string;
    expired?: string;
    page?: string;
  }>;
};

function parseBooleanFilter(value?: string): boolean | null {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

function parsePage(value?: string): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await requireSession();
  const resolvedSearchParams = await searchParams;
  const [data, stats, domainOptions] = await Promise.all([
    listEmailAccounts({
      keyword: resolvedSearchParams.keyword,
      domain: resolvedSearchParams.domain,
      linked: parseBooleanFilter(resolvedSearchParams.linked),
      expired: parseBooleanFilter(resolvedSearchParams.expired),
      page: parsePage(resolvedSearchParams.page),
      pageSize: 10,
    }),
    getEmailAccountDashboardStats(),
    listEmailAccountDomainOptions(),
  ]);

  return (
    <DashboardClient
      username={session.username}
      items={data.items}
      stats={stats}
      emailDomainOptions={domainOptions}
      currentPage={data.page}
      pageSize={data.pageSize}
      totalPages={data.totalPages}
      total={data.total}
      searchParams={{
        keyword: resolvedSearchParams.keyword,
        domain: resolvedSearchParams.domain,
        linked: resolvedSearchParams.linked,
        expired: resolvedSearchParams.expired,
      }}
    />
  );
}
