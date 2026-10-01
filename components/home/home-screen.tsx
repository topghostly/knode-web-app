import Image from "next/image";
import { WalkPanel } from "./walk-panel";
import { StartButton, type StartState } from "./start-button";
import { Intro } from "@/components/ui/intro";
import { Screen } from "@/components/ui/screen";

export type HomeScreenProps = {
  headline: string;
  state: StartState;
  status: string;
};

/** Presentational Home: the mark, the stage, the one action. Everything on the centre line. */
export function HomeScreen({ headline, state, status }: HomeScreenProps) {
  return (
    <Screen>
      <Intro className="flex flex-1 flex-col items-center justify-center" itemClassName={["shrink-0", "w-full", "w-full"]}>
        <header className="flex items-center justify-center pb-6 sm:pb-16">
          <Image src="/svg/logo.svg" alt="Knode" width={54} height={44} unoptimized priority className="h-10 w-auto sm:h-12" />
        </header>

        <WalkPanel />

        <div className="mt-16 flex w-full flex-col items-center sm:mt-30">
          <h1 className="max-w-md text-center font-display text-[1.75rem] font-medium leading-[1.1] tracking-tight text-balance sm:text-[2.25rem]">
            {headline}
          </h1>
          <div className="mt-7 flex w-full flex-col items-center sm:mt-8">
            <StartButton state={state} status={status} />
          </div>
        </div>
      </Intro>
    </Screen>
  );
}
