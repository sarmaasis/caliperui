"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * True inside a block stage: a frame shown there is a demonstration on a page
 * that already has its own main landmark, so it should not add a second one.
 */
const InStage = createContext(false);

export function StageScope({ children }: { children: ReactNode }) {
  return <InStage.Provider value={true}>{children}</InStage.Provider>;
}

export const useInStage = () => useContext(InStage);
