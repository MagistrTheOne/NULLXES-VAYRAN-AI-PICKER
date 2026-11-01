export const ROLES = ["EXP", "JUNGLE", "MID", "GOLD", "ROAM"] as const;
export type Role = (typeof ROLES)[number];
export const RANKS = [
  "Legend",
  "Mythic",
  "Mythical Honor",
  "Mythical Glory",
  "Mythical Immortal",
] as const;
export type Rank = (typeof RANKS)[number];
export type Hero = {
  id: string;
  name: string;
  roles: Role[];
  providerSlug?: string;
  classes?: string[];
  title?: string;
  specialties?: string[];
};

// Manually transcribed identities, not rankings or statistical recommendations.
// Retrieved 2026-10-29 from the public MLBB.GG pages listed below.
export const CATALOG_SOURCES = [
  {
    label: "Hero identities",
    url: "https://mlbb.gg/tierlist",
    updated: "2026-10-28",
  },
  {
    label: "EXP lanes",
    url: "https://mlbb.gg/tierlist?lane=Exp+Lane",
    updated: "2026-10-22",
  },
  {
    label: "Jungle lanes",
    url: "https://mlbb.gg/tierlist?lane=Jungle",
    updated: "2026-10-17",
  },
  {
    label: "Mid lanes",
    url: "https://mlbb.gg/tierlist?lane=Mid+Lane",
    updated: "2026-10-17",
  },
  {
    label: "Roam lanes",
    url: "https://mlbb.gg/tierlist?lane=Roam",
    updated: "2026-10-08",
  },
  {
    label: "Gold lanes · partial",
    url: "https://mlbb.gg/counter/obsidia",
    updated: "2026-10-27",
  },
] as const;

const laneNames: Record<Role, string> = {
  EXP: "Belerick|Gloo|Masha|Aulus|Sun|Lukas|Paquito|Carmilla|Minotaur|Atlas|Argus|Alice|Hilda|Badang|Minsitthar|Silvanna|Barats|Edith|Benedetta|Guinevere|X.Borg|Aldous|Dyrroth|Terizla|Khaleed|Sora|Thamuz|Leomord|Cici|Ruby|Yu Zhong|Uranus|Esmeralda|Hylos|Lapu-Lapu|Freya|Chou|Martis|Phoveus|Arlott|Zilong|Gatotkaca|Valentina",
  JUNGLE:
    "Hirara|Aulus|Lukas|Paquito|Sun|Saber|Barats|Nolan|Ling|Hanzo|Yi Sun-shin|Guinevere|Cyclops|Gusion|Akai|X.Borg|Bane|Suyou|Fredrinn|Thamuz|Aamon|Julian|Dyrroth|Aldous|Hayabusa|Karina|Natalia|Leomord|Alucard|Uranus|Harley|Alpha|Roger|Yin|Helcurt|Martis|Balmond|Joy|Zilong|Baxia|Lancelot|Fanny",
  MID: "Eudora|Rafaela|Valir|Zetian|Alice|Novaria|Selena|Gord|Kadita|Zhask|Vexana|Kagura|Cyclops|Nana|Cecilion|Yve|Vale|Lylia|Xavier|Odette|Kimmy|Faramis|Aurora|Harley|Lunox|Chang'e|Zhuxin|Pharsa|Luo Yi|Valentina",
  GOLD: "Obsidia|Moskov|Irithel|Melissa|Miya|Clint|Bruno|Layla",
  ROAM: "Belerick|Marcel|Rafaela|Gloo|Estes|Carmilla|Floryn|Minotaur|Kaja|Atlas|Badang|Khufra|Angela|Diggie|Guinevere|Lolita|Minsitthar|Selena|Edith|Silvanna|Faramis|Akai|Natalia|Hilda|Nana|Arlott|Tigreal|Chou|Hylos|Helcurt|Johnson|Jawhead|Grock|Chip|Baxia|Mathilda|Kalea|Gatotkaca|Franco",
};
const names =
  "Belerick|Gloo|Eudora|Hirara|Estes|Obsidia|Masha|Sun|Marcel|Aulus|Saber|Rafaela|Lukas|Paquito|Floryn|Hanabi|Carmilla|Atlas|Minotaur|Valir|Argus|Miya|Hilda|Zetian|Angela|Alice|Lesley|Popol and Kupa|Layla|Minsitthar|Novaria|Khufra|Selena|Silvanna|Nolan|Badang|Barats|Lolita|Gord|Ling|Diggie|Kaja|Tigreal|Hanzo|Irithel|Kadita|Zhask|Vexana|Cyclops|Nana|Gusion|Kagura|Bruno|Guinevere|X.Borg|Edith|Benedetta|Brody|Aamon|Natalia|Yi Sun-shin|Aldous|Sora|Julian|Suyou|Khaleed|Akai|Bane|Karina|Clint|Thamuz|Ixia|Dyrroth|Terizla|Fredrinn|Moskov|Cecilion|Helcurt|Vale|Kalea|Johnson|Harley|Cici|Alpha|Lylia|Natan|Hayabusa|Yu Zhong|Yin|Claude|Beatrix|Kimmy|Esmeralda|Uranus|Alucard|Karrie|Hylos|Yve|Leomord|Aurora|Roger|Odette|Chang'e|Ruby|Chou|Xavier|Faramis|Lapu-Lapu|Jawhead|Zhuxin|Phoveus|Freya|Martis|Wanwan|Lunox|Balmond|Melissa|Grock|Luo Yi|Zilong|Arlott|Pharsa|Joy|Chip|Gatotkaca|Granger|Franco|Mathilda|Baxia|Harith|Lancelot|Valentina|Fanny";
export const HEROES: Hero[] = names
  .split("|")
  .sort((a, b) => a.localeCompare(b, "en"))
  .map((name) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    roles: ROLES.filter((role) => laneNames[role].split("|").includes(name)),
  }));
export const HERO_BY_ID = new Map(HEROES.map((hero) => [hero.id, hero]));
