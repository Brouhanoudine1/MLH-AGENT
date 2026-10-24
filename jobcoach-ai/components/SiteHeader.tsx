"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SiteHeaderProps = {
  variant?: "home" | "app";
};

let headerHasEntered = false;

export default function SiteHeader({ variant = "home" }: SiteHeaderProps) {
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [enter] = useState(() => {
    if (headerHasEntered) {
      return false;
    }
    headerHasEntered = true;
    return true;
  });

  useEffect(() => {
    function onScroll() {
      setCompact(window.scrollY > 16);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header
      className={`${enter ? "header-enter" : ""} sticky top-0 z-30 border-b backdrop-blur-md transition-all duration-500 ${
        compact
          ? "border-sand bg-paper/95 shadow-[0_8px_30px_rgba(28,25,21,0.06)]"
          : "border-transparent bg-paper/80"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" prefetch={false} className="group flex min-w-0 items-center gap-2.5 text-ink sm:gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold tracking-tight text-cream transition-transform duration-500 group-hover:rotate-12">
            JC
          </span>
          <span className="truncate font-serif text-lg tracking-tight sm:text-xl">
            JobCoach AI
          </span>
        </Link>

        {variant === "home" ? (
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#outils" className="nav-link transition-colors hover:text-ink">
              Outils
            </a>
            <a href="#methode" className="nav-link transition-colors hover:text-ink">
              Méthode
            </a>
            <a href="#promesse" className="nav-link transition-colors hover:text-ink">
              Promesse
            </a>
          </nav>
        ) : (
          <nav className="hidden items-center text-sm text-muted sm:flex">
            <Link href="/" prefetch={false} className="nav-link transition-colors hover:text-ink">
              Accueil
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {variant === "home" ? (
            <Link
              href="/coach"
              prefetch={false}
              className="btn-shine hidden items-center rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream transition hover:bg-forest-light hover:scale-[1.03] sm:inline-flex"
            >
              Commencer
            </Link>
          ) : (
            <Link
              href="/"
              prefetch={false}
              className="rounded-full border border-ink/15 bg-cream px-3 py-2 text-sm font-semibold text-ink transition hover:border-ink/30 sm:hidden"
            >
              Accueil
            </Link>
          )}

          {variant === "home" ? (
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand bg-cream text-ink md:hidden"
              aria-expanded={menuOpen}
              aria-controls="menu-mobile"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="flex w-4 flex-col gap-1">
                <span
                  className={`h-px w-full bg-ink transition ${menuOpen ? "translate-y-[5px] rotate-45" : ""}`}
                />
                <span className={`h-px w-full bg-ink transition ${menuOpen ? "opacity-0" : ""}`} />
                <span
                  className={`h-px w-full bg-ink transition ${menuOpen ? "-translate-y-[5px] -rotate-45" : ""}`}
                />
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {variant === "home" && menuOpen ? (
        <div
          id="menu-mobile"
          className="border-t border-sand bg-paper px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-3 text-sm text-ink">
            <a href="#outils" onClick={() => setMenuOpen(false)} className="py-1">
              Outils
            </a>
            <a href="#methode" onClick={() => setMenuOpen(false)} className="py-1">
              Méthode
            </a>
            <a href="#promesse" onClick={() => setMenuOpen(false)} className="py-1">
              Promesse
            </a>
            <Link
              href="/coach"
              prefetch={false}
              onClick={() => setMenuOpen(false)}
              className="mt-1 inline-flex items-center justify-center rounded-full bg-forest px-4 py-2.5 text-sm font-semibold text-cream"
            >
              Commencer
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
