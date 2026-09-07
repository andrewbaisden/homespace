import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { getSession } from "@/server/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen">
      <AppHeader userName={session.user.name} />
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
