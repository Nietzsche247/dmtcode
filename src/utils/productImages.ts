// Product image imports - 1200x1200 WebP lab photographs
import laserPointer from '@/assets/products/laser-pointer-650nm.webp';
import mitomatYogaMat from '@/assets/products/mitomat-yoga-mat.webp';
import redLightPanel from '@/assets/products/red-light-panel.webp';
import fractalStickers from '@/assets/products/fractal-stickers.webp';
import researchJournal from '@/assets/products/research-journal.webp';
import incenseSticks from '@/assets/products/incense-sticks.webp';
import amethystStone from '@/assets/products/amethyst-stone.webp';
import roseQuartzRoller from '@/assets/products/rose-quartz-roller.webp';
import oracleCards from '@/assets/products/oracle-cards.webp';
import galaxyHoodie from '@/assets/products/galaxy-hoodie.webp';
import ritualRobe from '@/assets/products/ritual-robe.webp';
import tunicDress from '@/assets/products/tunic-dress.webp';
import bonChargeDevice from '@/assets/products/bon-charge-device.webp';
import diffractionGlasses from '@/assets/products/diffraction-glasses.webp';

// Existing laser/optics images
import quartonModule from '@/assets/quarton-laser-module.jpg';
import refractionTank from '@/assets/refraction-tank-laser.jpg';
import znseLens from '@/assets/znse-lens.jpg';
import laserTreeModule from '@/assets/laser-tree-module.jpg';
import aenbuslmModule from '@/assets/aenbuslm-module.jpg';
import huepar from '@/assets/huepar-laser-level.jpg';
import mrLenses from '@/assets/mr-lenses.jpg';

// Product title to image mapping
const productImageMap: Record<string, string> = {
  // Red light therapy
  'mitomat': mitomatYogaMat,
  'mito mat': mitomatYogaMat,
  'yoga mat': mitomatYogaMat,
  'red light panel': redLightPanel,
  'mitopro': redLightPanel,
  'full body': redLightPanel,
  'bon charge': bonChargeDevice,
  'boncharge': bonChargeDevice,
  
  // Laser equipment
  '650nm': laserPointer,
  'laser pointer': laserPointer,
  'laser pen': laserPointer,
  'quarton': quartonModule,
  'vlm-650': quartonModule,
  'refraction tank': refractionTank,
  'znse': znseLens,
  'cvd': znseLens,
  'lens': znseLens,
  'laser tree': laserTreeModule,
  'aenbuslm': aenbuslmModule,
  'carving module': aenbuslmModule,
  'huepar': huepar,
  'self-leveling': huepar,
  'mr lenses': mrLenses,
  'progressive': mrLenses,
  
  // Accessories
  'sticker': fractalStickers,
  'fractal': fractalStickers,
  'journal': researchJournal,
  'notebook': researchJournal,
  'codex': researchJournal,
  'incense': incenseSticks,
  'palo santo': incenseSticks,
  'amethyst': amethystStone,
  'worry stone': amethystStone,
  'rose quartz': roseQuartzRoller,
  'roller': roseQuartzRoller,
  'oracle': oracleCards,
  'card deck': oracleCards,
  'intention card': oracleCards,
  'tarot': oracleCards,
  
  // Apparel
  'hoodie': galaxyHoodie,
  'galaxy': galaxyHoodie,
  'robe': ritualRobe,
  'ritual': ritualRobe,
  'paradisiac': ritualRobe,
  'tunic': tunicDress,
  'sol': tunicDress,
  'seed of life': tunicDress,
  
  // Optical equipment
  'diffraction': diffractionGlasses,
  'grating': diffractionGlasses,
  'glasses': diffractionGlasses,
};

/**
 * Get the appropriate product image based on product title
 * Falls back to placeholder if no match found
 */
export function getProductImage(title: string): string | null {
  const lowerTitle = title.toLowerCase();
  
  // Check for keyword matches
  for (const [keyword, image] of Object.entries(productImageMap)) {
    if (lowerTitle.includes(keyword)) {
      return image;
    }
  }
  
  return null;
}

/**
 * Get image with fallback to Shopify image or placeholder
 */
export function getProductImageWithFallback(
  title: string,
  shopifyImageUrl?: string,
  placeholderFn?: (title: string, category: string) => string
): string {
  // First try our mapped images
  const mappedImage = getProductImage(title);
  if (mappedImage) return mappedImage;
  
  // Then try Shopify image
  if (shopifyImageUrl) return shopifyImageUrl;
  
  // Finally use placeholder
  if (placeholderFn) return placeholderFn(title, 'product');
  
  return '';
}

export {
  laserPointer,
  mitomatYogaMat,
  redLightPanel,
  fractalStickers,
  researchJournal,
  incenseSticks,
  amethystStone,
  roseQuartzRoller,
  oracleCards,
  galaxyHoodie,
  ritualRobe,
  tunicDress,
  bonChargeDevice,
  diffractionGlasses,
  quartonModule,
  refractionTank,
  znseLens,
  laserTreeModule,
  aenbuslmModule,
  huepar,
  mrLenses,
};
