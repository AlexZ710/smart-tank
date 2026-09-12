// Shared honest placeholder for pages implemented in later web sessions
// (S24-S26). Never renders invented values: an empty state says exactly
// what is missing and which session wires the real data.

export default function PlaceholderPage({
  title,
  session,
  description,
  emptyState,
}: {
  title: string;
  session: string;
  description: string;
  emptyState: string;
}) {
  return (
    <>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm opacity-70">{description}</p>

      <div className="mt-6 rounded-xl border border-dashed border-zinc-300 p-6 text-sm dark:border-zinc-700">
        <p className="font-medium">No data displayed yet — nothing is fabricated.</p>
        <p className="mt-2 opacity-70">{emptyState}</p>
        <p className="mt-4 text-xs opacity-60">
          Scaffolded in S21; real database-backed content lands in {session} per
          docs/Web_Facade_Architecture.md.
        </p>
      </div>
    </>
  );
}
