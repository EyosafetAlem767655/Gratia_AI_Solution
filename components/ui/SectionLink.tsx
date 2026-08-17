"use client";

/**
 * A link to a section of the home page.
 *
 * Renders a real `<Link>` to a real path, so it is a proper anchor: middle
 * click, cmd-click, "copy link address" and crawlers all behave. When the click
 * is an ordinary one *and we are already on the home document*, we handle it
 * ourselves — smooth scroll, then rewrite the path — because a router
 * navigation would remount the page and replay the boot screen to move a few
 * hundred pixels.
 *
 * From anywhere else (`/contact`) the click falls through to Next, which loads
 * the route; that page then scrolls itself to the right section on boot.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isHomePath, releaseScrollLock, scrollToPath, type SectionPath } from "@/lib/scroll";

export function SectionLink({
  href,
  children,
  className,
  onNavigate,
}: {
  href: SectionPath;
  children: ReactNode;
  className?: string;
  /** Fired after an in-page scroll — used by the mobile drawer to close. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      // The three section routes render the same component as `/`. Prefetching
      // them would pull three near-identical payloads for navigations that, in
      // the common case, never happen.
      prefetch={false}
      className={className}
      onClick={(event) => {
        if (!isHomePath(pathname)) return;

        // Leave modified clicks alone: they mean "open elsewhere", and
        // hijacking them into a scroll is the classic single-page-app rudeness.
        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }

        event.preventDefault();
        // pushState rather than router.push: no remount, no boot screen, and
        // the App Router still picks it up so `usePathname` stays correct.
        window.history.pushState(null, "", href);
        onNavigate?.();
        // Must come after onNavigate and before the scroll — see the comment on
        // releaseScrollLock. Closing the drawer is a state update, so its
        // `overflow: hidden` is still applied at this point and would clamp the
        // scroll to nothing.
        releaseScrollLock();
        scrollToPath(href);
      }}
    >
      {children}
    </Link>
  );
}
