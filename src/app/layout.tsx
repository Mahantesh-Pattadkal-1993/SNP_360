import type { Metadata } from "next";
import "./globals.css";
import { DayNightProvider } from "@/components/DayNightProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Sobha Neopolis 360 | Panathur, Bengaluru",
  description:
    "Explore Sobha Neopolis — a gated society in Panathur, East Bengaluru — through an interactive master plan, day & night building views, and amenity galleries.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <DayNightProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </DayNightProvider>
      </body>
    </html>
  );
}
