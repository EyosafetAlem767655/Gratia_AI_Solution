import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/SignInForm";
import { SimplePage } from "@/components/SimplePage";
import { googleEnabled } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in | Gratia AI Solutions",
  robots: { index: false },
};

/** Only same-site paths, so `?next=` cannot bounce someone to another domain. */
function safeNext(value: string | string[] | undefined) {
  const next = Array.isArray(value) ? value[0] : value;
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/projects";
}

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const params = await searchParams;
  return (
    <SimplePage>
      <div className="mx-auto max-w-md">
        <SignInForm
          next={safeNext(params.next)}
          initialMode={params.mode === "signup" ? "signup" : "signin"}
          google={googleEnabled()}
        />
      </div>
    </SimplePage>
  );
}
