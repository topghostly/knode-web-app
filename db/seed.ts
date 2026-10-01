import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { technologies } from "./schema.ts";

const seed: { name: string; slug: string; category: string }[] = [
  { name: "TypeScript", slug: "typescript", category: "Languages" },
  { name: "JavaScript", slug: "javascript", category: "Languages" },
  { name: "Python", slug: "python", category: "Languages" },
  { name: "Go", slug: "go", category: "Languages" },
  { name: "Rust", slug: "rust", category: "Languages" },
  { name: "Java", slug: "java", category: "Languages" },
  { name: "React", slug: "react", category: "Frontend" },
  { name: "Next.js", slug: "nextjs", category: "Frontend" },
  { name: "Vue", slug: "vue", category: "Frontend" },
  { name: "Node.js", slug: "nodejs", category: "Backend" },
  { name: "Django", slug: "django", category: "Backend" },
  { name: "Spring", slug: "spring", category: "Backend" },
  { name: "GraphQL", slug: "graphql", category: "Backend" },
  { name: "PostgreSQL", slug: "postgresql", category: "Data" },
  { name: "Redis", slug: "redis", category: "Data" },
  { name: "MongoDB", slug: "mongodb", category: "Data" },
  { name: "AWS", slug: "aws", category: "Infra & Cloud" },
  { name: "Google Cloud", slug: "gcp", category: "Infra & Cloud" },
  { name: "Kubernetes", slug: "kubernetes", category: "Infra & Cloud" },
  { name: "Docker", slug: "docker", category: "Infra & Cloud" },
  { name: "Terraform", slug: "terraform", category: "Infra & Cloud" },
  { name: "Linux", slug: "linux", category: "Infra & Cloud" },
];

const db = drizzle(neon(process.env.DATABASE_URL!), { casing: "snake_case" });

await db
  .insert(technologies)
  .values(seed)
  .onConflictDoUpdate({
    target: technologies.slug,
    set: {
      name: sql`excluded.name`,
      category: sql`excluded.category`,
      isActive: true,
    },
  });

console.log(`seeded ${seed.length} technologies`);
