import Image from "next/image";
import Link from "next/link";
import { LaTeX } from "@/components/Wordmark";
import logo from "@/public/logo.png";

const notes = [
  <>
    Inspired by{" "}
    <a
      href="https://texnique.xyz/"
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:text-[#3b5bdb]"
    >
      TeXnique
    </a>{" "}
    — thank you to Akshay Ravikumar for creating the original game.
  </>,
  <>
    Questions are drawn from the Part I and Part IIA papers of the Cambridge
    Economics Tripos (from lecture notes).
  </>,
];

const hints = [
  <>
    No <code className="font-mono font-bold">$</code> signs needed
  </>,
  <>All formulae are rendered in display style</>,
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
  <>
    Prefer <code className="font-mono font-bold">\quad</code> for spacing between
    parts of a formula (spacing never affects whether an answer is accepted)
  </>,
  <>Harder problems are worth more points</>,
  <>
    Stuck? Reveal hints one at a time in-game, or open the{" "}
    <Link href="/glossary" className="underline underline-offset-2 hover:text-[#3b5bdb]">
      Glossary
    </Link>{" "}
    for command syntax
  </>,
  <>Open the in-game Symbol Reference to look up unknown symbols</>,
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-12 px-6 py-16">
      <div className="flex flex-col items-center gap-5 text-center">
        <Image
          src={logo}
          alt="eXonomist"
          priority
          className="h-auto w-56 sm:w-64"
        />
        <p className="text-2xl sm:text-3xl">
          a <LaTeX /> typesetting game for Economists
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 text-center text-xl">
        <p>
          This is a game to test your <LaTeX /> skills.
        </p>
        <p>
          Type as many formulae as you can in three minutes (timed game), or play
          an untimed game (zen mode)!
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-5">
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
        <Link
          href="/daily"
          className="border-2 border-black px-6 py-3 text-xl no-underline hover:bg-black hover:text-white"
        >
          Daily Challenge
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
        <Link
          href="/leaderboard"
          className="text-lg underline underline-offset-4 hover:text-[#3b5bdb]"
        >
          View the leaderboard →
        </Link>
        <Link
          href="/glossary"
          className="text-lg underline underline-offset-4 hover:text-[#3b5bdb]"
        >
          Browse the LaTeX glossary →
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

      <section className="w-full">
        <h2 className="mb-3 text-xl font-bold">Notes:</h2>
        <ul className="ml-6 flex list-disc flex-col gap-2 text-lg">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
