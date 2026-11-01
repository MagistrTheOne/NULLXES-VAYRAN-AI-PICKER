"use client";

import Image from "next/image";
import { useState } from "react";
import type { Hero } from "@/lib/heroes";

export function HeroPortrait({ hero, className = "" }: { hero: Hero; className?: string }) {
  const [failedSlug, setFailedSlug] = useState<string>();
  const slug = hero.providerSlug ?? hero.id;
  return <span className={`hero-portrait ${className}`} aria-hidden="true">
    <span className="portrait-fallback">{hero.name.slice(0, 2).toUpperCase()}</span>
    {slug && failedSlug !== slug && <Image key={slug} src={`/api/portraits/${encodeURIComponent(slug)}`} alt="" width={96} height={96} loading="lazy" unoptimized onError={() => setFailedSlug(slug)} />}
  </span>;
}
