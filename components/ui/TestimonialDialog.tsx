"use client";

/**
 * The full text of one testimonial.
 *
 * The cards in the train are deliberately small and their summary is clamped to
 * three lines, so before this existed there was no way to read an entry in
 * full. Clicking a card opens it here, untruncated.
 *
 * BUILT ON THE NATIVE <dialog>, not a hand-rolled overlay. `showModal()` gives
 * focus trapping, Escape-to-close, `inert` on everything behind it and a real
 * `::backdrop` — all things this project would otherwise have to implement and
 * get wrong. There is no dialog library in the dependency list and the mobile
 * drawer in Nav.tsx is not one (no role, no focus trap), so there was nothing
 * to reuse.
 *
 * Deliberately NOT locking body scroll by hand: `lib/scroll.ts` exports
 * `releaseScrollLock()` and every <SectionLink> click calls it, so a lock taken
 * here could be dropped by an unrelated component. Modal `<dialog>` makes the
 * page inert, which covers it.
 */

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { ProjectRecord } from "@/lib/types";

export function TestimonialDialog({
  project,
  onClose,
}: {
  project: ProjectRecord | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (project && !el.open) {
      el.showModal();
    } else if (!project && el.open) {
      el.close();
    }
  }, [project]);

  return (
    <dialog
      ref={ref}
      // Fires for Escape and for form-method=dialog alike, so state stays in
      // step with the element however it was dismissed.
      onClose={onClose}
      // Clicking the backdrop closes. The backdrop is the dialog element itself
      // outside its child box, so a click whose target IS the dialog means the
      // pointer landed outside the content.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      aria-labelledby="testimonial-dialog-title"
      // `m-auto` is load-bearing: the UA centres a modal <dialog> with
      // `margin: auto` inside its `inset: 0` box, and Tailwind's preflight
      // resets every margin to 0, which pins the dialog to the top-left.
      className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-2xl border border-white/15 bg-ink-2 p-0 text-white backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      {project && (
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            {project.companyLogoUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={project.companyLogoUrl}
                alt={`${project.companyName} logo`}
                className="h-16 w-auto object-contain"
              />
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="glass -mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {project.testimonial && (
            <blockquote className="mt-5 text-base leading-relaxed text-white/85">
              &ldquo;{project.testimonial}&rdquo;
            </blockquote>
          )}

          <div className="mt-5 border-t border-white/10 pt-4">
            <h2 id="testimonial-dialog-title" className="text-base font-semibold">
              {project.companyName}
            </h2>
            {project.industry && (
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/50">
                {project.industry}
              </p>
            )}
          </div>

          {/* Untruncated, unlike the card. This is the reason the dialog
              exists. */}
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            {project.aiSummary ?? project.description}
          </p>
        </div>
      )}
    </dialog>
  );
}
