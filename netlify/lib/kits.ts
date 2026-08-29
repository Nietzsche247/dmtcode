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
  // Live Shopify product handle. /products/<handle> is the drill-down page.
  handle: string;
  // The bill of materials. This is the published list of what the kit ships.
  contents: KitItem[];
  // Product photography, Shopify CDN URLs with their stored alt text.
  photos: KitPhoto[];
};

// One supplier order line. qty is the number of vendor units to order, so a
// pack counts as 1 and the pack size is stated in note. scripts/check-kits-drift.mjs
// asserts every part number named in a kit description also appears here, so the
// prose and this list cannot promise different parts.
export type KitItem = {
  sku: string;
  name: string;
  qty: number;
  vendor_url?: string;
  note?: string;
};

// alt is the alt text stored on the Shopify media record. Never rewrite it here.
export type KitPhoto = { url: string; alt: string };

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

// Arbor Scientific parts catalogue. One entry per part number, so a part carries
// the same name in every kit that ships it. Spread into a kit's contents with the
// quantity for that kit. vendor_url is set only where the repo already sources one.
const PART_P2_7500 = { sku: 'P2-7500', name: 'Deluxe Red Laser Pointer, 650 nm', vendor_url: 'https://www.arborsci.com/products/standard-red-laser-pointer' };
const PART_P2_7679 = { sku: 'P2-7679', name: 'Dual Red-Green Laser Pointer, 650 and 532 nm', vendor_url: 'https://www.arborsci.com/products/dual-red-green-laser' };
const PART_P2_7680 = { sku: 'P2-7680', name: 'Laser Ray Box and Lenses, 650 nm', vendor_url: 'https://www.arborsci.com/products/laser-ray-box-and-lenses', note: 'includes its own 8 piece acrylic optics set' };
const PART_P2_7678 = { sku: 'P2-7678', name: 'Violet Laser Pointer, 405 nm', vendor_url: 'https://www.arborsci.com/products/violet-laser-pointer' };
const PART_92_7660 = { sku: '92-7660', name: 'Adjustable Laser Pointer Stand' };
const PART_P3_6405 = { sku: 'P3-6405', name: 'Three Window Diffraction Grating, 100, 300 and 600 lines per mm' };
const PART_33_0985 = { sku: '33-0985', name: 'Holographic Diffraction Grating, 500 lines per mm', note: '5 per pack' };
const PART_33_0990 = { sku: '33-0990', name: 'Holographic Diffraction Grating, 1000 lines per mm', note: '5 per pack' };
const PART_33_0240 = { sku: '33-0240', name: "Young's Slit Cards, varying dimensions", note: '3 per pack' };
const PART_92_1460 = { sku: '92-1460', name: 'Giant Acrylic Lens and Prism Set, with case', note: 'set of 7, includes the 75 mm semicircle' };
const PART_92_7671 = { sku: '92-7671', name: 'Slide Carrier' };
const PART_P2_9405 = { sku: 'P2-9405', name: 'Slide Mounted Polarizing Filters', note: '50 per pack' };
const PART_P2_7061 = { sku: 'P2-7061', name: 'Quantitative Spectroscope, handheld' };

const AVAIL = 'Arrives in 7 to 10 business days. Free US shipping. 18+, for research use.';

