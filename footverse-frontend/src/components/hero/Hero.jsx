"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import HeroScene from "./HeroScene";
import { SCENES, SCENE_DURATION_MS } from "./scenes";

export default function Hero() {
  const [index, setIndex] = useState(0);
  const scene = SCENES[index];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % SCENES.length);
    }, SCENE_DURATION_MS);

    return () => clearTimeout(timer);
  }, [index]);

  return (
    <section
      aria-label="Featured collections"
      className="relative overflow-hidden bg-[#faf9f7]"
    >
      {/* ================= BACKGROUND ================= */}

      <div className="absolute inset-0 -z-0 overflow-hidden">
        <img
          src="/backgrounds/backgroundfinal.png"
          alt=""
          className="absolute inset-0
                     w-full
                     h-full
                     object-cover
                     blur-[12px]
                     scale-110
                     capacity-28"
        />

        {/* Soft white overlay */}
        <div className="absolute inset-0 bg-white/12" />
      </div>

      {/* ================= GOLD GLOW ================= */}

      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[95vmin] w-[95vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(185,146,76,0.16)_0%,rgba(185,146,76,0.08)_45%,transparent_70%)]"
      />

      {/* Bottom fade */}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-white/60 to-transparent"
      />

      {/* ================= HERO ================= */}

      <div className="relative z-10 mx-auto h-[88vh] min-h-[820px] max-w-[1800px]">
        <AnimatePresence mode="wait">
          <HeroScene key={scene.id} scene={scene} />
        </AnimatePresence>
      </div>

      {/* ================= INDICATORS ================= */}

      <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Show ${s.headline}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`h-[3px] rounded-full transition-all duration-500 ${
              i === index
                ? "w-10 bg-gold"
                : "w-4 bg-espresso/20 hover:bg-espresso/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}