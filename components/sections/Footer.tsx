/**
 * Site footer.
 *
 * The launch badge is required by the domain provider for verification, so its
 * markup is reproduced exactly as they supplied it — the href, the src and the
 * declared 255x55 are what their checker looks for. Do not "tidy" it into
 * next/image or a local copy: it has to be their URL, served from their host.
 *
 * It renders as a white rounded card, because that is what their SVG is (a
 * #ffffff plate with #1f2937 text). On this near-black footer that reads as a
 * deliberate chip, which is how these badges are meant to look, so it is left
 * uncoloured rather than blended into the page.
 */
export function Footer() {
  return (
    <footer className="relative z-10 bg-ink px-5 py-6 text-xs text-white/70 sm:px-8 lg:px-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span>Gratia AI Solutions</span>

        <a
          href="https://websitelaunches.com/site/gratiaaisolutions.com"
          target="_blank"
          rel="noopener"
          className="inline-flex transition-opacity hover:opacity-85"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://websitelaunches.com/badge/gratiaaisolutions.com.svg"
            alt="Established online - Public launch record"
            width={255}
            height={55}
            loading="lazy"
            decoding="async"
          />
        </a>

        <span>&copy; {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
