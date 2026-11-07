import type { Transition } from "motion/react"

// Critically damped: settles without overshoot. The default for anything that moves.
export const spring: Transition = { type: "spring", bounce: 0, visualDuration: 0.3 }

// A little bounce, only for a release after a press or swipe that carried energy.
export const springAfterGesture: Transition = { type: "spring", bounce: 0.2, visualDuration: 0.35 }
