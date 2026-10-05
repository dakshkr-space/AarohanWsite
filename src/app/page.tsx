import { CarAnimation } from "@/components/CarAnimation";
import { allClubsData } from "@/data";

export default function Home() {
  return (
    <main>
      {/* Update CarAnimation to accept 'clubs' instead of 'events' */}
      <CarAnimation clubs={allClubsData} />
    </main>
  );
}