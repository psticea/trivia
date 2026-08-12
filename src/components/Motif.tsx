/** Elementele vizuale recurente: bara de progres, marcajele și numărul-fantomă. */

/** Progresul rundei: o bară segmentată, lipită de marginea de sus a ecranului. */
export function ProgressRail({
  total,
  current,
  results,
}: {
  total: number;
  current: number;
  results: (boolean | null)[];
}) {
  return (
    <div aria-hidden="true" className="flex h-[3px] w-full gap-[3px]">
      {Array.from({ length: total }, (_, i) => {
        const state = results[i];
        const isCurrent = i === current;
        return (
          <span
            key={i}
            className="h-full flex-1 rounded-full transition-colors duration-[var(--dur-slow)] ease-[var(--ease-out-expo)]"
            style={{
              backgroundColor:
                state === true
                  ? 'var(--color-accent)'
                  : state === false
                    ? 'var(--color-wrong)'
                    : isCurrent
                      ? 'var(--color-line-hi)'
                      : 'var(--color-line)',
            }}
          />
        );
      })}
    </div>
  );
}

/** Numărul uriaș din spatele conținutului — reperul vizual al fiecărui ecran. */
export function GhostNumeral({
  value,
  className = '',
}: {
  value: string | number;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={`ghost-numeral absolute ${className}`}>
      {value}
    </span>
  );
}

export function CheckMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none">
      <path
        d="M3 8.4 6.4 11.8 13 5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CrossMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none">
      <path
        d="M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ArrowRight({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" fill="none">
      <path
        d="M3.5 10h13M11 4.5 16.5 10 11 15.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LinkIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" fill="none">
      <path
        d="M8.5 11.5a3.4 3.4 0 0 0 5 .3l2-2a3.4 3.4 0 0 0-4.8-4.8l-1.1 1.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M11.5 8.5a3.4 3.4 0 0 0-5-.3l-2 2a3.4 3.4 0 0 0 4.8 4.8l1.1-1.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Bară subțire pentru defalcarea pe categorii — fără iconuri, doar proporție. */
export function ScoreBar({ correct, total }: { correct: number; total: number }) {
  return (
    <span aria-hidden="true" className="flex h-1.5 w-full gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="h-full flex-1 rounded-full"
          style={{ backgroundColor: i < correct ? 'var(--color-accent)' : 'var(--color-line)' }}
        />
      ))}
    </span>
  );
}
