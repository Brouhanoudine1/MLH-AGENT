import Link from "next/link";
import Reveal from "@/components/Reveal";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

const OUTILS = [
  {
    numero: "01",
    titre: "Créer un CV",
    texte:
      "Transformez votre parcours en un CV clair : en-tête, profil, expériences, formation et compétences.",
  },
  {
    numero: "02",
    titre: "Corriger un CV",
    texte:
      "Obtenez un score, des points forts, des faiblesses priorisées et des reformulations Avant / Après.",
  },
  {
    numero: "03",
    titre: "Lettre de motivation",
    texte:
      "Une lettre de 300 à 350 mots, liée au poste, sans formules creuses, prête à personnaliser.",
  },
  {
    numero: "04",
    titre: "Préparer l'entretien",
    texte:
      "Huit questions probables, des réponses en méthode STAR, et ce qu'il faut vérifier avant le jour J.",
  },
  {
    numero: "05",
    titre: "Simulateur de recruteur",
    texte:
      "Un entretien réaliste, une question à la fois, puis un débrief honnête : prêt, à retravailler ou à renforcer.",
  },
];

const ETAPES = [
  {
    numero: "1",
    titre: "Collez votre matière",
    texte: "CV, offre d'emploi ou notes de parcours. Tout reste dans votre navigateur.",
  },
  {
    numero: "2",
    titre: "Choisissez un outil",
    texte: "Cinq modules, un objectif chacun. L'IA ne travaille que sur ce que vous donnez.",
  },
  {
    numero: "3",
    titre: "Reprenez, copiez, partez",
    texte: "Corrigez, copiez, relancez. Rien n'est stocké. Vous repartez avec un texte à vous.",
  },
];

const MARQUEE = [
  "Créer un CV",
  "Corriger",
  "Lettre de motivation",
  "Entretien STAR",
  "Simulateur",
  "Sans compte",
  "Rien n'est inventé",
  "Rien n'est sauvegardé",
];

