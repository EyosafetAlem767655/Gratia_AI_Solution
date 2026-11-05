import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Gratia AI Solutions",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-ink text-sm text-white">{children}</div>;
}
