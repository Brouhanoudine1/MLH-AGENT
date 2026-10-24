import CoachWorkspace from "@/components/CoachWorkspace";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "Espace de travail",
  description:
    "Espace JobCoach AI : créez un CV, corrigez-le, rédigez une lettre et préparez l'entretien.",
};

export default function CoachPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader variant="app" />
      <main className="relative flex-1 overflow-x-hidden">
        <div className="orb orb-gold top-[-8rem] right-[12%] hidden h-64 w-64 opacity-50 sm:block" />
        <div className="orb orb-forest bottom-[-6rem] left-[-4rem] hidden h-72 w-72 sm:block" />
        <CoachWorkspace />
      </main>
      <SiteFooter />
    </div>
  );
}
