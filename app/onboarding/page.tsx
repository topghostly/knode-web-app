import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { technologies, userTechnologies, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = { title: "Set up – Knode" };

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const userId = session.user.id;
  const [options, selected, profile] = await Promise.all([
    db
      .select({ id: technologies.id, name: technologies.name, category: technologies.category })
      .from(technologies)
      .where(eq(technologies.isActive, true))
      .orderBy(asc(technologies.name)),
    db
      .select({ technologyId: userTechnologies.technologyId })
      .from(userTechnologies)
      .where(eq(userTechnologies.userId, userId)),
    db.query.users.findFirst({
      columns: { firstName: true, experienceLevel: true },
      where: eq(users.id, userId),
    }),
  ]);

  return (
    <OnboardingFlow
      firstName={profile?.firstName ?? ""}
      technologies={options}
      initialSelected={selected.map((s) => s.technologyId)}
      initialLevel={profile?.experienceLevel ?? null}
    />
  );
}
