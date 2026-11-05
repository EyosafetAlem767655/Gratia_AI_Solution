import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { Logo } from "@/components/ui/Logo";

/** No sidebar: with a list and its detail there would be one item in it. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="h-16 flex-none border-b border-[#1a1a1a]">
        <div className="mx-auto flex h-full w-full max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-7">
          <Link href="/admin" aria-label="All requests" className="transition-opacity hover:opacity-80">
            <Logo />
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="h-9 px-2 text-[#b4b4b4] transition-colors hover:text-white"
            >
              Log out
            </button>
          </form>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-7 sm:py-8">
        {children}
      </main>
    </>
  );
}

export type PillTone = "waiting" | "good" | "bad" | "neutral";

const TONES: Record<PillTone, string> = {
  waiting: "bg-[#2a2110] text-[#f2b33d]",
  good: "bg-[#172a1d] text-[#3fc07a]",
  bad: "bg-[#2c1a20] text-[#e5566f]",
  neutral: "bg-[#2a2a2a] text-[#b4b4b4]",
};

export function Pill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex h-6 flex-none items-center whitespace-nowrap rounded px-2 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg bg-[#111] p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
