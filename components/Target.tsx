import { KatexMath } from "@/components/KatexMath";

/**
 * The goal panel: "Try to create the following formula:" above a bordered box
 * with the target rendered in display style. (See reference problem screens.)
 */
export function Target({ latex }: { latex: string }) {
  return (
    <section>
      <p className="mb-2 text-lg">Try to create the following formula:</p>
      <div className="flex min-h-[7rem] items-center justify-center overflow-x-auto border-2 border-black px-6 py-8">
        <KatexMath latex={latex} displayMode className="text-xl" />
      </div>
    </section>
  );
}
