/**
 * Decorul modului Junior.
 *
 * Cercetarea pe cititori mici spune limpede două lucruri care par să se bată
 * cap în cap: textul trebuie să fie cât se poate de simplu și de deschis
 * (literele groase și rotunde încetinesc cititul), dar ecranul trebuie să arate
 * a joc, nu a formular. Împăcarea lor: litera rămâne curată — Lexend, desenat
 * anume pentru viteza de citire a copiilor — iar veselia vine din decor:
 * ghirlandă de stegulețe, baloane, dungi de bâlci și confetti.
 *
 * Toate elementele de aici sunt pur ornamentale: `aria-hidden`, fără rol în
 * transmiterea vreunei informații. Culorile decorative nu se ating niciodată de
 * verdele „corect” și de roșul „greșit”, ca semnalele să rămână neconfundabile.
 */

/** Cinci culori plate, alese să nu semene nici cu verdele, nici cu roșul. */
export const KID_COLORS = ['#3ba5ff', '#ffd23f', '#ff9a3c', '#ff7ac8', '#39d5d5'] as const;

export function kidColor(index: number): string {
  return KID_COLORS[((index % KID_COLORS.length) + KID_COLORS.length) % KID_COLORS.length]!;
}

/**
 * Ghirlanda de stegulețe de sub bara de progres. Sfoara coboară puțin la
 * mijloc, ca una adevărată, iar stegulețele atârnă de-a lungul ei.
 */
export function Bunting({ count = 14 }: { count?: number }) {
  const width = 100;
  const dip = 3.2;

  // Sfoara: o curbă lină între cele două capete, cu burta în jos.
  const path = `M0 1 Q ${width / 2} ${1 + dip * 2} ${width} 1`;

  const flags = Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    const x = t * width;
    // Înălțimea sforii în punctul x, după formula curbei pătratice.
    const y = (1 - t) * (1 - t) * 1 + 2 * (1 - t) * t * (1 + dip * 2) + t * t * 1;
    const half = (width / count) * 0.38;
    return (
      <polygon
        key={i}
        points={`${x - half},${y} ${x + half},${y} ${x},${y + 5.6}`}
        fill={kidColor(i)}
      />
    );
  });

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} 12`}
      preserveAspectRatio="none"
      className="pointer-events-none block h-3 w-full sm:h-[0.9rem]"
    >
      <path d={path} fill="none" stroke="var(--color-line-hi)" strokeWidth="0.5" />
      {flags}
    </svg>
  );
}

/**
 * Balonul cu numărul întrebării. Ține locul cifrei-fantomă din modul obișnuit:
 * acolo e un număr uriaș, decolorat, aici e un obiect vesel, dar tot decor.
 */
export function Balloon({
  value,
  index,
  className = '',
}: {
  value: number | string;
  index: number;
  className?: string;
}) {
  const color = kidColor(index);

  return (
    <span aria-hidden="true" className={`kid-balloon pointer-events-none absolute ${className}`}>
      <svg viewBox="0 0 100 132" className="h-full w-full overflow-visible">
        {/* Sfoara, o buclă simplă. */}
        <path
          d="M50 104 q -7 10 0 16 q 7 6 0 12"
          fill="none"
          stroke="var(--color-line-hi)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <ellipse cx="50" cy="52" rx="44" ry="52" fill={color} />
        {/* Lumina de pe balon: o pată albă, fără degrade. */}
        <ellipse cx="33" cy="34" rx="12" ry="17" fill="#ffffff" opacity="0.34" />
        <polygon points="44,101 56,101 50,110" fill={color} />
        <text
          x="50"
          y="53"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#0b0b10"
          fontSize="42"
          fontWeight="700"
          fontFamily="var(--font-body)"
        >
          {value}
        </text>
      </svg>
    </span>
  );
}

/**
 * Ciorchine de baloane, pur ornamental, pentru ecranul de rezultate.
 * Nu poartă niciun număr: acolo cifra mare a scorului e deja eroul paginii.
 */
export function BalloonCluster({ className = '' }: { className?: string }) {
  const balloons = [
    { x: 0, y: 8, size: 46, tone: 0, delay: '0s' },
    { x: 38, y: 0, size: 58, tone: 1, delay: '0.6s' },
    { x: 82, y: 14, size: 40, tone: 3, delay: '1.2s' },
  ];

  return (
    <span
      aria-hidden="true"
      // Cutie cu dimensiuni fixe: fără ea, baloanele ies din pagină pe telefon
      // și apare o bară de derulare orizontală acolo unde nu are ce căuta.
      style={{ width: 124, height: 100 }}
      className={`pointer-events-none absolute block overflow-hidden ${className}`}
    >
      {balloons.map((b) => (
        <span
          key={b.tone}
          className="kid-balloon absolute"
          style={{ left: `${b.x}px`, top: `${b.y}px`, animationDelay: b.delay }}
        >
          <svg width={b.size} height={b.size * 1.32} viewBox="0 0 100 132">
            <path
              d="M50 104 q -7 10 0 16 q 7 6 0 12"
              fill="none"
              stroke="var(--color-line-hi)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <ellipse cx="50" cy="52" rx="44" ry="52" fill={kidColor(b.tone)} />
            <ellipse cx="33" cy="34" rx="12" ry="17" fill="#ffffff" opacity="0.34" />
            <polygon points="44,101 56,101 50,110" fill={kidColor(b.tone)} />
          </svg>
        </span>
      ))}
    </span>
  );
}

/**
 * Explozia de confetti la răspuns corect. Se desenează o singură dată, la
 * apariția componentei, și dispare singură. La `prefers-reduced-motion` nu se
 * randează deloc — nu e informație, deci nu se pierde nimic.
 */
export function Confetti({ reduceMotion }: { reduceMotion: boolean }) {
  if (reduceMotion) return null;

  const pieces = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2 + (i % 3) * 0.22;
    const distance = 58 + (i % 5) * 18;
    const round = i % 3 === 0;
    return (
      <span
        key={i}
        className="kid-confetti-piece"
        style={
          {
            backgroundColor: kidColor(i),
            borderRadius: round ? '999px' : '2px',
            '--dx': `${Math.cos(angle) * distance}px`,
            '--dy': `${Math.sin(angle) * distance - 24}px`,
            '--spin': `${(i % 2 ? 1 : -1) * (140 + i * 18)}deg`,
            animationDelay: `${(i % 6) * 18}ms`,
          } as React.CSSProperties
        }
      />
    );
  });

  return (
    <span aria-hidden="true" className="kid-confetti">
      {pieces}
    </span>
  );
}
