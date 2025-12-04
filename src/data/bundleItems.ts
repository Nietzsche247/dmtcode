// Bundle item product data for individual product pages
// These items are part of bundles but don't exist as standalone Shopify products

import laserPointerImg from '@/assets/products/laser-pointer-650nm.webp';
import diffractionImg from '@/assets/products/diffraction-glasses.webp';
import journalImg from '@/assets/products/research-journal.webp';
import mitoMatImg from '@/assets/products/mitomat-yoga-mat.webp';
import redLightPanelImg from '@/assets/products/red-light-panel.webp';

export interface BundleItem {
  slug: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  wavelength?: string;
  specs?: Record<string, string>;
  relatedResearch?: string[];
}

export const bundleItems: Record<string, BundleItem> = {
  '650nm-laser-pointer': {
    slug: '650nm-laser-pointer',
    title: '650nm 5mW Laser Pointer',
    description: 'Calibrated 650nm red laser pointer operating at 5mW output power. Optimized for the Goler 650nm protocol research methodology. Class IIIa laser classification with safety features. Ideal for surface projection during systematic observation sessions.',
    price: 28,
    image: laserPointerImg,
    category: 'Laser Equipment',
    wavelength: '650nm',
    specs: {
      'Wavelength': '650nm (red)',
      'Output Power': '5mW',
      'Laser Class': 'Class IIIa',
      'Beam Divergence': '<1.5 mrad',
      'Power Source': '2x AAA batteries',
      'Operating Temperature': '0°C to 40°C',
    },
    relatedResearch: ['Goler 2025', 'Davis 2021'],
  },
  'diffraction-grating': {
    slug: 'diffraction-grating',
    title: '500 lines/mm Diffraction Grating',
    description: 'Research-grade holographic diffraction grating with 500 lines per millimeter. Used for beam analysis and spectral separation in optical research. Creates distinctive rainbow patterns when coherent light passes through, enabling precise wavelength verification.',
    price: 22,
    image: diffractionImg,
    category: 'Optical Components',
    specs: {
      'Line Density': '500 lines/mm',
      'Type': 'Holographic transmission',
      'Material': 'Glass substrate',
      'Dimensions': '25mm x 25mm',
      'Efficiency': '>70% first order',
      'Wavelength Range': '400-700nm',
    },
    relatedResearch: ['Davis 2021', 'Timmermann 2019'],
  },
  'protocol-journal': {
    slug: 'protocol-journal',
    title: 'Protocol Documentation Journal',
    description: 'Structured research journal designed for documenting 650nm protocol sessions. Includes guided prompts for observation recording, timestamp fields, environmental condition logging, and dedicated symbol sketch areas. Archival-quality acid-free paper.',
    price: 35,
    image: journalImg,
    category: 'Research Accessories',
    specs: {
      'Pages': '200 pages',
      'Paper Type': 'Archival acid-free',
      'Binding': 'Lay-flat binding',
      'Size': 'A5 (148mm x 210mm)',
      'Cover': 'Hardcover with ribbon marker',
      'Format': 'Guided prompts + blank sketch areas',
    },
    relatedResearch: ['Goler 2025'],
  },
  'lab-timer': {
    slug: 'lab-timer',
    title: 'Lab Session Timer',
    description: 'Precision digital timer for research session timing. Features multiple countdown modes, interval timing, and audible alerts. Essential for maintaining consistent session durations during protocol adherence.',
    price: 21,
    image: journalImg,
    category: 'Research Accessories',
    specs: {
      'Display': 'Large LCD display',
      'Modes': 'Countdown, count-up, interval',
      'Memory': '5 preset timers',
      'Alert': 'Audible alarm + LED flash',
      'Power': 'CR2032 battery',
      'Accuracy': '±1 second per hour',
    },
  },
  'mitomat-yoga-mat': {
    slug: 'mitomat-yoga-mat',
    title: 'MitoMAT 660nm Red Light Mat',
    description: 'Full-body 660nm red light therapy mat with 3,740 LEDs providing comprehensive photobiomodulation coverage. Medical-grade LEDs with precise wavelength control. Includes controller with multiple intensity settings and session timer.',
    price: 1299,
    image: mitoMatImg,
    category: 'Light Therapy',
    wavelength: '660nm',
    specs: {
      'LEDs': '3,740 medical-grade LEDs',
      'Wavelength': '660nm (red)',
      'Irradiance': '50-100 mW/cm²',
      'Dimensions': '180cm x 60cm',
      'Controller': 'Digital with timer',
      'Power': '120V/240V compatible',
    },
    relatedResearch: ['Goler 2025', 'Davis 2021', 'Timmermann 2019'],
  },
  'quarton-laser-module': {
    slug: 'quarton-laser-module',
    title: 'Quarton VLM-650 Laser Module',
    description: 'Precision industrial 650nm laser module with integrated driver electronics. Provides stable output power with minimal beam divergence. Designed for continuous operation in research and industrial applications.',
    price: 650,
    image: laserPointerImg,
    category: 'Laser Equipment',
    wavelength: '650nm',
    specs: {
      'Wavelength': '650nm ±5nm',
      'Output Power': '10-50mW adjustable',
      'Beam Divergence': '<1.0 mrad',
      'Spot Size': '3mm at 10m',
      'Operating Life': '>10,000 hours',
      'Power Supply': '3-5V DC',
    },
    relatedResearch: ['Goler 2025', 'Lawrence 2022'],
  },
  'znse-lens': {
    slug: 'znse-lens',
    title: 'ZnSe High-Index Lens',
    description: 'Zinc Selenide (ZnSe) lens with high refractive index (RI 2.4) for advanced beam shaping experiments. Transmits across visible and infrared spectrum. Used in optical research requiring precise focal length control and minimal chromatic aberration.',
    price: 285,
    image: diffractionImg,
    category: 'Optical Components',
    specs: {
      'Material': 'Zinc Selenide (ZnSe)',
      'Refractive Index': '2.4 at 650nm',
      'Diameter': '25mm',
      'Focal Length': '50mm',
      'Surface Quality': '40-20 scratch-dig',
      'AR Coating': 'Broadband 400-700nm',
    },
    relatedResearch: ['Davis 2021'],
  },
  'huepar-laser-level': {
    slug: 'huepar-laser-level',
    title: 'Huepar Self-Leveling Laser System',
    description: 'Professional self-leveling 360° laser system with green beam for precise alignment and surface projection. Features automatic leveling within 4°, cross-line projection, and tripod mounting. Ideal for establishing consistent projection geometry.',
    price: 895,
    image: laserPointerImg,
    category: 'Laser Equipment',
    wavelength: '532nm (green)',
    specs: {
      'Wavelength': '532nm (green)',
      'Self-Leveling Range': '±4°',
      'Accuracy': '±3mm at 10m',
      'Working Range': 'Up to 30m (60m with detector)',
      'Projection': '360° horizontal + 2 vertical',
      'Power': 'Li-ion rechargeable',
    },
    relatedResearch: ['Goler 2025'],
  },
  'refraction-tank': {
    slug: 'refraction-tank',
    title: 'Refraction Analysis Tank',
    description: 'Optical-grade acrylic tank designed for refraction experiments. Features precision-machined walls with minimal optical distortion. Includes measurement scales and mounting points for laser module positioning.',
    price: 185,
    image: diffractionImg,
    category: 'Optical Components',
    specs: {
      'Material': 'Optical-grade acrylic (RI ~1.49)',
      'Dimensions': '30cm x 15cm x 15cm',
      'Wall Thickness': '6mm precision-machined',
      'Optical Clarity': '>92% transmission',
      'Features': 'Integrated measurement scales',
      'Mounting': 'Laser module rail system',
    },
  },
};

export const getBundleItem = (slug: string): BundleItem | undefined => {
  return bundleItems[slug];
};
