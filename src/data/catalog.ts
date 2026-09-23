import raw from './catalog.json';

export interface DressImage {
  src: string;
  sm: string;
  w: number;
  h: number;
}

export interface Cutout {
  src: string;
  w: number;
  h: number;
}

export type Category = 'gowns' | 'mini' | 'black' | 'tv';

export interface Dress {
  id: string;
  code: string;
  name: string;
  color: string;
  cats: Category[];
  feature: boolean;
  tryon: boolean;
  cutout: Cutout | null;
  caption: string;
  permalink: string;
  images: DressImage[];
}

export interface Asset {
  src: string;
  sm: string;
  w: number;
  h: number;
  alt: string;
  permalink: string;
}

interface CatalogFile {
  count: number;
  assets: Record<string, Asset>;
  items: Dress[];
}

const data = raw as unknown as CatalogFile;

export const dresses: Dress[] = data.items;
export const assets = data.assets;
export const featured: Dress[] = dresses.filter((d) => d.feature);

export function byId(id: string): Dress | undefined {
  return dresses.find((d) => d.id === id);
}

export const categories: { key: Category | 'all'; label: string }[] = [
  { key: 'all', label: 'All dresses' },
  { key: 'gowns', label: 'Gowns' },
  { key: 'mini', label: 'Mini & midi' },
  { key: 'black', label: 'Black' },
  { key: 'tv', label: 'Seen on TV' },
];
