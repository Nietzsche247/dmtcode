// Single source of truth for the four research kits.
// netlify/lib/kits.ts is a byte-equivalent mirror for edge functions.
// scripts/check-kits-drift.mjs fails the build if these two drift.

export type Kit = {
  id: 'solo' | 'dual' | 'triad' | 'circle';
  sku?: string;
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

const AVAIL = 'Arrives in 7 to 10 business days. Free US shipping. 18+, for research use.';

export const KITS: Kit[] = [
  {
    id: 'solo',
    sku: 'KIT-SOLO-650',
    name: '650 nm Laser Diffraction Research Kit, Solo (1 Observer)',
    shortName: 'Solo',
    observers: '1',
    price: '$289',
    priceNumber: 289,
    cart: 'https://dmtcode-p4szt.myshopify.com/cart/54376696709430:1',
    image: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/solo_unboxed.jpg',
    diyCost: '$155',
    diyCostNumber: 155,
    availability: AVAIL,
    description:
      'One observer. Contents: 650 nm deluxe red laser pointer, under 5 mW (Arbor Scientific P2-7500); adjustable laser pointer stand (92-7660); three window diffraction grating, 100, 300 and 600 lines per mm (P3-6405); holographic gratings, 500 and 1000 lines per mm, five of each (33-0985, 33-0990); giant acrylic lens and prism set of 7 (92-1460). The 75 mm semicircle in the acrylic set is the piece that turns the laser dot into a continuous line on the wall: flat face toward the laser. Observation documents are free PDF downloads.',
  },
  {
    id: 'dual',
    sku: 'KIT-DUAL-MW',
    name: 'Laser Diffraction Research Kit, Dual (650 and 532 nm, 1 to 2 Observers)',
    shortName: 'Dual',
    observers: '1 to 2',
    price: '$399',
    priceNumber: 399,
    cart: 'https://dmtcode-p4szt.myshopify.com/cart/54434179973430:1',
    image: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7679DualRed-GreenLaserPointer-022048x2048.jpg',
    diyCost: '$215',
    diyCostNumber: 215,
    availability: AVAIL,
    description:
      "The Solo bench with a switchable 650 nm red and 532 nm green pointer (Arbor P2-7679) so the same observation can be compared at two wavelengths. Adds Young's slit cards, three per pack (33-0240). Includes stand, three window grating, holographic gratings and the acrylic set with the semicircle line maker. Observation documents are free PDF downloads.",
  },
  {
    id: 'triad',
    sku: 'KIT-TRIAD-MW',
    name: 'Laser Diffraction Research Kit, Triad (650 and 405 nm, 2 to 3 Observers)',
    shortName: 'Triad',
    observers: '2 to 3',
    price: '$699',
    priceNumber: 699,
    cart: 'https://dmtcode-p4szt.myshopify.com/cart/54376697692470:1',
    image: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7680LaserRayBoxwithLenses2048x2048_c5e1df26-5de3-492b-97a2-dc948b077723.jpg',
    diyCost: '$342',
    diyCostNumber: 342,
    availability: AVAIL,
    description:
      'Two to three observers. Contents: 650 nm laser ray box with 1, 3 or 5 beams and its own 8 piece acrylic optics set (Arbor P2-7680); 405 nm violet pointer (P2-7678); two adjustable stands; three window grating; holographic gratings; Young\'s slit cards; slide carrier (92-7671); 50 slide mounted polarizers (P2-9405). The semicircle lens in the ray box case is the line maker. The ray box is under 1 mW, so dim the room for the wall line. Observation documents are free PDF downloads.',
  },
  {
    id: 'circle',
    sku: 'KIT-CIRCLE-MW',
    name: 'Laser Diffraction Research Kit, Circle (650, 532 and 405 nm, Up to 6 Observers)',
    shortName: 'Circle',
    observers: 'up to 6',
    price: '$1,090',
    priceNumber: 1090,
    cart: 'https://dmtcode-p4szt.myshopify.com/cart/54376698446134:1',
    image: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7680LaserRayBoxwithLenses2048x2048_5efaa11c-9785-4d65-bb76-6dff2034df3b.jpg',
    diyCost: '$442',
    diyCostNumber: 442,
    availability: AVAIL,
    description:
      'Up to six observers. Everything in the Triad plus a switchable 650 and 532 nm pointer (P2-7679), a third stand, a second slide carrier and a handheld quantitative spectroscope (P2-7061), so three sources cover 650, 532 and 405 nm. The semicircle lens in the ray box case is the line maker. Observation documents are free PDF downloads.',
  },
];

export const KIT_MIN_PRICE = KITS[0].priceNumber;
export const KIT_MAX_PRICE = KITS[KITS.length - 1].priceNumber;
export const KIT_PRICE_RANGE = `${KITS[0].price} to ${KITS[KITS.length - 1].price}`;
