import type { Metadata } from "next";
import { DailyChallenge } from "@/components/DailyChallenge";

export const metadata: Metadata = {
  title: "Daily Challenge — eXonomist",
  description:
    "Eight LaTeX formulae, the same for everyone each day. Fastest total time wins. One attempt per day.",
};

export default function DailyPage() {
  return <DailyChallenge />;
}
