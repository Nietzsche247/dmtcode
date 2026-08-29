// Mirror of src/data/kits.ts. Edge functions cannot import from src/. scripts/check-kits-drift.mjs fails the build if these drift. Edit src/data/kits.ts first, then copy here.

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
  emitters: Emitter[];
};

// Vendor rated output and class per light source. Never collapse a multi emitter kit into one class line.
export type Emitter = {
  sku: string;
  name: string;
  wavelength_nm: string;
  vendor_output: string;
  vendor_class: string;
  vendor_url: string;
};

const P2_7500: Emitter = { sku: 'P2-7500', name: 'Deluxe Red Laser Pointer', wavelength_nm: '650', vendor_output: '5 mW', vendor_class: 'FDA IIIA', vendor_url: 'https://www.arborsci.com/products/standard-red-laser-pointer' };
const P2_7679: Emitter = { sku: 'P2-7679', name: 'Dual Red-Green Laser Pointer', wavelength_nm: '650 and 532', vendor_output: 'max 5 mW', vendor_class: 'FDA IIIA', vendor_url: 'https://www.arborsci.com/products/dual-red-green-laser' };
const P2_7680: Emitter = { sku: 'P2-7680', name: 'Laser Ray Box and Lenses', wavelength_nm: '650', vendor_output: '<1 mW', vendor_class: 'Laser class 3a', vendor_url: 'https://www.arborsci.com/products/laser-ray-box-and-lenses' };
const P2_7678: Emitter = { sku: 'P2-7678', name: 'Violet Laser Pointer', wavelength_nm: '401 (sold as 405)', vendor_output: '<5 mW', vendor_class: 'FDA IIIA', vendor_url: 'https://www.arborsci.com/products/violet-laser-pointer' };

const AVAIL = 'Arrives in 7 to 10 business days. Free US shipping. 18+, for research use.';

export const KITS: Kit[] = [
  {
    id: 'solo',
    sku: 'KIT-SOLO-650',
    emitters: [P2_7500],
    name: '650 nm Laser Diffraction Research Kit, Solo (1 Observer)',
    shortName: 'Solo',
    observers: '1',
    price: '$289',
    priceNumber: 289,
    cart: 'https://shop.dmtcode.com/cart/54376696709430:1',
    image: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/solo_unboxed.jpg',
    diyCost: '$155',
    diyCostNumber: 155,
    availability: AVAIL,
    description:
      'One observer. Contents: 650 nm deluxe red laser pointer, vendor rated 5 mW, FDA Class IIIa (Arbor Scientific P2-7500); adjustable laser pointer stand (92-7660); three window diffraction grating, 100, 300 and 600 lines per mm (P3-6405); holographic gratings, 500 and 1000 lines per mm, five of each (33-0985, 33-0990); giant acrylic lens and prism set of 7 (92-1460). The 75 mm semicircle in the acrylic set stretches the laser dot into a short bright horizontal line, flat face toward the laser. Line length depends on which piece you use and how far it sits from the laser: moving the optic away from the laser lengthens the line, moving it closer shortens it. At about 3 m from the semicircle the line is roughly 2.5 to 3.6 cm long, not a line across the wall. Observation documents are free PDF downloads.',
  },
  {
    id: 'dual',
    sku: 'KIT-DUAL-MW',
    emitters: [P2_7679],
    name: 'Laser Diffraction Research Kit, Dual (650 and 532 nm, 1 to 2 Observers)',
    shortName: 'Dual',
    observers: '1 to 2',
    price: '$399',
    priceNumber: 399,
    cart: 'https://shop.dmtcode.com/cart/54434179973430:1',
    image: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7679DualRed-GreenLaserPointer-022048x2048.jpg',
    diyCost: '$215',
    diyCostNumber: 215,
    availability: AVAIL,
    description:
      "The Solo bench with a switchable 650 nm red and 532 nm green pointer (Arbor P2-7679, vendor rated max 5 mW, FDA Class IIIa) so the same observation can be compared at two wavelengths. Adds Young's slit cards, three per pack (33-0240). Includes stand, three window grating, holographic gratings and the acrylic set with the semicircle that stretches the dot into a short bright horizontal line. Observation documents are free PDF downloads.",
  },
  {
    id: 'triad',
    sku: 'KIT-TRIAD-MW',
    emitters: [P2_7680, P2_7678],
    name: 'Laser Diffraction Research Kit, Triad (650 and 405 nm, 2 to 3 Observers)',
    shortName: 'Triad',
    observers: '2 to 3',
    price: '$699',
    priceNumber: 699,
    cart: 'https://shop.dmtcode.com/cart/54376697692470:1',
    image: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7680LaserRayBoxwithLenses2048x2048_c5e1df26-5de3-492b-97a2-dc948b077723.jpg',
    diyCost: '$342',
    diyCostNumber: 342,
    availability: AVAIL,
    description:
      'Two to three observers. Contents: 650 nm laser ray box with 1, 3 or 5 beams and its own 8 piece acrylic optics set (Arbor P2-7680); 405 nm violet pointer (P2-7678); two adjustable stands; three window grating; holographic gratings; Young\'s slit cards; slide carrier (92-7671); 50 slide mounted polarizers (P2-9405). The semicircle lens in the ray box case stretches the dot into a short bright horizontal line, and moving it away from the laser lengthens that line. Vendor ratings per emitter: ray box P2-7680, 650 nm, under 1 mW, laser class 3a; violet pointer P2-7678, spec sheet 401 nm (sold as 405 nm), under 5 mW, FDA Class IIIa. The ray box is dim, so darken the room. Observation documents are free PDF downloads.',
  },
  {
    id: 'circle',
    sku: 'KIT-CIRCLE-MW',
    emitters: [P2_7680, P2_7678, P2_7679],
    name: 'Laser Diffraction Research Kit, Circle (650, 532 and 405 nm, Up to 6 Observers)',
    shortName: 'Circle',
    observers: 'up to 6',
    price: '$1,090',
    priceNumber: 1090,
    cart: 'https://shop.dmtcode.com/cart/54376698446134:1',
    image: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7680LaserRayBoxwithLenses2048x2048_5efaa11c-9785-4d65-bb76-6dff2034df3b.jpg',
    diyCost: '$442',
    diyCostNumber: 442,
    availability: AVAIL,
    description:
      'Up to six observers. Everything in the Triad plus a switchable 650 and 532 nm pointer (P2-7679, vendor rated max 5 mW, FDA Class IIIa), a third stand, a second slide carrier and a handheld quantitative spectroscope (P2-7061), so three sources cover 650, 532 and 405 nm. The semicircle lens in the ray box case stretches the dot into a short bright horizontal line, and moving it away from the laser lengthens that line. Observation documents are free PDF downloads.',
  },
];

export const KIT_MIN_PRICE = KITS[0].priceNumber;
export const KIT_MAX_PRICE = KITS[KITS.length - 1].priceNumber;
export const KIT_PRICE_RANGE = `${KITS[0].price} to ${KITS[KITS.length - 1].price}`;
