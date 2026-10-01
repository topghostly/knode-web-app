"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useReducedMotion } from "motion/react";
import { WalkForeground, WalkScene } from "./walk-scene";

// Walkers begin outside the stage; the player's default freezeOnOffscreen
// would stop their frames there and not reliably resume as CSS carries them
// in, so they'd glide across frozen. Keep rendering regardless.
const renderConfig = { freezeOnOffscreen: false, autoResize: true };

/**
 * Open stage on the page background: two characters cross in turn along a
 * hairline ground in front of a tonal landscape (WalkScene) and behind a few
 * pebbles (WalkForeground), fading in and out at the edges. Choreography is
 * one CSS timeline (.walker-a / .walker-b in globals.css) driven by container-query
 * units, so a crossing always spans the stage exactly. Under reduced motion
 * both stand still.
 *
 * Box sizes and offsets come from measuring each animation's extents over a
 * full walk cycle (pirate: 21.2%–96.7% of its box; duck: 2.8%–96.3%), so the
 * lowest foot position of the whole cycle lands exactly on the ground line
 * and both figures stand 86% of the stage tall with 14% headroom.
 */
export function WalkPanel() {
  const reduced = useReducedMotion();
  return (
    <div aria-hidden className="walk-panel relative h-64 w-full overflow-hidden sm:h-80 lg:h-96">
      <WalkScene />
      <div className="absolute inset-x-0 bottom-0 h-px bg-ink/15" />
      <div className={`walker walker-a absolute bottom-[-12.5%] left-0 aspect-square h-[114%] ${reduced ? "walker-static" : ""}`}>
        <DotLottieReact src="/json/BaEgmthWRn.json" loop autoplay={!reduced} renderConfig={renderConfig} />
      </div>
      <div className={`walker walker-b absolute bottom-[-3.4%] left-0 aspect-square h-[92%] ${reduced ? "walker-static" : ""}`}>
        <DotLottieReact src="/json/Duck%20Blue%20Style.json" loop autoplay={!reduced} renderConfig={renderConfig} />
      </div>
      <WalkForeground />
    </div>
  );
}
