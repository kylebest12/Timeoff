import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";

const STAFF_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/requests", label: "My Requests" },
  { href: "/calendar", label: "Team Calendar" },
];

const ADMIN_LINKS = [
  { href: "/admin", label: "Approvals" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/settings", label: "Settings" },
];

export function Nav({ name, role }: { name: string; role: "ADMIN" | "STAFF" }) {
  const links = role === "ADMIN" ? [...STAFF_LINKS, ...ADMIN_LINKS] : STAFF_LINKS;

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-5 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/profile" className="hidden text-sm text-muted hover:text-foreground sm:inline">
            {name}
          </Link>
          <SignOutButton />
        </div>
      </div>
      <nav className="flex items-center gap-4 overflow-x-auto border-t border-border px-4 py-2 sm:hidden">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap text-sm font-medium text-muted">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
