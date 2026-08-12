/**
 * The Gratia mark — "Seed & Circuit".
 *
 * A G drawn as an open ring, its aperture and crossbar formed the way a G's
 * are, but built from a circuit trace: three nodes sit on the ring where a
 * board would tap it. Inside grows a leaf, its midrib continuing the trace.
 * Machine on the outside, living thing on the inside — the proposition in one
 * glyph.
 *
 * Drawn as inline SVG rather than an image so it inherits brand tokens, scales
 * without a raster, and can breathe.
 */
export function LogoMark({
  className = "h-9 w-9",
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
      <defs>
        <linearGradient id="gratia-ring" x1="8" y1="6" x2="40" y2="42">
          <stop offset="0%" stopColor="var(--violet)" />
          <stop offset="55%" stopColor="#d8b4fe" />
          <stop offset="100%" stopColor="var(--iris)" />
        </linearGradient>
        <linearGradient id="gratia-leaf" x1="16" y1="34" x2="34" y2="15">
          <stop offset="0%" stopColor="var(--iris)" />
          <stop offset="100%" stopColor="var(--violet)" />
        </linearGradient>
      </defs>

      {/* The G's bowl: one stroke with a measured gap, so the counter reads as
          an aperture rather than a broken circle. */}
      <circle
        cx="24"
        cy="24"
        r="19"
        stroke="url(#gratia-ring)"
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
      <path
        d="M43 24 H31"
        stroke="url(#gratia-ring)"
        strokeWidth="3"
        strokeLinecap="round"
      />

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
          fill="var(--deep)"
          stroke="var(--violet)"
          strokeWidth="2"
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
        fill="url(#gratia-leaf)"
      />
      <path
        d="M17.4 31.6L30.6 18.4"
        stroke="var(--deep)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M22.2 28.6L20.6 24.4M25.6 25.2L29.8 23.6"
        stroke="var(--deep)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

/** Mark plus wordmark, used in the header and footer. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-8 w-8 shrink-0" />
      <span className="font-display text-[1.02rem] font-semibold tracking-[-0.02em] text-white-soft">
        gratia
        <span className="text-violet">.</span>
        <span className="text-muted">ai</span>
      </span>
    </span>
  );
}
