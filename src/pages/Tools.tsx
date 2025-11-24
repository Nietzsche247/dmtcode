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
    image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809",
    description: "Visual documentation aids for research sessions—fractal adhesive tokens supporting visual pattern recognition during N,N-DMT administration. Layer them on research spaces or journals to reference Timmermann's 2019 neural oscillation patterns. Holographic vinyl withstands humidity, reflecting laser speckle in ambient light. Entry-level documentation support item.",
    tier: "low",
    type: "product"
  },
  {
    title: "Research Intention Card Deck (Mini, 22-Card)",
    price: 15,
    image: "https://images.unsplash.com/photo-1580130775522-0b9d5b7c2565",
    description: "Intention prompts for Davis et al.'s 2021 phenomenological experience surveys. Each card poses pre-session questions (e.g., 'What aspects do you seek to observe?') aligning with research frameworks. Pocket-sized for travel, designed for solo or group preparation sessions. Structured research prompts for documentation.",
    tier: "low",
    type: "product"
  },
  {
    title: "Sacred Geometry Incense Sticks (Palo Santo Blend, 10-Pack)",
    price: 18,
    image: "https://images.unsplash.com/photo-1583481839300-e3e5b4c1e0b5",
    description: "Grounding aromatherapy for clinical preparation phases per Strassman's 2001 research protocols. Palo santo smoke provides calming atmosphere pre-session; geometric packaging references visual pattern documentation. Burns 30 min per stick—ideal for extended integration sessions post-experience. Preparation aromatherapy for 650 nm sessions.",
    tier: "low",
    type: "product"
  },
  {
    title: "Custom Psychedelic Journal (Fractal Cover, Guided)",
    price: 22,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    description: "Documentation notebook for Michael et al.'s 2021 thematic analysis methodologies. Guided prompts capture visual symbol sketches, phenomenological observations, color shifts. Fractal mandala cover supports pattern recognition. 150 acid-free pages for archival research logs—compatible with Goler's 2025 protocol documentation standards. Post-experience integration notebook.",
    tier: "low",
    type: "product"
  },
  {
    title: "Amethyst Worry Stone (Tumbled, Palm-Sized)",
    price: 45,
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176",
    description: "Calming tactile anchor for Lawrence et al.'s 2022 phenomenology anxiety-reduction methodologies. Smooth tumbled amethyst fits palm grip during peak experience phases; violet hues correspond to N,N-DMT's reported color spectra. Somatic grounding supports subjective experience stabilization per reported integrations. Palm anchor during 650 nm observation.",
    tier: "mid",
    type: "product"
  },
  {
    title: "Rose Quartz Intention Roller (Oil Blend, 10ml)",
    price: 55,
    image: "https://images.unsplash.com/photo-1587376969818-f1d2e6c79b00",
    description: "Calming preparation item for phenomenological experiences per Davis survey frameworks. Rose quartz roller applies lavender-sandalwood blend to pulse points; reported to support emotional openness. 10ml vial lasts 50+ applications—pre-session preparation item for documented experience quality. Essential oil primer for experience preparation.",
    tier: "mid",
    type: "product"
  },
  {
    title: "SOL Seed of Life Tunic Dress (Psy Trance Print)",
    price: 450,
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050",
    description: "Flowing research session attire for immersive study aesthetics. Seed of Life geometry corresponds to reported visual patterns; breathable fabric prevents overheating during 15-min peak phases. Academic phenomenology meets practical research wear—wearable art connecting documented visual frameworks with Goler's laser protocol. Ethical fabrics for extended observation sessions.",
    tier: "mid",
    type: "product"
  },
  {
    title: "Paradisiac Psychedelic Tie-Dye Ritual Robe (Silk-Blend)",
    price: 550,
    image: "https://images.unsplash.com/photo-1564709686824-33d194ab2796",
    description: "Post-experience integration wear inspired by documented phenomenological frameworks. Silk-blend prevents static cling during laser sessions; tie-dye spirals echo reported visual recursion patterns. Premium gift for serious researchers—pairs with weighted blankets for recovery period comfort. Handmade silk for post-session recovery.",
    tier: "high",
    type: "product"
  },
  {
    title: "iEDM Galaxy Hoodie (Wormhole Design)",
    price: 625,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    description: "Integration period apparel referencing Timmermann's EEG theta wave research. Sublimation-printed galaxy design corresponds to reported visual tunnel phenomena. Premium cotton-poly blend for post-session comfort—hooded design blocks external light during extended closed-eye observation phases. Organic cotton for research documentation wear.",
    tier: "high",
    type: "product"
  },
  {
    title: "Bon Charge Max Red Light Device (660nm Lamp)",
    price: 799,
    image: "https://images.unsplash.com/photo-1612872087729-bb6e2f5b7e5f",
    description: "Goler protocol preparation enhancer—660 nm wavelength near N,N-DMT's 650 nm laser resonance. Portable LED panel (30 LEDs) theorized to pre-stimulate retinal photoreceptors for visual symbol sensitivity. 20-min pre-session applications reported to support visual acuity; research-approved convergence of neuroplasticity and session preparation. Portable lamp for targeted neural preparation.",
    tier: "high",
    type: "product"
  },
  {
    title: "MitoMAT Yoga Mat (3,740 LEDs, 660nm)",
    price: 1299,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
    description: "Neural meditation mat combining red light therapy with N,N-DMT integration research. 3,740 LEDs (660 nm) stimulate mitochondrial ATP production; users report enhanced clarity during post-session yoga practice. Lay supine for 15-min sessions—Goler-adjacent wavelength theory applied to full-body preparation protocols. LED mat supports laser preparation for enhanced observation.",
    tier: "high",
    type: "product"
  },
  {
    title: "HigherDose Ultimate Biohacking Bundle (Sauna + PEMF)",
    price: 1500,
    image: "https://images.unsplash.com/photo-1606890658317-7d14490b76fd",
    description: "Michael et al. integration accelerator enhancing infrared sauna recovery with PEMF electromagnetic field therapy. Infrared wavelengths support metabolite clearance post-experience; PEMF pulses (3-30 Hz) theoretically align with N,N-DMT's reported theta/delta EEG shifts per Timmermann 2019. Premium wellness bundle pairing thermal detoxification with grounding electromagnetic stimulation. PEMF resets echo Strassman's clinical integration frameworks for extended recovery phases.",
    tier: "high",
    type: "product"
  },
  {
    title: "MitoPRO-Inspired Full Body Red Light Panel (4x Modular)",
    price: 1999,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
    description: "Premium research preparation system for serious investigators. 4-panel modular array (660 nm/850 nm) provides full-body red/NIR exposure—amplifies Goler's laser preparation hypothesis at clinical scale. Stand 12 inches away for 20-min pre-session applications; researchers report enhanced visual symbol definition vs. control groups. Modular 660 nm for whole-body phenomenological preparation.",
    tier: "high",
    type: "product"
  },
  {
    title: "Peyote Way Church of God Spirit Walk (3-Day Peyote Ceremony)",
    price: 2000,
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
    description: "Legal peyote experiences in Aravaipa wilderness (Willcox, AZ: 1hr E of Tucson). Non-Native welcome for ceremonial experiences blending ancient Huichol roots with modern integration methodologies. Documented experiences tie to Strassman's clinical frameworks and Goler's laser protocol consciousness research. Three days on 160 acres—phenomenological observation meets traditional ceremonial practice. Ceremonial experiences for documented research.",
    tier: "retreat",
    type: "retreat",
    url: "https://peyoteway.org/spirit-walks?utm_source=tools_journey&utm_medium=affiliate&utm_campaign=dmtcode"
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
    name: "Extended Symbol Kit",
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
        <title>Research Equipment - DMT Code Visual Symbol Catalogue</title>
        <meta 
          name="description" 
          content="Curated 650 nm protocol equipment and research tools. $12 entry items to $2,000 research experiences. Verified equipment for symbol documentation." 
        />
        <link rel="canonical" href="https://dmtcode.com/tools" />
        <meta name="keywords" content="affordable psychedelic journey merch, DMT laser tools, biohacking equipment, peyote journeys near Tucson, psychedelic gifts, 650nm neural priming mat, DMT code reality tools" />
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
                  Research Equipment Catalogue:<br />
                  <span className="text-primary">From Entry Items to Research Experiences</span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Curated for 650 nm Protocol—Goler 2025. Entry-level to premium research equipment (Strassman 2001). 
                  Limited stock—join waitlist for exclusives. $12 items to $2,000 legal research experiences.
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
                    Research Equipment: $12 → $2,000
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Research-backed equipment and experiences for every researcher. Sold out items fund ongoing symbol cataloguing research.
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
                            alt={`DMT code journey ${product.title} - ${product.tier} tier biohacking equipment`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-lg leading-tight line-clamp-2">{product.title}</h3>
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
                              Join Waitlist for Restock
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
                  <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/40 rounded-xl p-8 max-w-4xl mx-auto space-y-6 shadow-lg shadow-primary/20">
                    <h2 className="text-2xl md:text-3xl font-bold text-center glow-text">
                      Research Experiences
                    </h2>
                    
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      Extend your protocol beyond equipment—discover legal, vetted peyote experiences. The <strong>Peyote Way Church of God</strong> (peyoteway.org) 
                      offers Spirit Walks on 160 acres near <strong>Willcox, AZ</strong> (east of Tucson, north of Wilcox). Non-Native welcome; 
                      ceremonial experiences blend ancient Huichol roots with modern integration (ties to Davis phenomenology surveys). Book via affiliate link—supports research.
                    </p>

                    <div className="flex justify-center">
                      <Button 
                        size="lg"
                        className="bg-primary hover:bg-primary/90 glow-button shadow-lg shadow-primary/30"
                        onClick={() => window.open('https://peyoteway.org/spirit-walks?utm_source=tools_journey&utm_medium=affiliate&utm_campaign=dmtcode', '_blank')}
                      >
                        Explore Peyote Way
                      </Button>
                    </div>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="pt-8 text-center space-y-4">
                  <div className="bg-destructive/20 border-2 border-destructive/50 rounded-lg p-8 max-w-4xl mx-auto shadow-lg shadow-destructive/20">
                    <p className="text-xl md:text-2xl font-bold mb-4 text-foreground">
                      All Items Sold Out—Purchases Support Research
                    </p>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
                      All waitlist members get 72-hour early access to restocks + exclusive Q1 2025 bundle drops.
                      Affiliate commissions support symbol cataloguing research and open data infrastructure.
                    </p>
                    <Button 
                      size="lg"
                      className="bg-primary hover:bg-primary/90 glow-button"
                      onClick={() => navigate('/waitlist?utm_source=tools_cta&utm_campaign=soldout')}
                    >
                      Get First Dibs—Join Waitlist
                    </Button>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="pt-8 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center max-w-4xl mx-auto leading-relaxed">
                    <strong>Affiliate Disclosure:</strong> Affiliate commissions support symbol cataloguing.
                    No medical claims made—equipment supports phenomenological research per academic protocols (Goler 2025, Strassman 2001). 
                    N,N-DMT remains Schedule I in most jurisdictions; consult local laws. Equipment sales fund community symbol catalogue. 
                    All "sold out" statuses accurate as of Nov 2025; waitlist notified upon restock.
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
