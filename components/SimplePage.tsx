"use client";

import { BootProvider } from "@/components/ui/Boot";
import { Footer } from "@/components/sections/Footer";
import { Nav } from "@/components/ui/Nav";

/**
 * Site chrome for utility pages (sign-in, project status): header and footer,
 * no video and no fluid cursor. These pages are for getting something done.
 */
export function SimplePage({ children }: { children: React.ReactNode }) {
  return (
    <BootProvider expects={["fonts"]}>
      <Nav />
      <main id="main" className="relative z-10 min-h-[70vh] px-5 pb-16 pt-28 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>
      <Footer />
    </BootProvider>
  );
}
