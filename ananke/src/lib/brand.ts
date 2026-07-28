/**
 * ANANKE brand constants — the single source of truth for copy that appears in
 * more than one place. Ananke: the Greek primordial goddess of necessity and
 * fate, whom even the gods could not escape. Old soul, new world.
 */

export const BRAND = {
  name: "ANANKE",
  tagline: "Old soul. New world.",
  origin:
    "Ananke — necessity, the force even the gods feared. Not fate as resignation, but fate as the discipline of doing what must be done.",
} as const;

export interface Pillar {
  slug: string;
  title: string;
  line: string;
}

/** The five content pillars from the brand strategy. */
export const PILLARS: readonly Pillar[] = [
  {
    slug: "philosophy",
    title: "Philosophy",
    line: "The ideas that outlived the men who wrote them — turned into something you can use before noon.",
  },
  {
    slug: "mythology",
    title: "Mythology & Heroes",
    line: "The old stories were never about gods. They were about you, on the days it's hard.",
  },
  {
    slug: "discipline",
    title: "Discipline & Self-Development",
    line: "Not motivation. The unglamorous habit of showing up when feeling ready never comes.",
  },
  {
    slug: "power",
    title: "Power & Strategy",
    line: "Self-mastery and reading the room. Strategy, not manipulation.",
  },
  {
    slug: "playful",
    title: "Playful / Modern",
    line: "Old gods, new problems. The wink that makes the rest go down.",
  },
] as const;
