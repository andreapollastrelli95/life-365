/* eslint-disable @next/next/no-img-element -- immagine statica piccola, non serve l'ottimizzazione di next/image */

/** Stemma LIFE 365: freccia tonda arcobaleno con la scritta dentro (lo stesso del volantino e delle icone). */
export function LogoMark({ size = 40 }: { size?: number }) {
  return <img src="/logo-life365.png" width={size} height={size} alt="" aria-hidden className="shrink-0" />;
}

/** Stemma grande, per la pagina di accesso. */
export function Logo() {
  return (
    <span className="flex flex-col items-center gap-1">
      <img src="/logo-life365.png" width={132} height={132} alt="LIFE 365" />
    </span>
  );
}
