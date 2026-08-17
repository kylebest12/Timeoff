import { auth } from "@/auth";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) return null;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold">Your profile</h1>
      <p className="text-sm text-muted">{session.user.name} — {session.user.email}</p>
      <ChangePasswordForm />
    </div>
  );
}