export default function Accueil() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="orb orb-gold top-[-6rem] right-[8%] hidden h-64 w-64 sm:block" />
          <div className="orb orb-forest top-[18%] left-[-5rem] hidden h-72 w-72 sm:block" />
          <div className="orb orb-clay bottom-[-4rem] right-[28%] hidden h-52 w-52 sm:block" />

          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12 lg:px-8 lg:py-24">
            <div>
              <p className="hero-kicker text-xs font-semibold tracking-[0.22em] text-clay uppercase sm:text-sm">
                Coach emploi
              </p>
              <h1 className="hero-title mt-4 font-serif text-[2rem] leading-[1.15] text-ink sm:text-5xl lg:text-6xl">
                Le site qui prépare votre candidature{" "}
                <span className="italic text-forest">sans inventer</span> votre
                parcours.
          </h1>
              <p className="hero-text mt-5 max-w-xl text-base leading-7 text-muted sm:mt-6 sm:text-lg sm:leading-8">
                JobCoach AI aide les chercheurs d&apos;emploi à rédiger un CV, une
                lettre de motivation et à se préparer à l&apos;entretien. L&apos;assistant
                s&apos;appuie uniquement sur vos informations. Si quelque chose
                manque, il le dit.
              </p>
              <div className="hero-actions mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <Link
                  href="/coach"
                  className="btn-shine inline-flex items-center justify-center rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition hover:bg-forest-light hover:scale-[1.03]"
                >
                  Ouvrir l&apos;assistant
                </Link>
                <a
                  href="#outils"
                  className="inline-flex items-center justify-center rounded-full border border-ink/15 bg-cream px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink/30 hover:scale-[1.03]"
                >
                  Découvrir les outils
                </a>
              </div>
              <dl className="hero-stats mt-8 grid max-w-lg grid-cols-3 gap-2 border-t border-sand pt-5 sm:mt-10 sm:gap-4 sm:pt-6">
                <div>
                  <dt className="text-[10px] tracking-wide text-muted uppercase sm:text-xs">Outils</dt>
                  <dd className="mt-1 font-serif text-2xl text-ink sm:text-3xl">5</dd>
                </div>
                <div>
                  <dt className="text-[10px] tracking-wide text-muted uppercase sm:text-xs">Compte</dt>
                  <dd className="mt-1 font-serif text-2xl text-ink sm:text-3xl">0</dd>
                </div>
                <div>
                  <dt className="text-[10px] tracking-wide text-muted uppercase sm:text-xs">Sauvegarde</dt>
                  <dd className="mt-1 font-serif text-xl text-ink sm:text-3xl">Aucune</dd>
                </div>
              </dl>
            </div>

            <aside className="hero-card relative min-w-0">
              <div className="hero-card-float rounded-[1.5rem] border border-sand bg-cream p-5 shadow-[0_24px_60px_rgba(28,25,21,0.08)] sm:rounded-[2rem] sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">
                    Aperçu
                  </p>
                  <span className="inline-flex items-center gap-2 text-xs text-muted">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-clay" />
                    </span>
                    Sans compte
                  </span>
                </div>
                <p className="mt-3 font-serif text-2xl text-ink">
                  Ce que l&apos;assistant refuse de faire
                </p>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-muted">
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                    Inventer une expérience, un diplôme ou un chiffre
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                    Garder votre CV sur un serveur
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                    Vous noyer sous des phrases toutes faites
                  </li>
                </ul>
                <div className="mt-6 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-muted">
                      <span>Fidélité au parcours</span>
                      <span>100%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
                      <div className="score-bar h-full w-full rounded-full bg-forest" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted">
                      <span>Phrases inventées</span>
                      <span>0</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
                      <div className="h-full w-0 rounded-full bg-clay" />
                    </div>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl bg-forest px-5 py-4 text-cream">
                  <p className="font-serif text-lg">Honnête, puis utile.</p>
                  <p className="mt-1 text-sm leading-6 text-cream/75">
                    Si une information manque, JobCoach AI la signale au lieu de
                    la deviner.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <div className="overflow-hidden border-y border-sand bg-forest py-4 text-cream">
          <div className="marquee-track gap-10 pr-10 text-sm tracking-[0.18em] uppercase">
            {[...MARQUEE, ...MARQUEE].map((item, index) => (
              <span key={`${item}-${index}`} className="flex items-center gap-10">
                {item}
                <span className="h-1 w-1 rounded-full bg-gold" />
              </span>
            ))}
          </div>
        </div>

        <section id="outils" className="scroll-mt-20 bg-cream/60">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <Reveal>
              <p className="text-sm font-semibold tracking-[0.22em] text-clay uppercase">
                Cinq outils
              </p>
              <h2 className="mt-3 font-serif text-[1.75rem] leading-tight text-ink sm:text-4xl">
                Un site pensé pour chaque étape de la candidature.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
                Vous n&apos;avez pas besoin de cinq applications. JobCoach AI
                rassemble ce qu&apos;un chercheur d&apos;emploi prépare vraiment :
                le document, la lettre, puis la voix.
              </p>
            </Reveal>

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {OUTILS.map((outil, index) => (
                <Reveal key={outil.numero} delay={index * 90}>
                  <article className="card-lift flex h-full flex-col rounded-3xl border border-sand bg-cream p-6">
                    <span className="font-serif text-sm text-gold">{outil.numero}</span>
                    <h3 className="mt-3 font-serif text-2xl text-ink">{outil.titre}</h3>
                    <p className="mt-3 flex-1 text-sm leading-7 text-muted">{outil.texte}</p>
                  </article>
                </Reveal>
              ))}
              <Reveal delay={450}>
                <article className="card-lift flex h-full flex-col justify-between rounded-3xl bg-forest p-6 text-cream md:col-span-2 lg:col-span-1">
                  <div>
                    <p className="font-serif text-2xl">Prêt à essayer ?</p>
                    <p className="mt-3 text-sm leading-7 text-cream/75">
                      Aucune inscription. Collez un texte, choisissez un outil,
                      obtenez une première version.
                    </p>
                  </div>
                  <Link
                    href="/coach"
                    className="btn-shine mt-6 inline-flex w-fit items-center rounded-full bg-cream px-4 py-2 text-sm font-semibold text-forest transition hover:scale-[1.03]"
                  >
                    Lancer l&apos;assistant
                  </Link>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        <section id="methode" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <Reveal>
            <p className="text-sm font-semibold tracking-[0.22em] text-clay uppercase">
              Comment ça marche
            </p>
            <h2 className="mt-3 font-serif text-[1.75rem] leading-tight text-ink sm:text-4xl">
              Trois gestes. Pas de compte, pas de fichier oublié.
            </h2>
          </Reveal>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {ETAPES.map((etape, index) => (
              <li key={etape.numero}>
                <Reveal delay={index * 120}>
                  <div className="relative border-t border-gold/50 pt-6">
                    <span className="font-serif text-5xl text-sand">{etape.numero}</span>
                    <h3 className="mt-4 font-serif text-2xl text-ink">{etape.titre}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted">{etape.texte}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <section id="promesse" className="relative scroll-mt-20 overflow-hidden bg-forest text-cream">
          <div className="orb orb-gold top-[-5rem] left-[10%] h-56 w-56 opacity-40" />
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-8 lg:py-20">
            <Reveal>
              <p className="text-sm font-semibold tracking-[0.22em] text-gold uppercase">
                Notre promesse
              </p>
              <h2 className="mt-3 font-serif text-[1.75rem] leading-tight sm:text-4xl">
                Un coach exigeant, pas un générateur de fiction.
              </h2>
              <p className="mt-5 text-base leading-8 text-cream/75">
                Beaucoup d&apos;outils remplissent les blancs pour faire joli.
                JobCoach AI fait l&apos;inverse : il reste fidèle à votre
                expérience, signale ce qui manque, et vous laisse le dernier mot.
              </p>
            </Reveal>
            <ul className="space-y-4">
              <li>
                <Reveal delay={80}>
                  <div className="rounded-2xl border border-cream/15 bg-cream/5 p-5 transition hover:border-gold/50 hover:bg-cream/10">
                    <p className="font-serif text-xl">Pas d&apos;invention</p>
                    <p className="mt-2 text-sm leading-6 text-cream/70">
                      Aucune entreprise, compétence ou résultat chiffré n&apos;est
                      ajouté s&apos;il n&apos;est pas dans vos textes.
                    </p>
                  </div>
                </Reveal>
              </li>
              <li>
                <Reveal delay={160}>
                  <div className="rounded-2xl border border-cream/15 bg-cream/5 p-5 transition hover:border-gold/50 hover:bg-cream/10">
                    <p className="font-serif text-xl">Pas de trace</p>
                    <p className="mt-2 text-sm leading-6 text-cream/70">
                      Pas de base de données, pas d&apos;historique. Fermer la page
                      suffit à tout effacer.
                    </p>
                  </div>
                </Reveal>
              </li>
              <li>
                <Reveal delay={240}>
                  <div className="rounded-2xl border border-cream/15 bg-cream/5 p-5 transition hover:border-gold/50 hover:bg-cream/10">
                    <p className="font-serif text-xl">Un ton direct</p>
                    <p className="mt-2 text-sm leading-6 text-cream/70">
                      Bienveillant, mais honnête. Un débrief peut conclure
                      « à retravailler » si c&apos;est le cas.
                    </p>
                  </div>
                </Reveal>
              </li>
            </ul>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <Reveal>
            <div className="rounded-[1.5rem] bg-cream px-5 py-10 text-center shadow-[0_24px_60px_rgba(28,25,21,0.06)] sm:rounded-[2rem] sm:px-12 sm:py-12">
              <h2 className="font-serif text-[1.75rem] leading-tight text-ink sm:text-4xl">
                Votre prochaine candidature mérite mieux qu&apos;un modèle vide.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted">
                Ouvrez l&apos;assistant, collez ce que vous avez déjà, et repartez
                avec un texte utilisable — CV, lettre ou préparation d&apos;entretien.
              </p>
              <Link
                href="/coach"
                className="btn-shine mt-8 inline-flex items-center rounded-full bg-clay px-7 py-3 text-sm font-semibold text-cream transition hover:scale-[1.04] hover:bg-[#b05020]"
              >
                Commencer maintenant
              </Link>
        </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
