"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

/** One orchestrated entrance: each direct child rises in turn. Shared by Home and the session brief. */
export function Intro({
  children,
  className,
  itemClassName = [],
}: {
  children: ReactNode[];
  className?: string;
  itemClassName?: (string | undefined)[];
}) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className={className}>
      {children.map((child, i) => (
        <motion.div key={i} variants={item} className={itemClassName[i]}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
