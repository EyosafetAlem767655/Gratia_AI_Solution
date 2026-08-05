import Image from "next/image";

const LINKS = [
  { href: "#capabilities", label: "Capabilities" },
  { href: "#method", label: "Method" },
  { href: "#work", label: "Work" },
  { href: "#contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-[#141a25] px-[var(--gutter)] pb-10 pt-16">
      <div className="absolute inset-0 bg-[#04060a]/70 backdrop-blur-md" aria-hidden />

      <div className="relative z-10 mx-auto max-w-[80rem]">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <Image
                src="/emblem.png"
                alt=""
                width={40}
                height={40}
                className="h-9 w-9 object-contain"
              />
              <span className="font-display text-base font-semibold text-chrome">
                GRATIA<span className="text-molten">.</span>AI
              </span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-chrome-dim">
              Production AI for industrial, financial, manufacturing, real
              estate and e-commerce companies.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-10 gap-y-3">
            <ul className="space-y-2.5">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    data-cursor="link"
                    className="text-sm text-chrome-dim transition-colors duration-300 hover:text-chrome"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="mailto:eyosafetalem@gmail.com"
                  data-cursor="link"
                  className="text-sm text-chrome-dim transition-colors duration-300 hover:text-chrome"
                >
                  eyosafetalem@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+251938767655"
                  data-cursor="link"
                  className="text-sm text-chrome-dim transition-colors duration-300 hover:text-chrome"
                >
                  +251 938 767 655
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Oversized outline wordmark — the sign-off stamped into the plate. */}
        <div
          aria-hidden
          className="mt-16 select-none overflow-hidden"
        >
          <span className="text-outline block whitespace-nowrap text-center font-display text-[clamp(3.5rem,15vw,13rem)] font-bold leading-none tracking-tight">
            GRATIA AI
          </span>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[#141a25] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[0.7rem] tracking-[0.1em] text-[#3d4959]">
            © {new Date().getFullYear()} Gratia AI Solutions. All rights
            reserved.
          </p>
          <a
            href="#hero"
            data-cursor="link"
            className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[#5d6d80] transition-colors duration-300 hover:text-molten"
          >
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
