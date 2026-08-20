/**
 * In-page navigation.
 *
 * The home page is one document with several sections, but the address bar
 * shows a real path — `/about`, not `/#about`. Those paths exist as routes, so
 * a refresh or a shared link works; when you are already on the home document
 * we scroll instead of navigating, and rewrite the path with `history.pushState`
 * (officially supported by the App Router, and it syncs `usePathname`).
 *
 * Everything here is deliberately in one file: the route table, the "am I on
 * the home document" test and the scroll maths all have to agree, and they
 * drift apart the moment they live in three components.
 */

/** Path -> section id. The single source of truth for both. */
export const SECTION_ROUTES = {
  "/about": "about",
  "/services": "services",
  "/industries": "industries",
  "/testimonials": "testimonials",
} as const;

export type SectionPath = keyof typeof SECTION_ROUTES;
export type SectionId = (typeof SECTION_ROUTES)[SectionPath];

/** Every path served by the home document, including the bare root. */
export const HOME_PATHS: readonly string[] = ["/", ...Object.keys(SECTION_ROUTES)];

export function isHomePath(pathname: string): boolean {
  return HOME_PATHS.includes(pathname);
}

export function sectionForPath(pathname: string): SectionId | null {
  return SECTION_ROUTES[pathname as SectionPath] ?? null;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Release a body scroll lock so a programmatic scroll can actually move.
 *
 * `overflow: hidden` on `body` propagates to the viewport, which clamps
 * `window.scrollTo` entirely. Two things here take that lock: the mobile drawer
 * and the boot veil. Both lift it in an effect cleanup, which has not run yet
 * at the moment a click handler fires — so a link that closes the drawer and
 * scrolls in the same tick would silently do nothing.
 *
 * Safe to call spuriously: the owning cleanup restores the same empty value.
 */
export function releaseScrollLock(): void {
  document.body.style.overflow = "";
}

/**
 * Height of the fixed header, measured rather than hard-coded — it changes
 * with the breakpoint, and a stale constant is how anchor targets end up
 * tucked underneath the nav.
 */
function headerOffset(): number {
  const header = document.querySelector("header");
  return header ? header.getBoundingClientRect().height : 0;
}

/**
 * Scroll a section into view below the header.
 *
 * `behavior` defaults to smooth, but a reduced-motion visitor always gets an
 * instant jump — animating a whole page of scrolling is exactly the kind of
 * vestibular trigger that setting exists for.
 */
export function scrollToSection(id: string, behavior: ScrollBehavior = "smooth"): void {
  const target = document.getElementById(id);
  if (!target) return;

  const top = target.getBoundingClientRect().top + window.scrollY - headerOffset();
  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReducedMotion() ? "auto" : behavior,
  });
}

/** Scroll to whichever section `pathname` names, or the top for `/`. */
export function scrollToPath(pathname: string, behavior: ScrollBehavior = "smooth"): void {
  const id = sectionForPath(pathname);
  if (id) {
    scrollToSection(id, behavior);
    return;
  }
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? "auto" : behavior,
  });
}
