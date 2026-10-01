"use client";

import { motion } from "motion/react";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<"button">, "onChange"> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function Switch({ checked, onCheckedChange, className = "", ...rest }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        checked ? "bg-brand" : "bg-ink/20"
      } ${className}`}
      {...rest}
    >
      <motion.span
        aria-hidden="true"
        className="absolute top-0.5 left-0.5 size-6 rounded-full bg-cream shadow-[0_1px_2px_rgba(56,56,56,0.25)]"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      />
    </button>
  );
}
