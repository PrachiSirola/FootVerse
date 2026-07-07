"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

const ENTER_EASE = [0.45, 0, 0.25, 1];
const EXIT_EASE = [0.5, 0, 0.75, 0.2];

const OFFSCREEN = {
  left: { x: "-60vw", y: "0vh" },
  right: { x: "60vw", y: "0vh" },
  top: { x: "0vw", y: "-65vh" },
  bottom: { x: "0vw", y: "65vh" },
};

const SLOT_CLASSES = {
  left: "md:absolute md:left-[-4%] md:top-1/2 md:-translate-y-1/2 xl:left-[-2%]",
  right: "md:absolute md:right-[-4%] md:top-1/2 md:-translate-y-1/2 xl:right-[-2%]",
};

const GLOWS = {
  red: {
    className:
      "left-1/2 top-1/2 h-[46%] w-[130%] -translate-x-1/2 -translate-y-1/2 bg-[linear-gradient(90deg,transparent_0%,rgba(219,45,45,0.30)_50%,transparent_100%)]",
    peak: 0.85,
    rest: 0.55,
  },
  gold: {
    className:
      "left-1/2 top-1/2 h-[130%] w-[46%] -translate-x-1/2 -translate-y-1/2 bg-[linear-gradient(180deg,transparent_0%,rgba(217,184,122,0.38)_50%,transparent_100%)]",
    peak: 0.9,
    rest: 0.6,
  },
};

export default function FloatingShoe({ shoe, accent, enterDelay = 0 }) {
  const reduceMotion = useReducedMotion();
  const from = OFFSCREEN[shoe.enterFrom];
  const to = OFFSCREEN[shoe.exitTo];
  const glow = GLOWS[accent];

  const travel = {
    hidden: reduceMotion
      ? { opacity: 0 }
      : { x: from.x, y: from.y, scale: 0.88, opacity: 0 },
    show: {
      x: "0vw",
      y: "0vh",
      scale: 1,
      opacity: 1,
      transition: reduceMotion
        ? { duration: 0.3 }
        : { duration: 1.0, ease: ENTER_EASE, delay: enterDelay },
    },
    exit: reduceMotion
      ? { opacity: 0, transition: { duration: 0.25 } }
      : {
          x: to.x,
          y: to.y,
          scale: 0.92,
          opacity: 0,
          transition: { duration: 0.8, ease: EXIT_EASE },
        },
  };

  return (
    <div
      className={`pointer-events-none relative z-10 w-72 shrink-0 sm:w-96 md:w-[48vw] md:max-w-none ${SLOT_CLASSES[shoe.slot]}`}
    >
      <motion.div variants={travel} initial="hidden" animate="show" exit="exit">
        {!reduceMotion && (
          <motion.div
            aria-hidden
            className={`absolute rounded-full blur-2xl ${glow.className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, glow.peak, glow.rest] }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{
              delay: enterDelay + 1.2,
              duration: 0.9,
              times: [0, 0.6, 1],
              ease: "easeInOut",
            }}
          />
        )}

        <motion.div
          animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
          transition={{
            duration: 4.5,
            ease: "easeInOut",
            repeat: Infinity,
            delay: shoe.floatDelay,
          }}
          className="relative"
        >
          <Image
            src={shoe.src}
            alt={shoe.alt}
            width={1400}
            height={1150}
            priority
            className="h-auto w-full select-none"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}