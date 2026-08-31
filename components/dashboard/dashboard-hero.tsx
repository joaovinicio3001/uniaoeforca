import Image from "next/image";

/** Ilustração decorativa do topo do painel. Só aparece em telas médias+. */
export function DashboardHero() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -top-4 right-0 hidden xl:block"
    >
      <div className="relative size-40 lg:size-48">
        <span className="absolute right-4 top-0 size-24 rounded-full bg-[#EAF2FF] lg:size-28" />
        <span className="absolute bottom-2 right-24 size-14 rounded-full bg-[#EAF9EF] lg:size-16" />
        <span className="absolute right-2 top-12 size-2 rounded-full bg-[#FFB800]" />
        <span className="absolute right-28 top-6 size-1.5 rounded-full bg-[#23B64B]" />
        <span className="absolute right-10 top-2 size-1.5 rounded-full bg-[#9747FF]" />
        <Image
          src="/logo-mark.png"
          alt=""
          width={160}
          height={160}
          className="absolute right-3 top-4 size-28 object-contain lg:size-32"
        />
      </div>
    </div>
  );
}
