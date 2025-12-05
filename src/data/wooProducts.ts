// Mysticism product data for /community/woo detail pages

import hamsaImg from '@/assets/hamsa-amulet.jpg';
import starOfDavidImg from '@/assets/star-of-david-pendant.jpg';
import chaiImg from '@/assets/chai-necklace.jpg';
import pomegranateImg from '@/assets/pomegranate-symbol.jpg';
import evilEyeImg from '@/assets/evil-eye-bracelet.jpg';
import mezuzahImg from '@/assets/mezuzah-case.jpg';
import kabbalahTreeImg from '@/assets/kabbalah-tree-pendant.jpg';
import seferRazielImg from '@/assets/sefer-raziel-hamalakh.jpg';
import seferHarazimImg from '@/assets/sefer-harazim.jpg';
import treatiseImg from '@/assets/treatise-left-emanation.jpg';

export interface WooProduct {
  slug: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  tradition?: string;
  symbolism?: string;
  specs?: Record<string, string>;
  relatedResearch?: string[];
}

export const wooProducts: Record<string, WooProduct> = {
  'hamsa-amulet': {
    slug: 'hamsa-amulet',
    title: 'Hamsa Hand Amulet',
    description: 'Traditional protective amulet depicting the Hand of Miriam (Hamsa). Found across Jewish, Islamic, and Christian traditions as a symbol of divine protection. The five fingers represent the five books of Torah or the hand of God.',
    price: 35,
    image: hamsaImg,
    category: 'Protective Amulets',
    tradition: 'Jewish / Middle Eastern',
    symbolism: 'Protection against the evil eye, divine blessing, the hand of God',
    specs: {
      'Material': 'Sterling silver 925',
      'Dimensions': '25mm x 20mm',
      'Chain': '18" sterling silver',
      'Origin': 'Handcrafted in Israel',
    },
    relatedResearch: ['Strassman 2001', 'Goler 2025'],
  },
  'star-of-david-pendant': {
    slug: 'star-of-david-pendant',
    title: 'Star of David Pendant',
    description: 'The Magen David (Shield of David) represents the connection between heaven and earth through its interlocking triangles. In Kabbalah, the six points correspond to the six sefirot of Zeir Anpin, with the center representing Malkhut.',
    price: 55,
    image: starOfDavidImg,
    category: 'Sacred Geometry',
    tradition: 'Jewish Kabbalah',
    symbolism: 'Divine protection, the unity of opposites, cosmic balance',
    specs: {
      'Material': '14K gold plated',
      'Dimensions': '18mm hexagram',
      'Chain': '20" gold-filled chain',
      'Finish': 'Polished with matte center',
    },
    relatedResearch: ['Davis 2021', 'Timmermann 2019'],
  },
  'chai-necklace': {
    slug: 'chai-necklace',
    title: 'Chai Life Symbol Necklace',
    description: 'The Hebrew word "Chai" (חי) means "life" and carries numerical value 18 in gematria. Wearing Chai symbolizes vitality and the sanctity of life. The letter forms themselves are considered sacred in Kabbalistic tradition.',
    price: 40,
    image: chaiImg,
    category: 'Hebrew Letters',
    tradition: 'Jewish',
    symbolism: 'Life, vitality, the number 18, blessing',
    specs: {
      'Material': 'Sterling silver 925',
      'Dimensions': '15mm x 12mm',
      'Chain': '18" sterling silver',
      'Hebrew': 'Authentic Hebrew calligraphy',
    },
    relatedResearch: ['Strassman 2001'],
  },
  'pomegranate-symbol': {
    slug: 'pomegranate-symbol',
    title: 'Pomegranate Blessing Symbol',
    description: 'The pomegranate (rimon) contains 613 seeds according to tradition—corresponding to the 613 commandments. Symbol of righteousness, fertility, and the sweetness of Torah knowledge.',
    price: 28,
    image: pomegranateImg,
    category: 'Symbolic Jewelry',
    tradition: 'Jewish',
    symbolism: 'Torah commandments, righteousness, abundance, new beginnings',
    specs: {
      'Material': 'Bronze with red enamel',
      'Dimensions': '22mm pendant',
      'Chain': '20" antique bronze chain',
      'Detail': 'Hand-painted seeds',
    },
    relatedResearch: ['Goler 2025'],
  },
  'evil-eye-bracelet': {
    slug: 'evil-eye-bracelet',
    title: 'Evil Eye Protection Bracelet',
    description: 'The Nazar (evil eye) amulet deflects negative energy and malicious intent. Blue glass eye beads have been used for millennia across Mediterranean and Middle Eastern cultures for spiritual protection.',
    price: 45,
    image: evilEyeImg,
    category: 'Protective Amulets',
    tradition: 'Mediterranean / Middle Eastern',
    symbolism: 'Protection from envy, deflection of negative energy',
    specs: {
      'Material': 'Blue glass and silver',
      'Bead Size': '8mm evil eye beads',
      'Bracelet': 'Adjustable 6-8" wrist',
      'Craftsmanship': 'Traditional lampwork glass',
    },
    relatedResearch: ['Strassman 2001'],
  },
  'mezuzah-case': {
    slug: 'mezuzah-case',
    title: 'Mezuzah Case with Scroll',
    description: 'The mezuzah contains the Shema prayer on parchment, placed on doorposts as commanded in Deuteronomy 6:9. In mystical tradition, the divine name Shaddai on the case acts as a spiritual guardian.',
    price: 60,
    image: mezuzahImg,
    category: 'Sacred Objects',
    tradition: 'Jewish',
    symbolism: 'Divine protection of the home, covenant with God, doorway blessing',
    specs: {
      'Material': 'Pewter with blue enamel',
      'Dimensions': '4" x 1" case',
      'Scroll': 'Kosher parchment included',
      'Design': 'Jerusalem stone motif',
    },
    relatedResearch: ['Goler 2025', 'Davis 2021'],
  },
  'kabbalah-tree-pendant': {
    slug: 'kabbalah-tree-pendant',
    title: 'Tree of Life Pendant',
    description: 'The Etz Chaim (Tree of Life) diagram maps the ten sefirot—divine emanations through which Ein Sof (the Infinite) created and sustains reality. Central to Kabbalistic meditation and understanding of cosmic structure.',
    price: 50,
    image: kabbalahTreeImg,
    category: 'Kabbalah',
    tradition: 'Jewish Kabbalah',
    symbolism: 'Ten sefirot, divine emanation, spiritual anatomy, cosmic structure',
    specs: {
      'Material': 'Sterling silver with gold accents',
      'Dimensions': '30mm diameter',
      'Chain': '22" sterling silver',
      'Detail': 'All 10 sefirot depicted',
    },
    relatedResearch: ['Timmermann 2019', 'Strassman 2001', 'Goler 2025'],
  },
  'sefer-raziel-hamalakh': {
    slug: 'sefer-raziel-hamalakh',
    title: 'Sefer Raziel HaMalakh',
    description: 'The "Book of Raziel the Angel"—a medieval grimoire of Jewish mysticism containing angel names, magical sigils, and incantations. Traditionally attributed to the angel Raziel who revealed secrets to Adam.',
    price: 35,
    image: seferRazielImg,
    category: 'Kabbalah Books',
    tradition: 'Medieval Jewish Mysticism',
    symbolism: 'Angelic wisdom, magical seals, divine secrets',
    specs: {
      'Format': 'Paperback with commentary',
      'Pages': '320 pages',
      'Language': 'Hebrew with English translation',
      'Edition': 'Annotated scholarly edition',
    },
    relatedResearch: ['Strassman 2001'],
  },
  'sefer-harazim': {
    slug: 'sefer-harazim',
    title: 'Sefer HaRazim',
    description: 'The "Book of Mysteries"—an ancient Jewish magical text describing the seven heavens, their angelic inhabitants, and practical magic. Reflects syncretism between Jewish and Greco-Roman magical traditions.',
    price: 28,
    image: seferHarazimImg,
    category: 'Kabbalah Books',
    tradition: 'Late Antique Jewish Magic',
    symbolism: 'Seven heavens, angelic hierarchies, practical magic',
    specs: {
      'Format': 'Paperback',
      'Pages': '240 pages',
      'Language': 'English translation',
      'Edition': 'Critical scholarly edition',
    },
    relatedResearch: ['Davis 2021'],
  },
  'treatise-left-emanation': {
    slug: 'treatise-left-emanation',
    title: 'Treatise on the Left Emanation',
    description: 'Isaac ha-Kohen\'s 13th-century text mapping the sitra achra (other side)—the realm of demonic forces in Kabbalistic cosmology. Essential reading for understanding the shadow side of the sefirot.',
    price: 32,
    image: treatiseImg,
    category: 'Kabbalah Books',
    tradition: 'Medieval Kabbalah',
    symbolism: 'Kelipot, demonic hierarchies, shadow sefirot',
    specs: {
      'Format': 'Paperback',
      'Pages': '180 pages',
      'Language': 'English translation with Hebrew',
      'Edition': 'Academic press edition',
    },
    relatedResearch: ['Timmermann 2019', 'Strassman 2001'],
  },
};

export const getWooProduct = (slug: string): WooProduct | undefined => {
  return wooProducts[slug];
};
