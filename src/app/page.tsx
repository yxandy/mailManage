import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth/auth";

export default async function HomePage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  redirect("/login");
}
