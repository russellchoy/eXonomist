import { Game, type GameMode } from "@/components/Game";

/**
 * Game route. Reads `?mode=timed|zen` from the URL on the server (searchParams is
 * a Promise in Next 16) and hands the resolved mode to the client Game component.
 * Reading searchParams here avoids needing `useSearchParams` + a Suspense boundary.
 */
export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string | string[] }>;
}) {
  const { mode } = await searchParams;
  const resolved: GameMode = mode === "zen" ? "zen" : "timed";
  return <Game mode={resolved} />;
}
