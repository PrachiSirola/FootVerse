/**
 * FootVerse hero scene definitions — matched to the reference design.
 */

/** Time each scene owns the stage: 2s hold + ~1s crossover transition. */
export const SCENE_DURATION_MS = 3000;

export const SCENES = [
  {
    id: "sports",

    // 👇 Sports Background
    background: "/backgrounds/backgroundimage1.png",

    accent: "red",

    eyebrow: "New Arrival",

    headline: {
      variant: "condensed",
      text: "SPORTS COLLECTION",
    },

    tagline: "Engineered for Speed. Built for Every Victory.",

    description:
      "High-performance footwear designed for athletes and everyday champions.",

    cta: {
      label: "Shop Now",
      href: "#sports",
    },

    shoes: [
      {
        src: "/shoes/sneakersfinal1.png",
        alt: "Black and red Air Jordan sneaker with red motion streaks",
        slot: "left",
        enterFrom: "left",
        exitTo: "top",
        floatDelay: 0,
      },
      {
        src: "/shoes/sportsfinal1.png",
        alt: "Black and red football boot with red motion streaks",
        slot: "right",
        enterFrom: "right",
        exitTo: "bottom",
        floatDelay: 0.8,
      },
    ],
  },

  {
    id: "brand",

    // 👇 Formal Background
    background: "/backgrounds/backgroundfinal1.png",

    accent: "gold",

    eyebrow: "Welcome To",

    headline: {
      variant: "brand",
      primary: "Foot",
      accent: "Verse",
    },

    tagline: "Your Universe of Footwear",

    description:
      "From sports and casual to formal, boots, sandals, and everyday essentials—discover the perfect pair for every style and every step.",

    cta: {
      label: "Explore Collection",
      href: "#collections",
    },

    shoes: [
      {
        src: "/shoes/formalfinal.png",
        alt: "Black formal men's Oxford shoe with golden light trail",
        slot: "left",
        enterFrom: "top",
        exitTo: "top",
        floatDelay: 0.4,
      },
      {
        src: "/shoes/formalwomenfinal.png",
        alt: "Black patent women's high heel with red sole and golden light trail",
        slot: "right",
        enterFrom: "bottom",
        exitTo: "bottom",
        floatDelay: 1.1,
      },
    ],
  },
];