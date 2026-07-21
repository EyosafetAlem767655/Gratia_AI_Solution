"use client";

import { createContext, useContext } from "react";

export const ScrollContext = createContext(0);

export function useScrollProgress() {
  return useContext(ScrollContext);
}

export function scrollSectionProgress(
  scroll: number,
  start: number,
  end: number,
): number {
  if (scroll <= start) return 0;
  if (scroll >= end) return 1;
  return (scroll - start) / (end - start);
}
