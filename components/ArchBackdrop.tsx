// The logo's door arch drawn large behind a sign-in form: the page reads as a
// doorway, and its base stands on the footer's top line like a door on a floor.
export function ArchBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-6 bottom-0 flex justify-center overflow-hidden px-1 sm:top-10 sm:px-4">
      <div className="relative h-full w-full max-w-[34rem] rounded-t-full border border-b-0 border-border">
        <div className="absolute inset-x-3 top-4 bottom-0 rounded-t-full border border-b-0 border-border bg-secondary/60 sm:inset-x-10 sm:top-10" />
      </div>
    </div>
  )
}