export const KITS: Kit[] = [
  {
    id: 'solo',
    sku: 'KIT-SOLO-650',
    emitters: [P2_7500],
    handle: '650nm-laser-diffraction-research-kit-solo',
    contents: [
      { ...PART_P2_7500, qty: 1 },
      { ...PART_92_7660, qty: 1 },
      { ...PART_P3_6405, qty: 1 },
      { ...PART_33_0985, qty: 1 },
      { ...PART_33_0990, qty: 1 },
      { ...PART_92_1460, qty: 1 },
    ],
    photos: [
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/kit_flatlay_v3.jpg?v=1787290393', alt: 'Solo kit components shown at true relative scale: 650 nm laser pointer in its case, three-window diffraction grating, and two AAA batteries' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/solo_unboxed.jpg?v=1787330115', alt: 'Solo kit unboxed: laser pointer in its case with batteries, adjustable laser stand, and the 100, 300 and 600 lines per mm diffraction grating' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/solo_stand_in_use.jpg?v=1787330115', alt: 'Solo kit in use: red laser pointer clamped in the adjustable stand, which holds the button down, with the three-window diffraction grating in the beam' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/kit-solo-contents.jpg?v=1786944866', alt: 'Solo kit contents: every component photographed as shipped' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7500DeluxeRedLaserPointer2048x2048.jpg?v=1787331892', alt: 'Deluxe Red Laser Pointer, Arbor Scientific P2-7500, included in the Solo kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/pointer_in_case.jpg?v=1787290392', alt: 'Alpec Spectra 650 nm laser pointer in its hinged presentation case' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/pointer_fda_label.jpg?v=1787290392', alt: 'Laser pointer showing the FDA 21 CFR 1040.10 compliance label, under 5 mW at 650 nm' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/pointer_box_arbor_label.jpg?v=1787290393', alt: 'Arbor Scientific product label reading Deluxe Red Laser Pointer, item P2-7500' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/pointer_battery_card.jpg?v=1787290392', alt: 'Battery installation card showing two AAA cells, included in the pointer case' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/stand_92-7660.jpg?v=1787290393', alt: 'Adjustable laser pointer stand, Arbor Scientific 92-7660, shown holding a pointer for scale' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/grating_face.jpg?v=1787290393', alt: 'Educational diffraction grating slide with three windows ruled at 100, 300 and 600 lines per millimetre' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/grating_back.jpg?v=1787290393', alt: 'Reverse of the diffraction grating slide showing moulded handling text' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0985HolographicDiffractionGrating500lines2048x2048.jpg?v=1787331892', alt: 'Holographic Diffraction Grating 500 lines/mm 5 Pack, Arbor Scientific 33-0985, included in the Solo kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0990HolographicDiffractionGrating1000lines2048x2048.jpg?v=1787331892', alt: 'Holographic Diffraction Grating 1000 lines/mm 5 Pack, Arbor Scientific 33-0990, included in the Solo kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/prism_set_92-1460.jpg?v=1787290392', alt: 'Giant acrylic lens and prism set of seven pieces, Arbor Scientific 92-1460' },
    ],
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
    handle: 'dual-wavelength-laser-diffraction-research-kit-dual-650-and-532-nm',
    contents: [
      { ...PART_P2_7679, qty: 1 },
      { ...PART_92_7660, qty: 1 },
      { ...PART_P3_6405, qty: 1 },
      { ...PART_33_0985, qty: 1 },
      { ...PART_33_0990, qty: 1 },
      { ...PART_33_0240, qty: 1 },
      { ...PART_92_1460, qty: 1 },
    ],
    photos: [
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7679DualRed-GreenLaserPointer-022048x2048.jpg?v=1787331914', alt: 'Dual Red-Green Laser Pointer, Arbor Scientific P2-7679, included in the Dual kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7679DualRed-GreenLaserPointer2048x2048.jpg?v=1787331914', alt: 'Dual Red-Green Laser Pointer, Arbor Scientific P2-7679, included in the Dual kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/92-7660AdjustableLaserPointerStand2048x2048.jpg?v=1787331914', alt: 'Adjustable Laser Pointer Stand, Arbor Scientific 92-7660, included in the Dual kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P3-6405DiffractionGrating2048x2048.jpg?v=1787331914', alt: 'Demo Diffraction Grating, Arbor Scientific P3-6405, included in the Dual kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P3-6405DiffractionGrating-022048x2048.jpg?v=1787331914', alt: 'Demo Diffraction Grating, Arbor Scientific P3-6405, included in the Dual kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0985HolographicDiffractionGrating500lines2048x2048_9ca0e159-e49a-458f-b841-9f71c7faead0.jpg?v=1787331913', alt: 'Holographic Diffraction Grating 500 lines/mm 5 Pack, Arbor Scientific 33-0985, included in the Dual kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0990HolographicDiffractionGrating1000lines2048x2048_2f54ebec-b3b5-44d7-8105-bccfef29488b.jpg?v=1787331913', alt: 'Holographic Diffraction Grating 1000 lines/mm 5 Pack, Arbor Scientific 33-0990, included in the Dual kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0240YoungsSlitCards2048x2048.jpg?v=1787331914', alt: "Young's Slit Cards, 3/pk, with Varying Dimensions, Arbor Scientific 33-0240, included in the Dual kit" },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0240YoungsSlitCards2048x2048_4bd36075-47fd-4087-977b-994b36fb4178.jpg?v=1787331914', alt: "Young's Slit Cards, 3/pk, with Varying Dimensions, Arbor Scientific 33-0240, included in the Dual kit" },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0240YoungsSlitCards-022048x2048.jpg?v=1787331914', alt: "Young's Slit Cards, 3/pk, with Varying Dimensions, Arbor Scientific 33-0240, included in the Dual kit" },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/92-1460GiantAcrylicPrismSet2048x2048_e40ec1fc-e126-4781-b3e8-565e0a36d983.jpg?v=1787331914', alt: 'Giant Acrylic Lens and Prism Set of 7, Arbor Scientific 92-1460, included in the Dual kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/92-1460GiantAcrylicPrismSet-022048x2048_15df7fe7-d5f2-461f-97e6-6613f18d3fff.jpg?v=1787331914', alt: 'Giant Acrylic Lens and Prism Set of 7, Arbor Scientific 92-1460, included in the Dual kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/92-1460GiantAcrylicPrismSet-032048x2048_a569cded-e72e-464f-8fa6-3daeeabe04a6.jpg?v=1787331914', alt: 'Giant Acrylic Lens and Prism Set of 7, Arbor Scientific 92-1460, included in the Dual kit' },
    ],
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
    handle: 'multi-wavelength-laser-diffraction-kit-triad',
    contents: [
      { ...PART_P2_7680, qty: 1 },
      { ...PART_P2_7678, qty: 1 },
      { ...PART_92_7660, qty: 2 },
      { ...PART_P3_6405, qty: 1 },
      { ...PART_33_0985, qty: 1 },
      { ...PART_33_0990, qty: 1 },
      { ...PART_33_0240, qty: 1 },
      { ...PART_92_7671, qty: 1 },
      { ...PART_P2_9405, qty: 1 },
    ],
    photos: [
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7680LaserRayBoxwithLenses2048x2048_c5e1df26-5de3-492b-97a2-dc948b077723.jpg?v=1787331935', alt: 'Laser Ray Box and Lenses, Arbor Scientific P2-7680, included in the Triad kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7680LaserRayBoxwithLenses-022048x2048_a370f73d-2953-4577-af4a-edd198a7e3ec.jpg?v=1787331935', alt: 'Laser Ray Box and Lenses, Arbor Scientific P2-7680, included in the Triad kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7678VioletLaserPointer2048x2048_13b32252-8540-40c9-8f1e-1bd249e8616a.jpg?v=1787331935', alt: 'Violet Laser Pointer, Arbor Scientific P2-7678, included in the Triad kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7678VioletLaserPointer-phosphoruspaper2048x2048_1052120b-d4dc-4bc2-9197-b5ae16566636.jpg?v=1787331935', alt: 'Violet Laser Pointer, Arbor Scientific P2-7678, included in the Triad kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7678VioletLaserPointer-tonicwater2048x2048_c99cf06e-75ea-490b-a866-eb38919e1998.jpg?v=1787331934', alt: 'Violet Laser Pointer, Arbor Scientific P2-7678, included in the Triad kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/92-7660AdjustableLaserPointerStand2048x2048_30957516-6e15-487d-9546-74c6966dbd26.jpg?v=1787331934', alt: 'Adjustable Laser Pointer Stand, Arbor Scientific 92-7660, included in the Triad kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P3-6405DiffractionGrating2048x2048_8d8b90a1-45a8-498e-95c4-d1d1a485cac1.jpg?v=1787331934', alt: 'Demo Diffraction Grating, Arbor Scientific P3-6405, included in the Triad kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P3-6405DiffractionGrating-022048x2048_ad1705ad-0e07-4869-92c5-b58496084ea3.jpg?v=1787331934', alt: 'Demo Diffraction Grating, Arbor Scientific P3-6405, included in the Triad kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0985HolographicDiffractionGrating500lines2048x2048_d4dc633b-e280-4a03-86ed-c8b81b5c28ff.jpg?v=1787331934', alt: 'Holographic Diffraction Grating 500 lines/mm 5 Pack, Arbor Scientific 33-0985, included in the Triad kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0990HolographicDiffractionGrating1000lines2048x2048_02ffb9cd-ea0a-4e8a-937f-313db55581b3.jpg?v=1787331934', alt: 'Holographic Diffraction Grating 1000 lines/mm 5 Pack, Arbor Scientific 33-0990, included in the Triad kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0240YoungsSlitCards2048x2048_3e56c70e-bc88-4ba1-9e90-36b840be6c0f.jpg?v=1787331934', alt: "Young's Slit Cards, 3/pk, with Varying Dimensions, Arbor Scientific 33-0240, included in the Triad kit" },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0240YoungsSlitCards2048x2048_e6a73e31-e324-4fb9-ac88-f7ca0be87977.jpg?v=1787331934', alt: "Young's Slit Cards, 3/pk, with Varying Dimensions, Arbor Scientific 33-0240, included in the Triad kit" },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0240YoungsSlitCards-022048x2048_54a5a203-51b4-488a-98a5-c68fe8ebce71.jpg?v=1787331934', alt: "Young's Slit Cards, 3/pk, with Varying Dimensions, Arbor Scientific 33-0240, included in the Triad kit" },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/92-7671SlideCarrier2048x2048.jpg?v=1787331935', alt: 'Slide Carrier, Arbor Scientific 92-7671, included in the Triad kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-9405SlideMountedPolarizingFilters2048x2048.jpg?v=1787331935', alt: 'Slide Mounted Polarizing Filters 50/pack, Arbor Scientific P2-9405, included in the Triad kit' },
    ],
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
    handle: 'multi-wavelength-laser-diffraction-kit-circle',
    contents: [
      { ...PART_P2_7680, qty: 1 },
      { ...PART_P2_7679, qty: 1 },
      { ...PART_P2_7678, qty: 1 },
      { ...PART_92_7660, qty: 3 },
      { ...PART_P3_6405, qty: 1 },
      { ...PART_33_0985, qty: 1 },
      { ...PART_33_0990, qty: 1 },
      { ...PART_33_0240, qty: 1 },
      { ...PART_92_7671, qty: 2 },
      { ...PART_P2_9405, qty: 1 },
      { ...PART_P2_7061, qty: 1 },
    ],
    photos: [
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7680LaserRayBoxwithLenses2048x2048_5efaa11c-9785-4d65-bb76-6dff2034df3b.jpg?v=1787331957', alt: 'Laser Ray Box and Lenses, Arbor Scientific P2-7680, included in the Circle kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7680LaserRayBoxwithLenses-022048x2048_57f2cb5d-3287-4be2-a2e5-b3e9f86d380a.jpg?v=1787331957', alt: 'Laser Ray Box and Lenses, Arbor Scientific P2-7680, included in the Circle kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7679DualRed-GreenLaserPointer-022048x2048_cf21d998-06aa-4ed8-9ffd-3af818eb46a0.jpg?v=1787331957', alt: 'Dual Red-Green Laser Pointer, Arbor Scientific P2-7679, included in the Circle kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7679DualRed-GreenLaserPointer2048x2048_eecc3ddf-ab96-431e-96be-95eb44b70a81.jpg?v=1787331957', alt: 'Dual Red-Green Laser Pointer, Arbor Scientific P2-7679, included in the Circle kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7678VioletLaserPointer2048x2048_47e525ba-2b36-4ac5-ac37-6e15b5d7848e.jpg?v=1787331957', alt: 'Violet Laser Pointer, Arbor Scientific P2-7678, included in the Circle kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7678VioletLaserPointer-phosphoruspaper2048x2048_dddb9ca6-695d-4c35-9d72-8413b03855c1.jpg?v=1787331957', alt: 'Violet Laser Pointer, Arbor Scientific P2-7678, included in the Circle kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7678VioletLaserPointer-tonicwater2048x2048_6d0d113b-25e4-4f16-90bd-63f693bf83d9.jpg?v=1787331957', alt: 'Violet Laser Pointer, Arbor Scientific P2-7678, included in the Circle kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/92-7660AdjustableLaserPointerStand2048x2048_b4fecfd0-08bd-47db-91bb-8f6d3efb2d4b.jpg?v=1787331957', alt: 'Adjustable Laser Pointer Stand, Arbor Scientific 92-7660, included in the Circle kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P3-6405DiffractionGrating2048x2048_f262f231-e133-4e19-9a72-db759b6d9f34.jpg?v=1787331957', alt: 'Demo Diffraction Grating, Arbor Scientific P3-6405, included in the Circle kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P3-6405DiffractionGrating-022048x2048_7a2c4812-5976-4d3b-802f-2c001a43bd09.jpg?v=1787331957', alt: 'Demo Diffraction Grating, Arbor Scientific P3-6405, included in the Circle kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0985HolographicDiffractionGrating500lines2048x2048_dc80e341-fca0-4c25-a7ab-c518d2c2787c.jpg?v=1787331957', alt: 'Holographic Diffraction Grating 500 lines/mm 5 Pack, Arbor Scientific 33-0985, included in the Circle kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0990HolographicDiffractionGrating1000lines2048x2048_8d808c98-58df-41d9-8ee3-b003554e9664.jpg?v=1787331957', alt: 'Holographic Diffraction Grating 1000 lines/mm 5 Pack, Arbor Scientific 33-0990, included in the Circle kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0240YoungsSlitCards2048x2048_fbdeac29-d5dd-4487-ab3b-69b5b9aa51d9.jpg?v=1787331957', alt: "Young's Slit Cards, 3/pk, with Varying Dimensions, Arbor Scientific 33-0240, included in the Circle kit" },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0240YoungsSlitCards2048x2048_d20d6655-b139-4fff-821e-2e67b5c3fdeb.jpg?v=1787331956', alt: "Young's Slit Cards, 3/pk, with Varying Dimensions, Arbor Scientific 33-0240, included in the Circle kit" },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/33-0240YoungsSlitCards-022048x2048_6ede986e-3986-4ae7-932c-3f3811e95844.jpg?v=1787331957', alt: "Young's Slit Cards, 3/pk, with Varying Dimensions, Arbor Scientific 33-0240, included in the Circle kit" },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/92-7671SlideCarrier2048x2048_e9bcc3b1-ee4f-49b3-9013-1d746bd9fdd2.jpg?v=1787331957', alt: 'Slide Carrier, Arbor Scientific 92-7671, included in the Circle kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-9405SlideMountedPolarizingFilters2048x2048_0e3cf59a-6666-45ac-848f-1ca0f5fc52a1.jpg?v=1787331957', alt: 'Slide Mounted Polarizing Filters 50/pack, Arbor Scientific P2-9405, included in the Circle kit' },
      { url: 'https://cdn.shopify.com/s/files/1/0957/0484/2550/files/P2-7061QuantitativeSpectroscope2048x2048.jpg?v=1787331957', alt: 'Quantitative Spectroscope, Arbor Scientific P2-7061, included in the Circle kit' },
    ],
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
