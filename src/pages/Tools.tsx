import { ParticleBackground } from '@/components/ParticleBackground';
import { Navigation } from '@/components/Navigation';
import { LaserGuide } from '@/components/LaserGuide';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const products = [
  {
    title: "Psychedelic Fractal Sticker Pack (Vinyl, Holographic)",
    price: 12,
    image: "https://printify.com/cdn/shop/products/holographic-psy-sticker-pack.jpg",
    description: "Wormhole talismans for EEG rituals—fractal adhesive tokens amplifying visual entrainment during DMT sessions. Layer them on ceremony spaces or journals to anchor Timmermann's 2019 neural oscillation patterns. Holographic vinyl withstands humidity, reflecting laser speckle in ambient light.",
    tier: "low",
    type: "product"
  },
  {
    title: "DMT Entity Oracle Card Deck (Mini, 22-Card)",
    price: 15,
    image: "https://enchantedsoul.store/cdn/shop/products/oracle-cards-mini.jpg",
    description: "Intention prompts for Davis et al.'s 2021 entity encounter surveys. Each card poses pre-journey questions (e.g., 'What knowledge do you seek?') aligning with phenomenological frameworks. Pocket-sized for travel, designed for solo or group preparation rituals.",
    tier: "low",
    type: "product"
  },
  {
    title: "Sacred Geometry Incense Sticks (Palo Santo Blend, 10-Pack)",
    price: 18,
    image: "https://spocket.co/cdn/products/palo-santo-incense-pack.jpg",
    description: "Grounding aromatherapy for clinical prep phases per Strassman's 2001 Spirit Molecule protocols. Palo santo smoke clears anxiety pre-dose; sacred geometry packaging primes geometric visual expectations. Burns 30 min per stick—ideal for extended integration sessions post-journey.",
    tier: "low",
    type: "product"
  },
  {
    title: "Custom Psychedelic Journal (Fractal Cover, Guided)",
    price: 22,
    image: "https://www.printful.com/cdn-cgi/image/quality=85,format=auto/on/demandware.static/-/Sites-master-catalog/default/dwabc123/psy-journal-cover.jpg",
    description: "Scribbles for Michael et al.'s 2021 thematic analysis flows. Guided prompts capture glyph sketches, entity dialogues, color shifts. Fractal mandala cover primes pattern recognition. 150 acid-free pages for archival replicator logs—compatible with Goler's 2025 protocol documentation standards.",
    tier: "low",
    type: "product"
  },
  {
    title: "Amethyst Worry Stone (Tumbled, Palm-Sized)",
    price: 45,
    image: "https://modalyst.co/cdn/products/amethyst-worry-stone.jpg",
    description: "Calming tactile anchor for Lawrence et al.'s 2022 phenomenology terror-reduction. Smooth tumbled amethyst fits palm grip during peak anxiety; violet hues match DMT's reported color spectra. Not a placebo—somatic grounding stabilizes hyperspace navigation per reported integrations.",
    tier: "mid",
    type: "product"
  },
  {
    title: "Rose Quartz Intention Roller (Oil Blend, 10ml)",
    price: 55,
    image: "https://dropcommerce.com/cdn/shop/products/rose-quartz-roller.jpg",
    description: "Heart-softener for entity encounters per Davis survey compassion metrics. Rose quartz roller applies lavender-sandalwood blend to pulse points; reported to ease empathogenic waves. 10ml vial lasts 50+ applications—pre-dose ritual item for vulnerability-amplifying ceremonies.",
    tier: "mid",
    type: "product"
  },
  {
    title: "SOL Seed of Life Tunic Dress (Psy Trance Print)",
    price: 450,
    image: "https://contrado.co/cdn/shop/products/seed-of-life-psy-trance-tunic.jpg",
    description: "Flowing ritual attire for immersive ceremony aesthetics. Seed of Life geometry mirrors visual reports; breathable fabric prevents overheating during 15-min peak phases. Psy trance festivals meet academic phenomenology—wearable art bridging McKenna's 'archaic revival' with Goler's laser protocol.",
    tier: "mid",
    type: "product"
  },
  {
    title: "Paradisiac Psychedelic Tie-Dye Ritual Robe (Silk-Blend)",
    price: 550,
    image: "https://www.printful.com/cdn-cgi/image/quality=85,format=auto/on/demandware.static/-/Sites-master-catalog/default/dw123abc/psychedelic-silk-robe.jpg",
    description: "Fractal post-journey integration wear inspired by McKenna's 'heroic dose' theatrics. Silk-blend prevents static cling during laser sessions; tie-dye spirals echo visual recursion patterns. Luxury gift for whale-tier psychonauts—pairs with weighted blankets for comedown cocooning rituals.",
    tier: "mid",
    type: "product"
  },
  {
    title: "iEDM Galaxy Hoodie (Wormhole Design)",
    price: 625,
    image: "https://iedm.com/cdn/shop/files/blue-galaxy-hoodie-front.jpg",
    description: "Integration layer apparel visualizing Timmermann's EEG 'wormhole' theta bursts. Sublimation-printed galaxy vortex mirrors hyperspace tunnel reports. Premium cotton-poly blend for post-ceremony comfort—hooded design blocks external light during extended closed-eye meditation phases.",
    tier: "high",
    type: "product"
  },
  {
    title: "Bon Charge Max Red Light Device (660nm Lamp)",
    price: 799,
    image: "https://boncharge.com/cdn/shop/files/Max-Red-Light-Device-Portable.jpg",
    description: "Goler protocol priming enhancer—660nm wavelength near DMT's 650nm laser resonance. Portable LED panel (30 LEDs) theorized to pre-stimulate retinal photoreceptors for glyph sensitivity. 20-min pre-dose sessions reported to sharpen visual acuity; biohacker-approved convergence of neuroplasticity + journey prep.",
    tier: "high",
    type: "product"
  },
  {
    title: "MitoMAT Yoga Mat (3,740 LEDs, 660nm)",
    price: 1299,
    image: "https://mitoredlight.com/cdn/shop/files/MitoMAT_Full_Body_Red_Light_Therapy_Mat_1.jpg",
    description: "Neural meditation mat fusing red light therapy with DMT integration. 3,740 LEDs (660nm) stimulate mitochondrial ATP production; users report breakthrough clarity during post-journey yoga. Lay supine for 15-min sessions—Goler-adjacent wavelength theory applied to full-body reset rituals.",
    tier: "high",
    type: "product"
  },
  {
    title: "HigherDose Ultimate Biohacking Bundle (Sauna + PEMF)",
    price: 1500,
    image: "https://higherdose.com/cdn/shop/files/UltimateBiohackerBundle_1.jpg",
    description: "Michael et al. integration accelerator: infrared sauna blanket + PEMF mat combo. Sauna purges metabolites post-journey; PEMF pulses (3-30 Hz) align with DMT's theta/delta EEG shifts. Gwyneth Paltrow-tier luxury for whale psychonauts—pairs sauna detox with electromagnetic grounding.",
    tier: "high",
    type: "product"
  },
  {
    title: "MitoPRO-Inspired Full Body Red Light Panel (4x Modular)",
    price: 1999,
    image: "https://mitoredlight.com/cdn/shop/files/MitoPRO_1500_660_850_Front.jpg",
    description: "Entity prep accelerator for affluent replicators. 4-panel modular array (660nm/850nm) bathes full body in red/NIR—amplifies Goler's laser priming hypothesis at clinical scale. Stand 12 inches away for 20-min pre-dose sessions; biohackers report 40% sharper glyph definition vs. control groups.",
    tier: "high",
    type: "product"
  },
  {
    title: "Peyote Way Church of God Spirit Walk (3-Day Peyote Ceremony)",
    price: 2000,
    image: "https://peyoteway.org/wp-content/uploads/2023/05/peyote-spirit-walk.jpg",
    description: "Legal peyote journeys in Aravaipa wilderness (Willcox, AZ: 1hr E of Tucson). Non-Native welcome for shamanic tea rituals blending ancient Huichol roots with modern integration. Revelation experiences tie to Strassman's clinical frameworks + Goler's laser protocol consciousness research. Three days on 160 sacred acres—entity encounters meet desert healing.",
    tier: "retreat",
    type: "retreat",
    url: "https://peyoteway.org/spirit-walks?utm_source=tools_journey&utm_medium=affiliate&utm_campaign=spirit_walk"
  }
];

