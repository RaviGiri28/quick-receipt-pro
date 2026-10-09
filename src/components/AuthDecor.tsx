// Background blobs and dot grids shared by the login and sign-up screens.
export function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-40 top-1/4 h-96 w-96 animate-blob bg-[hsl(var(--brand-glow)/0.5)]" />
      <div className="absolute -right-32 top-1/3 h-[28rem] w-[28rem] animate-blob bg-[hsl(var(--brand-glow)/0.4)] [animation-delay:-6s]" />
      <div className="absolute -bottom-40 left-1/3 h-96 w-96 animate-blob bg-[hsl(var(--brand-glow)/0.35)] [animation-delay:-3s]" />
      <div className="dot-grid absolute right-10 top-8 h-20 w-24 opacity-70" />
      <div className="dot-grid absolute bottom-10 left-1/2 h-20 w-24 opacity-60" />
    </div>
  );
}

// Handwritten tagline with an animated underline swoosh.
export function HandNote({ lines }: { lines: [string, string] }) {
  return (
    <div className="-rotate-[8deg] text-primary">
      <p className="font-hand text-3xl font-bold leading-[1.05]">
        {lines[0]}
        <br />
        <span className="pl-3">{lines[1]}</span>
      </p>
      <svg viewBox="0 0 200 24" className="ml-6 mt-1 w-44" aria-hidden>
        <path
          d="M4 20 C 60 6, 130 2, 196 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="300"
          className="animate-draw-line"
        />
      </svg>
    </div>
  );
}
