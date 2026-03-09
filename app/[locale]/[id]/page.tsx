import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function UserHomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.id !== id) {
    redirect(`/${session.user.id}`);
  }

  return <div className="min-h-screen" />;
}
