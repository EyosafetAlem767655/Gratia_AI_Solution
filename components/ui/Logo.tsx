/**
 * The Gratia mark — "Seed & Circuit".
 *
 * A G drawn as an open ring, its aperture and crossbar formed the way a G's
 * are, but built from a circuit trace: three nodes sit on the ring where a
 * board would tap it. Inside grows a leaf. Machine on the outside, living
 * thing on the inside — the proposition in one glyph.
 *
 * Monochrome, and drawn entirely in `currentColor`. That is deliberate: over
 * the forest film the chrome has to flip from near-black on small screens to
 * white on large ones, and a mark with baked-in colours cannot follow. Set the
 * colour on the parent and the logo comes with it.
 */
export function LogoMark({
  className = "h-6 w-6",
  animated = true,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden
      focusable="false"
    >
      {/* The G's bowl: one stroke with a measured gap, so the counter reads as
          an aperture rather than a broken circle. */}
      <circle
        cx="24"
        cy="24"
        r="19"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="79 21"
        transform="rotate(-31 24 24)"
      >
        {animated && (
          <animate
            attributeName="stroke-dasharray"
            values="79 21; 82 18; 79 21"
            dur="6s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {/* The G's crossbar, entering from the aperture. */}
      <path d="M43 24 H31" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

      {/* Circuit taps on the ring. */}
      {[
        { cx: 24, cy: 5, d: "0s" },
        { cx: 7.6, cy: 33.5, d: "1.1s" },
        { cx: 31, cy: 41, d: "2.2s" },
      ].map((node) => (
        <circle
          key={`${node.cx}-${node.cy}`}
          cx={node.cx}
          cy={node.cy}
          r="3"
          fill="currentColor"
          opacity="0.9"
        >
          {animated && (
            <animate
              attributeName="r"
              values="2.6; 3.4; 2.6"
              dur="3.2s"
              begin={node.d}
              repeatCount="indefinite"
            />
          )}
        </circle>
      ))}

      {/* The living core. */}
      <path
        d="M16 33C16 23.6 22.6 17 32 17C32 26.4 25.4 33 16 33Z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}

/** Mark plus wordmark. Colour is inherited — see the note above. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="h-6 w-6 shrink-0" />
      <span className="text-lg font-semibold tracking-tight">gratia</span>
    </span>
  );
}
