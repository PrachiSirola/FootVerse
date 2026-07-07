"use client";

import { motion, useReducedMotion } from "framer-motion";
import FloatingShoe from "./FloatingShoe";

const EASE = [0.45, 0, 0.25, 1];

/**
 * Renders one scene, matched to the reference:
 * ── eyebrow with flanking dashes
 * ── headline (Oswald condensed OR split-color Playfair brand)
 * ── divider with gold diamond
 * ── gold serif tagline
 * ── description
 * ── CTA button
 * plus the two choreographed shoes.
 *
 * @param {{ scene: object }} props
 */
export default function HeroScene({ scene }) {
  const reduceMotion = useReducedMotion();

  /** Sequential fade-up used by every text row. */
  const fadeUp = (delay) => ({
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: reduceMotion
        ? { duration: 0.3 }
        : { duration: 0.7, ease: EASE, delay },
    },
    exit: {
      opacity: 0,
      y: reduceMotion ? 0 : -12,
      transition: { duration: 0.4, ease: "easeIn" },
    },
  });

  const [firstShoe, secondShoe] = scene.shoes;
  const { headline } = scene;

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 py-8 md:gap-0"
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {/* First shoe — above the text on mobile, left slot on desktop */}
      {firstShoe && (
        <FloatingShoe shoe={firstShoe} accent={scene.accent} enterDelay={0.1} />
      )}

      {/* Centered text column */}
      <div className="relative z-20 flex max-w-2xl flex-col items-center text-center">
        {/* Eyebrow with flanking dashes */}
        <motion.p
          variants={fadeUp(0.1)}
          className="flex items-center gap-4 text-[13px] font-medium uppercase tracking-[0.32em] text-[#A5793A] sm:text-sm"
        >
          <span aria-hidden className="h-px w-8 bg-[#A5793A]/60 sm:w-10" />
          {scene.eyebrow}
          <span aria-hidden className="h-px w-8 bg-[#A5793A]/60 sm:w-10" />
        </motion.p>

        {/* Headline */}
        {headline.variant === "condensed" ? (
          <motion.h1
            variants={fadeUp(0.22)}
            className="mt-3 font-oswald text-[40px] font-semibold uppercase leading-none tracking-[0.01em] md:whitespace-nowrap text-[#33231A] sm:text-6xl lg:text-[64px]"
          >
            {headline.text}
          </motion.h1>
        ) : (
          <motion.h1
            variants={fadeUp(0.22)}
            className="mt-2 font-playfair text-6xl font-bold leading-none tracking-tight sm:text-7xl lg:text-[80px]"
          >
            <span className="text-[#33231A]">{headline.primary}</span>
            <span className="text-[#A5793A]">{headline.accent}</span>
          </motion.h1>
        )}

        {/* Divider with gold diamond */}
        <motion.div
          variants={fadeUp(0.34)}
          aria-hidden
          className="mt-4 flex items-center gap-3"
        >
          <span className="h-px w-16 bg-[#33231A]/20 sm:w-24" />
          <span className="h-1.5 w-1.5 rotate-45 bg-[#A5793A]" />
          <span className="h-px w-16 bg-[#33231A]/20 sm:w-24" />
        </motion.div>

        {/* Tagline */}
        <motion.p
          variants={fadeUp(0.44)}
          className="mt-3 font-playfair text-xl font-medium text-[#A5793A] sm:text-2xl"
        >
          {scene.tagline}
        </motion.p>

        {/* Description */}
        <motion.p
          variants={fadeUp(0.54)}
          className="mt-3 max-w-md text-sm leading-relaxed text-[#6E655C] sm:text-[15px]"
        >
          {scene.description}
        </motion.p>

        {/* CTA */}
        <motion.div variants={fadeUp(0.64)} className="mt-6">
          <a
            href={scene.cta.href}
            className="inline-block rounded-md bg-[#33231A] px-9 py-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_14px_30px_-14px_rgba(51,35,26,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#4A3526] hover:shadow-lg"
          >
            {scene.cta.label}
          </a>
        </motion.div>
      </div>

      {/* Second shoe — below the text on mobile, right slot on desktop */}
      {secondShoe && (
        <FloatingShoe shoe={secondShoe} accent={scene.accent} enterDelay={0.25} />
      )}
    </motion.div>
  );
}