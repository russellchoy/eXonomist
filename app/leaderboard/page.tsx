import type { Metadata } from "next";
import { Leaderboard } from "@/components/Leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard — eXonomist",
  description:
    "Top Timed scores and today's Daily Challenge times for the eXonomist LaTeX typesetting game.",
};

export default function LeaderboardPage() {
  return <Leaderboard />;
}
