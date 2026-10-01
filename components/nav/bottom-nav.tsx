"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { HistoryIcon, HomeIcon, ProfileIcon, type NavIcon } from "./icons";

const TABS: { href: string; label: string; Icon: NavIcon }[] = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/history", label: "History", Icon: HistoryIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
];

const MotionLink = motion.create(Link);
const EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: "spring", stiffness: 480, damping: 40, mass: 0.8 } as const;

/**
 * Ink capsule on cream: the page's text colour, inverted. Inactive tabs are
 * icons; the active one opens into a cream pill with its label, and that pill
 * travels between tabs.
 */
export function BottomNav({ current }: { current?: string } = {}) {
  const routerPathname = usePathname();
  // `current` overrides the router pathname, for previews and tests.
  const pathname = current ?? routerPathname;
  const reduced = useReducedMotion();
  const spring = reduced ? { duration: 0 } : SPRING;

  return (
    <motion.nav
      aria-label="Main"
      initial={reduced ? false : { y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2"
    >
      <LayoutGroup id="bottom-nav">
        <ul className="flex items-center gap-0.5 rounded-full bg-ink p-1">
          {TABS.map(({ href, label, Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <MotionLink
                  href={href}
                  layout
                  transition={spring}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  whileTap={reduced ? undefined : { scale: 0.95 }}
                  className={`relative flex h-11 items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cream/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${
                    active ? "px-4 text-ink" : "w-11 justify-center text-cream/55 transition-colors duration-200 hover:text-cream/90"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-pill"
                      aria-hidden
                      transition={spring}
                      className="absolute inset-0 rounded-full bg-cream"
                    />
                  )}
                  <span className="relative">
                    <Icon active={active} />
                  </span>
                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.span
                        key="label"
                        initial={reduced ? false : { opacity: 0, width: 0, marginLeft: 0 }}
                        animate={{ opacity: 1, width: "auto", marginLeft: 8 }}
                        exit={reduced ? undefined : { opacity: 0, width: 0, marginLeft: 0 }}
                        transition={reduced ? { duration: 0 } : { duration: 0.32, ease: EASE }}
                        className="relative overflow-hidden text-[13px] font-medium whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </MotionLink>
              </li>
            );
          })}
        </ul>
      </LayoutGroup>
    </motion.nav>
  );
}
