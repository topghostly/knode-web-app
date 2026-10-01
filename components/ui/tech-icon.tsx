import {
  siDjango,
  siDocker,
  siGo,
  siGooglecloud,
  siGraphql,
  siJavascript,
  siKubernetes,
  siLinux,
  siMongodb,
  siNextdotjs,
  siNodedotjs,
  siOpenjdk,
  siPostgresql,
  siPython,
  siReact,
  siRedis,
  siRust,
  siSpring,
  siTerraform,
  siTypescript,
  siVuedotjs,
} from "simple-icons";

// Keyed by the `technologies.slug` seeded in db/seed.ts. simple-icons has no
// AWS mark (trademark), so that one and any unknown slug get a plain cloud.
const PATHS: Record<string, string> = {
  typescript: siTypescript.path,
  javascript: siJavascript.path,
  python: siPython.path,
  go: siGo.path,
  rust: siRust.path,
  java: siOpenjdk.path,
  react: siReact.path,
  nextjs: siNextdotjs.path,
  vue: siVuedotjs.path,
  nodejs: siNodedotjs.path,
  django: siDjango.path,
  spring: siSpring.path,
  graphql: siGraphql.path,
  postgresql: siPostgresql.path,
  redis: siRedis.path,
  mongodb: siMongodb.path,
  gcp: siGooglecloud.path,
  kubernetes: siKubernetes.path,
  docker: siDocker.path,
  terraform: siTerraform.path,
  linux: siLinux.path,
};

const CLOUD = "M7 19a5 5 0 0 1-.6-9.96A6.5 6.5 0 0 1 18.9 10.5 4.25 4.25 0 0 1 18 19H7Zm0-2h11a2.25 2.25 0 0 0 .3-4.48l-1.4-.19-.35-1.37a4.5 4.5 0 0 0-8.66.5l-.24 1.2-1.22.13A3 3 0 0 0 7 17Z";

/** Monochrome technology mark in `currentColor`, sized by the caller. */
export function TechIcon({ slug, className = "size-4" }: { slug: string; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d={PATHS[slug] ?? CLOUD} />
    </svg>
  );
}
