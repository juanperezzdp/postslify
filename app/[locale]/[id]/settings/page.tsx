import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export default async function SettingsPage({
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
    redirect(`/${session.user.id}/settings`);
  }

  await dbConnect();
  const dbUser = await User.findById(session.user.id)
    .select("name email image")
    .lean();

  const user = {
    id: session.user.id,
    name: dbUser?.name ?? session.user.name ?? null,
    email: dbUser?.email ?? session.user.email ?? null,
    image: dbUser?.image ?? session.user.image ?? null,
  };

  return <SettingsClient user={user} />;
}
