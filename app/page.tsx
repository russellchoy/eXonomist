import Link from "next/link";
import { Masthead, LaTeX } from "@/components/Wordmark";

const hints = [
  <>
    No <code className="font-mono font-bold">$</code> signs needed
  </>,
  <>All formulas are rendered in display style</>,
  <>
    Use <code className="font-mono font-bold">\left</code> and{" "}
    <code className="font-mono font-bold">\right</code> to correctly size balanced
    delimiters like <code className="font-mono">(</code>,{" "}
    <code className="font-mono">{"{"}</code>, and{" "}
    <code className="font-mono font-bold">\lceil</code>
  </>,
  <>
    Prefer <code className="font-mono font-bold">\bmod</code> and{" "}
    <code className="font-mono font-bold">\pmod</code> to{" "}
    <code className="font-mono font-bold">\mod</code>
  </>,
  <>
    Use <code className="font-mono font-bold">\mathbf</code>, not{" "}
    <code className="font-mono font-bold">\textbf</code>
  </>,
  <>Harder problems are worth more points</>,
  <>Open the in-game Symbol Reference to look up unknown symbols</>,
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-12 px-6 py-16">
      <Masthead size="large" />

      <div className="flex flex-col items-center gap-4 text-center text-xl">
        <p>
          This is a game to test your <LaTeX /> skills.
        </p>
        <p>
          Type as many formulas as you can in three minutes (timed game), or play
          an untimed game (zen mode)!
        </p>
      </div>

      <div className="flex gap-5">
        <Link
          href="/play?mode=timed"
          className="border-2 border-black px-6 py-3 text-xl no-underline hover:bg-black hover:text-white"
        >
          Timed Game
        </Link>
        <Link
          href="/play?mode=zen"
          className="border-2 border-black px-6 py-3 text-xl no-underline hover:bg-black hover:text-white"
        >
          Zen Mode
        </Link>
      </div>

      <section className="w-full">
        <h2 className="mb-3 text-xl font-bold">Hints:</h2>
        <ul className="ml-6 flex list-disc flex-col gap-2 text-lg">
          {hints.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
