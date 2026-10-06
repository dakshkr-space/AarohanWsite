import { CarAnimation } from "@/components/CarAnimation";
import { LandingHero } from "@/components/LandingHero";
import { allClubsData } from "@/data";

export default function Home() {
  return (
    <main>
      <LandingHero />
      <CarAnimation clubs={allClubsData} />
    </main>
  );
}
