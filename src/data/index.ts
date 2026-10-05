import { ClubData } from "./types";
import { glugData } from "./clubs/glug";
import { mntcData } from "./clubs/mntc";
import { saeData } from "./clubs/sae";
import { ccaData } from "./clubs/cca";
import { recursionData } from "./clubs/recursion";

// The order of this array dictates the order the car drives through them
export const allClubsData: ClubData[] = [
  mntcData,
  glugData,
  saeData,
  ccaData,
  recursionData,
];