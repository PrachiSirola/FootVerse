"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE_OUT = [0.22, 1, 0.36, 1];

/**
 * Splits the headline into words → letters and reveals it letter-by-letter.
 * Words are kept unbreakable so the stagger never wraps mid-word.
 *
 * @param {{ text: string, delay?: number, className?: string }} props
 */
export default function AnimatedHeadline({ text, delay = 0.25, className = "" }) {
  const reduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: reduceMotion
        ? { duration: 0 }
        : { staggerChildren: 0.042, delayChildren: delay },
    },
    exit: {
      opacity: 0,
      y: reduceMotion ? 0 : -16,
      filter: "blur(5px)",
      transition: { duration: 0.45, ease: "easeIn" },
    },
  };

  const letter = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: "0.55em" },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: EASE_OUT },
    },
  };

  const words = text.split(" ");

  return (
    <motion.h1
      className={className}
      variants={container}
      initial="hidden"
      animate="show"
      exit="exit"
      aria-label={text}
    >
      {words.map((word, wi) => (
        <span
          key={`${word}-${wi}`}
          className="inline-block whitespace-nowrap"
          aria-hidden
        >
          {Array.from(word).map((char, ci) => (
            <motion.span
              key={`${char}-${ci}`}
              variants={letter}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </motion.h1>
  );
}