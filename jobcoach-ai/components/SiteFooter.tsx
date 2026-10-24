import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-sand bg-forest text-cream">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="font-serif text-2xl">JobCoach AI</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-cream/75">
            Assistant pour chercheurs d&apos;emploi. Rien n&apos;est sauvegardé,
            aucun compte n&apos;est requis.
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-cream/80">
          <Link href="/" prefetch={false} className="nav-link hover:text-cream">
            Accueil
          </Link>
          <Link href="/coach" prefetch={false} className="nav-link hover:text-cream">
            Assistant
          </Link>
          <Link href="/#outils" prefetch={false} className="nav-link hover:text-cream">
            Outils
          </Link>
        </div>
      </div>
    </footer>
  );
}
