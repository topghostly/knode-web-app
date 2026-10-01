import { BottomNav } from "@/components/nav/bottom-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
