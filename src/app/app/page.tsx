import type { Metadata } from "next";
import Finder from "@/components/Finder";

export const metadata: Metadata = { title: "Find your shows · Propped" };

export default function AppPage() {
  return (
    <main style={{ paddingBottom: 40 }}>
      <Finder />
    </main>
  );
}
