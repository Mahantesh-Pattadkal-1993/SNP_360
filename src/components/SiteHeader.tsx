import Link from "next/link";
import Image from "next/image";
import { DayNightToggle } from "./DayNightToggle";

const navLinks = [
  { href: "/master-plan", label: "Master Plan" },
  { href: "/wings", label: "Wings" },
  { href: "/amenities", label: "Amenities" },
  { href: "/enquire", label: "Enquire Now" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur dark-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/logo.webp" alt="Sobha Neopolis" width={160} height={48} className="h-10 w-auto" priority />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-emerald-700">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <DayNightToggle />
          <Link
            href="/enquire"
            className="hidden rounded-full bg-emerald-700 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 sm:inline-block"
          >
            Enquire Now
          </Link>
        </div>
      </div>
      <nav className="flex items-center gap-5 overflow-x-auto border-t border-black/5 px-4 py-2 text-sm font-medium md:hidden">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
