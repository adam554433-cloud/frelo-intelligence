// Frelo brand context — canonical source of truth for all LLM prompts.
// When the brand evolves, update here and propagate via git.

export const BRAND_CONTEXT = `
BRAND: frelo — "fuel your body. treat your taste."
COMPANY: Ad Holds LLC

WHAT FRELO IS:
frelo is a food-first wellness brand that delivers clinical nutrition through a dark chocolate treat. NOT a supplement that tastes okay — it's an indulgent daily ritual that happens to deliver serious nutrition. One ball per day = 5g Creavitalis creatine monohydrate + 6g prebiotic inulin fiber from chicory root + Himalayan Pink Salt for enhanced absorption.

COMPETITIVE POSITIONING:
frelo competes in the CREATINE category, not chocolate. Competitors are creatine powders (Optimum, MyProtein), pills, and gummies (Create Wellness). frelo wins on every dimension: full 5g clinical dose (gummies only give 2-3g), real food taste (not chalky/artificial), enhanced absorption via salt-activated SLC6A8 transporter, gut health from 6g fiber, and brain benefits.

THE FRELO DELIVERY ADVANTAGE:
Himalayan Pink Salt activates the SLC6A8 creatine transporter — driving creatine directly into muscle and brain cells. Combined with prebiotic fiber, this creates a delivery matrix standard powders cannot replicate. More absorbed, less wasted, zero bloat.

5 KEY BENEFITS:
1. Muscle & Strength — 5g clinical dose, 700+ studies, ~2.5 lbs lean muscle in 8-12 weeks
2. Brain & Memory — improves memory and executive function, especially in 65+, brain fuel source
3. Recovery — reduces oxidative stress, replenishes glycogen, supports immune function
4. Gut Health — 6g prebiotic inulin fiber, 19% Daily Value, feeds beneficial gut bacteria
5. Enhanced Delivery — salt-activated transporter + fiber matrix = superior absorption, zero bloat

TARGET AVATARS (seed — the Intelligence Engine will discover more):
Avatar 1 — The Conscious Vegan (30-50): Plant-based diets have near-zero dietary creatine. Vegans show 2x greater supplementation response. They want clean ingredients, no animal products, artisan food brand energy — NOT gym brand.
Avatar 2 — The Aging Vitalist (55-75): Sarcopenia affects 1 in 3 adults over 60. Creatine + brain benefits = daily defense against aging. They want premium, elegant, doctor-adjacent credibility. A treat, not medicine.
Avatar 3 — The Performance Professional (28-45): Knowledge workers who want cognitive + physical performance without gym-bro branding. Convenience, science, the 'treat yourself' moment.

BRAND VOICE:
Warm, knowledgeable, unpretentious. Like a brilliant friend who knows nutrition and makes you a chocolate treat while explaining why it's good for you.
DO: Warm and specific, sensory-first ("Rich. Fudgy. A little crumbly."), inclusive, empowering
DON'T: Gym-bro ("CRUSH your goals"), clinical jargon, fear-based, exclusive

BRAND PROMISE: The daily treat that genuinely fuels you — not just your muscles, but your brain, your gut, and your whole body.

CORE INSIGHT: The best supplement is the one you actually take. Every single day. frelo's advantage isn't just the formula — it's the ritual. Consistency produces results.

FLAVORS: Dark Chocolate (core, gold #B9923B), Cinnamon (warm, amber #C8591A), Vanilla (elegant, plum #5C3080)

LEGAL COMPLIANCE (DSHEA):
ALLOWED: "Supports muscle strength", "Supports cognitive performance and memory", "Supports digestive health", "Supports recovery after exercise", "Excellent source of dietary fiber"
FORBIDDEN: Disease claims, "treats/cures/prevents", "FDA approved", "pharmaceutical grade", fear-based claims about disease

KNOWN COMPETITORS TO TRACK:
- Create Wellness (trycreate.co) — gummies, DTC
- Optimum Nutrition — creatine powder, mass market
- MyProtein — creatine powder, UK-based
- Thorne — premium clinical
- Transparent Labs — clean-label powder
`.trim();

export const FRELO_BENEFITS = [
  "muscle_strength",
  "brain_memory",
  "recovery",
  "gut_health",
  "delivery_absorption",
] as const;

export type FreloBenefit = (typeof FRELO_BENEFITS)[number];

export const COMPETITORS = [
  "Create Wellness",
  "Optimum Nutrition",
  "MyProtein",
  "Thorne",
  "Transparent Labs",
  "Create",
  "Animal Pak",
  "Kaged",
] as const;
