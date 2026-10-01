/**
 * Scenery behind the walkers: a flat paper-cut landscape in the same vector
 * language as the characters, but tonal ink on cream so the blue figures stay
 * the only saturated thing on the stage. Three depth layers (hills, tree line,
 * reeds) step up in opacity toward the viewer and end at the ground line.
 * Opacity sits on each layer group, not the shapes, so overlapping canopy
 * circles read as one silhouette instead of darkening where they meet.
 *
 * The viewBox is 1200×400 with the ground at y=400; `xMidYMax slice` fills the
 * stage width and anchors the ground at the bottom on every breakpoint. On
 * phones the crop keeps roughly x 330–870, so the tree line is weighted there.
 *
 * WalkForeground is the one layer that goes in front of the walkers: a few
 * cream pebbles with an ink outline on the ground line, so the figures pass
 * behind something solid.
 */
export function WalkScene() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 400"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 h-full w-full text-ink"
      fill="currentColor"
    >
      <defs>
        <symbol id="conifer" viewBox="0 0 60 160">
          <rect x="27" y="138" width="6" height="22" />
          <polygon points="30,0 50,58 10,58" />
          <polygon points="30,32 56,102 4,102" />
          <polygon points="30,74 60,146 0,146" />
        </symbol>
        <symbol id="broadleaf" viewBox="0 0 90 130">
          <rect x="42" y="92" width="6" height="38" />
          <circle cx="45" cy="52" r="34" />
          <circle cx="22" cy="72" r="22" />
          <circle cx="68" cy="70" r="24" />
        </symbol>
        <symbol id="reeds" viewBox="0 0 40 70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M20 70 C21 50 18 30 22 6" />
          <path d="M20 70 C14 52 8 40 4 22" />
          <path d="M20 70 C26 54 32 44 38 30" />
          <path d="M20 70 C17 56 12 48 12 36" />
          <path d="M20 70 C24 58 30 54 34 50" />
        </symbol>
      </defs>

      {/* far: sun and hills */}
      <g opacity="0.05">
        <circle cx="770" cy="112" r="44" />
        <path d="M0 400 V332 C110 306 230 322 360 314 S600 274 760 300 S1040 334 1200 304 V400 Z" />
      </g>

      {/* mid: tree line, denser toward the centre for the phone crop */}
      <g opacity="0.09">
        <use href="#broadleaf" x="130" y="292" width="76" height="108" />
        <use href="#conifer" x="290" y="176" width="84" height="224" />
        <use href="#broadleaf" x="372" y="258" width="98" height="142" />
        <use href="#conifer" x="470" y="268" width="50" height="132" />
        <use href="#broadleaf" x="626" y="228" width="120" height="172" />
        <use href="#conifer" x="722" y="240" width="60" height="160" />
        <use href="#conifer" x="832" y="164" width="88" height="236" />
        <use href="#conifer" x="906" y="270" width="48" height="130" />
        <use href="#broadleaf" x="1010" y="278" width="86" height="122" />
        <use href="#conifer" x="1128" y="226" width="64" height="174" />
      </g>

      {/* near: reeds along the ground */}
      <g opacity="0.13" fill="none">
        <use href="#reeds" x="60" y="352" width="28" height="48" />
        <use href="#reeds" x="248" y="362" width="22" height="38" />
        <use href="#reeds" x="546" y="348" width="30" height="52" />
        <use href="#reeds" x="588" y="364" width="20" height="36" />
        <use href="#reeds" x="870" y="356" width="26" height="44" />
        <use href="#reeds" x="1096" y="350" width="30" height="50" />
        <use href="#reeds" x="1160" y="366" width="20" height="34" />
      </g>
    </svg>
  );
}

export function WalkForeground() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 400"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-0 h-full w-full text-ink"
      fill="var(--color-cream)"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <g>
        <path d="M84 400 C82 391 92 388 100 390 C108 392 110 397 108 400 Z" />
        <path d="M112 400 C112 395 118 394 122 396 C125 398 125 400 124 400 Z" />
        <path d="M418 400 C416 393 424 389 432 391 C438 393 438 398 436 400 Z" />
        <path d="M690 400 C688 396 694 393 700 394 C704 395 705 398 704 400 Z" />
        <path d="M710 400 C708 390 720 386 732 389 C740 391 742 397 740 400 Z" />
        <path d="M1002 400 C1002 394 1010 392 1016 394 C1020 396 1020 399 1018 400 Z" />
        <path d="M1150 400 C1148 392 1158 388 1168 390 C1174 392 1175 397 1173 400 Z" />
        <path d="M1180 400 C1180 396 1185 395 1188 396 C1190 397 1190 400 1189 400 Z" />
      </g>
    </svg>
  );
}
