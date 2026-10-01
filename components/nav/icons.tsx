import type { SVGProps } from "react";

export type NavIcon = (props: { active: boolean }) => React.JSX.Element;

const base = (props: SVGProps<SVGSVGElement>) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "size-5",
  "aria-hidden": true,
  ...props,
});

// Stroke weight thickens slightly on the active tab so the change reads
// without a colour swap alone.
const weight = (active: boolean) => (active ? 1.8 : 1.6);

export const HomeIcon: NavIcon = ({ active }) => (
  <svg {...base({ strokeWidth: weight(active) })}>
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
  </svg>
);

export const HistoryIcon: NavIcon = ({ active }) => (
  <svg {...base({ strokeWidth: weight(active) })}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
    <path d="M4.5 4v3.5H8" />
    <path d="M12 8v4.2l2.8 1.7" />
  </svg>
);

export const ProfileIcon: NavIcon = ({ active }) => (
  <svg {...base({ strokeWidth: weight(active) })}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 19.5c1.2-3.2 3.7-4.8 7-4.8s5.8 1.6 7 4.8" />
  </svg>
);
