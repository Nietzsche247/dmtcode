// Mirror of src/data/kits.ts. Edge functions cannot import from src/. scripts/check-kits-drift.mjs fails the build if these drift. Edit src/data/kits.ts first, then copy here.

export type Kit = {
  id: 'solo' | 'triad' | 'circle';
  name: string;
  shortName: string;
  observers: string;
  price: string;
  priceNumber: number;
  cart: string;
  image: string | null;
  diyCost: string;
  diyCostNumber: number;
  availability: string;
  description: string;
};

export const KITS: Kit[] = [
  {
    id: 'solo',
    name: '650 nm Laser Diffraction Research Kit — Solo (1 Observer)',
    shortName: 'Solo',
    observers: '1',
    price: '$289',
    priceNumber: 289,
    cart: 'https://dmtcode-p4szt.myshopify.com/cart/54376696709430:1',
    image: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/kit-solo.jpg',
    diyCost: '$219',
    diyCostNumber: 219,
    availability: 'Ships in 7 to 10 business days. Free US shipping. 18+, for research use.',
    description:
      'Optical research kit for one observer: a 650 nm laser module, diffraction optics, and printed observation materials for educational study of laser diffraction patterns.',
  },
  {
    id: 'triad',
    name: 'Multi-Wavelength Laser Diffraction Research Kit — Triad (2–3 Observers)',
    shortName: 'Triad',
    observers: '2 to 3',
    price: '$649',
    priceNumber: 649,
    cart: 'https://dmtcode-p4szt.myshopify.com/cart/54376697692470:1',
    image: null,
    diyCost: '$516',
    diyCostNumber: 516,
    availability: 'Ships in 7 to 10 business days. Free US shipping. 18+, for research use.',
    description:
      'Optical research kit for two to three observers: multi-wavelength laser modules including 650 nm, diffraction optics, and printed observation materials for educational study of laser diffraction patterns.',
  },
  {
    id: 'circle',
    name: 'Multi-Wavelength Laser Diffraction Research Kit — Circle (6 Observers)',
    shortName: 'Circle',
    observers: '6',
    price: '$1,090',
    priceNumber: 1090,
    cart: 'https://dmtcode-p4szt.myshopify.com/cart/54376698446134:1',
    image: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/kit-circle.jpg',
    diyCost: '$883',
    diyCostNumber: 883,
    availability: 'Ships in 7 to 10 business days. Free US shipping. 18+, for research use.',
    description:
      'Optical research kit for six observers: multi-wavelength laser modules including 650 nm, diffraction optics, and printed observation materials for educational study of laser diffraction patterns.',
  },
];
