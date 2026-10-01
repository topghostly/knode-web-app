import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Physical button, PostHog-style: a base and a face that share one dark
 * outline. The face sits 4px above the base at rest, lifts to 6px on hover
 * and drops to 2px while pressed. Only the face moves; the base and the
 * layout box never change size.
 */
type Variant = "primary" | "secondary" | "danger";
type Size = "lg" | "md" | "sm";

const VARIANT: Record<Variant, { outline: string; base: string; face: string; text: string; ring: string }> = {
  primary: { outline: "border-[#0b1733]", base: "bg-[#00276f]", face: "bg-brand", text: "text-cream", ring: "focus-visible:ring-brand" },
  secondary: { outline: "border-[#8a8072]", base: "bg-[#d9cdb2]", face: "bg-surface", text: "text-ink", ring: "focus-visible:ring-brand" },
  danger: { outline: "border-[#4a1713]", base: "bg-[#8f2d22]", face: "bg-[#d2382a]", text: "text-cream", ring: "focus-visible:ring-[#d2382a]" },
};

const SIZE: Record<Size, { face: string; radius: string; text: string }> = {
  lg: { face: "h-12 px-6", radius: "rounded-xl", text: "text-[15px]" },
  md: { face: "h-10 px-4", radius: "rounded-lg", text: "text-[14px]" },
  sm: { face: "h-8 gap-1.5 px-3", radius: "rounded-lg", text: "text-[13px]" },
};

type Common = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  /** "capped": full width on phones, 20rem from `sm` up. "full": always its container's width. */
  width?: "auto" | "capped" | "full";
  disabled?: boolean;
  className?: string;
};
type AsButton = Common & { href?: undefined } & Omit<ComponentProps<"button">, keyof Common>;
type AsLink = Common & { href: string } & Omit<ComponentProps<typeof Link>, keyof Common | "href">;
export type ButtonProps = AsButton | AsLink;

export function Button(props: ButtonProps) {
  const { children, variant = "primary", size = "lg", width = "auto", disabled = false, className = "", ...rest } = props;
  const v = VARIANT[variant];
  const s = SIZE[size];

  const baseClass = [
    "group relative block w-full border-[1.5px] select-none outline-none",
    s.radius,
    v.outline,
    v.base,
    `focus-visible:ring-2 ${v.ring} focus-visible:ring-offset-2 focus-visible:ring-offset-cream`,
    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
  ].join(" ");

  // -mx-[1.5px] lets the face's outline sit exactly over the base's, so the
  // sides read as one continuous edge.
  const faceClass = [
    "relative -mx-[1.5px] flex items-center justify-center border-[1.5px] whitespace-nowrap font-medium leading-none",
    "transition-transform duration-150 ease-out",
    s.face,
    s.radius,
    s.text,
    v.outline,
    v.face,
    v.text,
    disabled ? "-translate-y-1" : "-translate-y-1 group-hover:-translate-y-1.5 group-active:-translate-y-0.5 group-active:duration-75",
  ].join(" ");

  const face = <span className={faceClass}>{children}</span>;

  // pt-1 reserves the 4px the face rises above the base, so the visual
  // button fits its layout box and nothing around it moves.
  const WIDTH = { auto: "w-fit", capped: "w-full sm:max-w-xs", full: "w-full" };
  const wrapperClass = `block pt-1 ${WIDTH[width]} ${className}`;

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...linkRest } = rest as Omit<AsLink, keyof Common>;
    return (
      <span className={wrapperClass}>
        <Link {...linkRest} href={href} aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : undefined} className={baseClass}>
          {face}
        </Link>
      </span>
    );
  }

  const buttonRest = rest as Omit<AsButton, keyof Common>;
  return (
    <span className={wrapperClass}>
      <button type="button" {...buttonRest} disabled={disabled} className={baseClass}>
        {face}
      </button>
    </span>
  );
}
