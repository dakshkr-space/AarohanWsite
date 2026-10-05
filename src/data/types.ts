export interface EventItem {
  id: string;
  number: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
}

export interface ClubData {
  id: string;
  name: string;
  logo: string; // Added logo, removed themeColor
  events: EventItem[];
}