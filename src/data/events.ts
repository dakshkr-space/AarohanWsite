export interface EventItem {
  id: string;
  number: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
}

export const eventsData: EventItem[] = [
  {
    id: "hackathon",
    number: "01",
    category: "FLAGSHIP",
    title: "HACKATHON",
    description: "24 hours of building, breaking and shipping. Teams from across the country compete for the grand prize.",
    tags: ["24 hrs", "Team of 4", "Prize pool"],
  },
  {
    id: "robo-race",
    number: "02",
    category: "ROBOTICS",
    title: "ROBO RACE",
    description: "Build autonomous bots and race them around a timed circuit. Speed, precision and good engineering decide the winner.",
    tags: ["Robotics", "Arena", "Live"],
  },
  {
    id: "ctf",
    number: "03",
    category: "SECURITY",
    title: "CAPTURE THE FLAG",
    description: "Solve puzzles, break challenges and climb the leaderboard in the online and onsite CTF.",
    tags: ["CTF", "Cyber", "Solo / Duo"],
  },
  {
    id: "talks-workshops",
    number: "04",
    category: "LEARN",
    title: "TALKS & WORKSHOPS",
    description: "Industry speakers, hands-on workshops and guest lectures on AI, web, hardware and more.",
    tags: ["Speakers", "Workshops", "Networking"],
  },
];