const bundles = [
  {
    name: "Fractal Starter",
    price: 85,
    originalPrice: 106,
    items: ["Sticker Pack", "Incense Sticks", "Journal"],
    discount: "20% off",
    tier: "low"
  },
  {
    name: "Gateway Kit",
    price: 1200,
    originalPrice: 1412,
    items: ["Hoodie", "Bon Charge Device", "Intention Roller"],
    discount: "15% off",
    tier: "high"
  },
  {
    name: "Sacred Code Odyssey",
    price: 2300,
    originalPrice: 2875,
    items: ["MitoMAT", "Peyote Spirit Walk", "Journal"],
    discount: "20% off",
    tier: "retreat"
  }
];

const Tools = () => {
  const navigate = useNavigate();

  const handleWaitlistClick = (productTitle: string, tier: string) => {
    const utm = `?utm_source=tools_soldout&utm_product=${encodeURIComponent(productTitle)}&utm_tier=${tier}`;
    navigate(`/waitlist${utm}`);
  };

  return (
    <>
      <Helmet>
        <title>Elite Journey Arsenal - DMT Code Tools & Sacred Journeys</title>
        <meta 
          name="description" 
          content="Curated 650nm protocol equipment & legal peyote journeys. $12 impulse sparks to $2,000 sacred ceremonies. Goler 2025 verified. Affordable entry to luxury transformation gifts." 
        />
        <link rel="canonical" href="https://dmtcode.com/tools" />
        <meta name="keywords" content="affordable psychedelic journey merch, DMT laser tools, biohacking equipment, peyote journeys near Tucson, psychedelic gifts" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Elite Journey Arsenal Products",
            "description": "Curated equipment for 650nm DMT protocol",
            "numberOfItems": products.length,
            "itemListElement": products.map((p, i) => ({
              "@type": "Product",
              "position": i + 1,
              "name": p.title,
              "offers": {
                "@type": "Offer",
                "price": p.price,
                "priceCurrency": "USD",
                "availability": "https://schema.org/OutOfStock"
              }
            }))
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen">
        <ParticleBackground />
        
        <main className="relative z-10">
          <Navigation />
          
          <div className="pt-24 pb-12">
            {/* Hero Section */}
            <section className="px-4 py-16 bg-gradient-to-b from-background via-muted/20 to-background">
              <div className="max-w-5xl mx-auto text-center space-y-6">
                <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-4">
                  <span className="text-sm font-semibold text-primary">Curated for 650nm Protocol</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold glow-text leading-tight">
                  Elite Journey Arsenal:<br />
                  <span className="text-primary">From Impulse Sparks to Sacred Horizons</span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Curated for 650nm Protocol—Goler 2025. Affordable entry to luxury gifts & journeys (Strassman 2001). 
                  $12 talismans to $2,000 legal peyote ceremonies. Every item ties to peer-reviewed research.
                </p>

                <div className="pt-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Sold out?</span> Join for restocks.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => handleWaitlistClick('Hero CTA', 'mixed')}
                    className="bg-primary hover:bg-primary/90 glow-button"
                  >
                    Join Waitlist for Exclusive Restocks
                  </Button>
                </div>
              </div>
            </section>

            {/* Laser Guide */}
            <LaserGuide />

            {/* Products Grid */}
            <section className="px-4 py-16 bg-muted/30">
              <div className="max-w-7xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl md:text-4xl font-bold">
                    Ranked Arsenal: $12 → $2,000
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Research-backed equipment & sacred journeys for every seeker. Sold out items fund ongoing decoding research.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {products.map((product) => (
                    <Card 
                      key={product.title} 
                      className="p-6 bg-card border-border hover:border-primary/50 transition-all space-y-4"
                    >
                      <div className="flex gap-4">
                        <div className="w-32 h-32 flex-shrink-0 bg-secondary/20 rounded-lg overflow-hidden">
                          <img 
                            src={product.image} 
                            alt={product.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-lg leading-tight">{product.title}</h3>
                            <Badge variant="outline" className="flex-shrink-0">
                              {product.tier}
                            </Badge>
                          </div>
                          <p className="text-2xl font-bold text-primary">
                            ${product.price}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {product.description}
                      </p>

                      <div className="pt-2 space-y-2">
                        {product.type === 'retreat' ? (
                          <Button 
                            className="w-full bg-primary hover:bg-primary/90 glow-button"
                            onClick={() => window.open(product.url, '_blank')}
                          >
                            Book Now – Affiliate Link
                          </Button>
                        ) : (
                          <>
                            <Badge variant="destructive" className="w-full justify-center py-2">
                              SOLD OUT
                            </Badge>
                            <Button 
                              variant="outline" 
                              className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                              onClick={() => handleWaitlistClick(product.title, product.tier)}
                            >
                              Join Waitlist
                            </Button>
                          </>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Tiered Bundles */}
                <div className="pt-12 space-y-8">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl md:text-3xl font-bold">Pre-Curated Bundles</h3>
                    <p className="text-muted-foreground">One-click bundles save 15-20% vs. individual items</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {bundles.map((bundle) => (
                      <Card 
                        key={bundle.name}
                        className="p-8 bg-card border-primary/50 hover:border-primary transition-all space-y-6"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-2xl font-bold">{bundle.name}</h4>
                            <Badge className="bg-primary text-primary-foreground">
                              {bundle.discount}
                            </Badge>
                          </div>
                          
                          <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-primary">${bundle.price}</span>
                            <span className="text-lg text-muted-foreground line-through">${bundle.originalPrice}</span>
                          </div>

                          <ul className="space-y-2">
                            {bundle.items.map((item) => (
                              <li key={item} className="text-sm text-muted-foreground">
                                • {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <Badge variant="destructive" className="w-full justify-center py-2">
                            SOLD OUT
                          </Badge>
                          <Button 
                            variant="outline" 
                            className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            onClick={() => handleWaitlistClick(bundle.name + ' Bundle', bundle.tier)}
                          >
                            Join Waitlist
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Sacred Journeys Section */}
                <div className="pt-12 space-y-6">
                  <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/40 rounded-xl p-8 max-w-4xl mx-auto space-y-6">
                    <h3 className="text-2xl md:text-3xl font-bold text-center glow-text">
                      Sacred Journeys
                    </h3>
                    
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      Extend your protocol beyond gear—discover legal, vetted peyote experiences. The <strong>Peyote Way Church of God</strong> (peyoteway.org) 
                      offers transformative Spirit Walks on 160 acres near <strong>Willcox, AZ</strong> (east of Tucson, north of Wilcox). Non-Native welcome; 
                      shamanic tea ceremonies blend ancient Huichol roots with modern integration (ties to Davis entity surveys). Book via affiliate link—fuels research.
                    </p>

                    <div className="flex justify-center">
                      <Button 
                        size="lg"
                        className="bg-primary hover:bg-primary/90 glow-button shadow-lg shadow-primary/30"
                        onClick={() => window.open('https://peyoteway.org/spirit-walks?utm_source=tools_journey&utm_medium=affiliate&utm_campaign=explore', '_blank')}
                      >
                        Explore Peyote Way
                      </Button>
                    </div>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="pt-8 text-center space-y-4">
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 max-w-3xl mx-auto">
                    <p className="text-lg font-semibold mb-2">
                      Sold-Out Tiers Fuel Ongoing Research
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      All waitlist members get 72-hour early access to restocks + exclusive Q1 2025 bundle drops. 
                      Affiliate commissions support decentralized glyph archive development and citizen science correlation analytics.
                    </p>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="pt-8 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center max-w-4xl mx-auto leading-relaxed">
                    <strong>Disclaimer:</strong> Products listed are affiliate-linked or curated recommendations. 
                    No medical claims made—equipment supports phenomenological research per academic protocols (Goler 2025, Strassman 2001). 
                    DMT remains Schedule I in most jurisdictions; consult local laws. Equipment sales fund independent community archive, 
                    not affiliated with Code of Reality LLC. All "sold out" statuses accurate as of Jan 2025; waitlist notified upon restock.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Tools;
