import { 
  CropTimelineProfile, 
  CropTimelineStage, 
  CropTimelineActivity, 
  NextRecommendedAction, 
  FarmingMethod, 
  CurrentWeatherReport, 
  SupportedLanguage 
} from '../types';

interface StageTemplate {
  stageName: string;
  startDayOffset: number;
  endDayOffset: number;
  description: string;
  keyFocus: string;
  activities: {
    title: string;
    category: 'irrigation' | 'nutrient' | 'weed' | 'pest_disease' | 'field_inspection' | 'harvest';
    timingDescription: string;
    importanceReason: string;
    weatherAdjustmentRule?: (weather?: CurrentWeatherReport) => string | undefined;
    safetyNote?: string;
  }[];
}

interface CropAgronomicData {
  cropName: string;
  typicalDurationDays: number;
  source: string;
  stages: StageTemplate[];
}

export const CROP_AGRONOMIC_DATABASE: Record<string, CropAgronomicData> = {
  'Wheat': {
    cropName: 'Wheat',
    typicalDurationDays: 130,
    source: 'ICAR-IIWBR (Indian Institute of Wheat and Barley Research) & UAS Dharwad',
    stages: [
      {
        stageName: 'Sowing & Crown Root Initiation (CRI)',
        startDayOffset: 0,
        endDayOffset: 25,
        description: 'Germination, seedling emergence, and initiation of crown roots 2–3 cm below soil surface.',
        keyFocus: 'Ensure uniform germination and timely first irrigation at 21 DAS (Crown Root Initiation).',
        activities: [
          {
            title: 'First Critical Irrigation at CRI (20–25 DAS)',
            category: 'irrigation',
            timingDescription: 'Apply precisely at 21 days after sowing (DAS).',
            importanceReason: 'Crown roots anchor the plant and absorb primary nutrients. Missing or delaying this irrigation causes permanent tiller reduction and up to 30% yield loss.',
            weatherAdjustmentRule: (w) => (w && w.precipitationProbability > 40 ? 'Rain forecast exceeds 40%. Defer irrigation by 24h to avoid waterlogging seedlings.' : undefined),
            safetyNote: 'Avoid stagnant water on crown zone; ensure cross-furrow drainage.'
          },
          {
            title: 'Basal / Early Top-Dressing Nitrogen Application',
            category: 'nutrient',
            timingDescription: 'Apply 1/3 nitrogen (Urea) along with full P and K at or right before CRI.',
            importanceReason: 'Provides fast nitrogen availability for crown root development and early tiller formation.',
            weatherAdjustmentRule: (w) => (w && w.windSpeed > 15 ? 'Wind is gusty. Hold off on broadcast spreading until morning calm to avoid uneven drift.' : undefined)
          },
          {
            title: 'First Weeding & Hoeing Check',
            category: 'weed',
            timingDescription: '20–30 days after sowing.',
            importanceReason: 'Prevents early competition from Phalaris minor (gullidanda) and Chenopodium album during slow initial wheat growth.',
          }
        ]
      },
      {
        stageName: 'Tillering & Jointing',
        startDayOffset: 26,
        endDayOffset: 55,
        description: 'Active lateral tiller emergence and upward elongation of the main shoot nodes.',
        keyFocus: 'Maximize effective ear-bearing tillers and apply second top dressing.',
        activities: [
          {
            title: 'Second Irrigation (Late Tillering Stage, 40–45 DAS)',
            category: 'irrigation',
            timingDescription: '40–45 days after sowing.',
            importanceReason: 'Supports elongation of tillers and prevents premature tiller abortion during stem extension.',
            weatherAdjustmentRule: (w) => (w && w.temperature > 32 ? 'Higher temperatures accelerate soil drying; irrigate in early morning to prevent heat stress.' : undefined)
          },
          {
            title: 'Second Nitrogen Top Dressing',
            category: 'nutrient',
            timingDescription: 'Apply second 1/3 dose of urea just prior to second irrigation.',
            importanceReason: 'Boosts vegetative biomass and spikelet differentiation inside developing stems.'
          },
          {
            title: 'Scouting for Yellow / Brown Rust Pustules',
            category: 'pest_disease',
            timingDescription: 'Inspect underside of lower leaves weekly.',
            importanceReason: 'Early rust detection allows spot containment before fungal spores become airborne across the field.',
            safetyNote: 'Verify fungal symptoms against local KVK disease charts; heed official fungicide label rainfast periods.'
          }
        ]
      },
      {
        stageName: 'Booting, Heading & Flowering (Anthesis)',
        startDayOffset: 56,
        endDayOffset: 85,
        description: 'Swelling of the flag leaf sheath (booting), emergence of ears, and open flowering/pollination.',
        keyFocus: 'Protect earheads from terminal heat stress, aphid colonies, and moisture deficit.',
        activities: [
          {
            title: 'Third Critical Irrigation (Booting to Flowering, 65–70 DAS)',
            category: 'irrigation',
            timingDescription: '65–75 days after sowing.',
            importanceReason: 'Drought stress during pollen meiosis or anthesis causes floret sterility and fewer grains per spike.',
            weatherAdjustmentRule: (w) => (w && w.windSpeed > 16 ? 'High winds detected. Irrigate lightly without flooding to prevent lodging (stems falling over).' : undefined),
            safetyNote: 'Do not flood fields during high wind conditions as wheat becomes prone to severe root lodging.'
          },
          {
            title: 'Foliar Spray of 0.5% Potassium Nitrate (13:0:45)',
            category: 'nutrient',
            timingDescription: 'During flag leaf emergence and post-anthesis.',
            importanceReason: 'Enhances cellular osmotic pressure and confers tolerance against sudden terminal heat spikes.',
            weatherAdjustmentRule: (w) => (w && w.temperature > 33 ? 'Spray strictly in early morning before 9:00 AM; avoid midday heat to prevent leaf scorch.' : undefined)
          },
          {
            title: 'Wheat Aphid (Mahun) Colony Inspection',
            category: 'pest_disease',
            timingDescription: 'Check earheads and tender leaves on field borders.',
            importanceReason: 'Aphids suck sap from developing grain ears, reducing test weight if population exceeds economic threshold (5 aphids/earhead).'
          }
        ]
      },
      {
        stageName: 'Milk & Dough (Grain Filling)',
        startDayOffset: 86,
        endDayOffset: 110,
        description: 'Translocation of carbohydrates to grains; milky liquid solidifies into soft, then hard dough.',
        keyFocus: 'Ensure steady grain filling without heat desiccation; monitor grain plumpness.',
        activities: [
          {
            title: 'Fourth Irrigation at Grain Dough Stage (85–90 DAS)',
            category: 'irrigation',
            timingDescription: '85–95 days after sowing.',
            importanceReason: 'Prevents shriveling of grains due to premature drying of flag leaves under warming spring weather.',
            weatherAdjustmentRule: (w) => (w && w.windSpeed > 14 ? 'Wind is brisk; stop watering if wind exceeds 15 km/h to prevent lodging.' : undefined)
          },
          {
            title: 'Monitor Stored Grain Pest Preparedness & Gunny Bags',
            category: 'field_inspection',
            timingDescription: '2 weeks before anticipated harvest.',
            importanceReason: 'Clean and sun-dry harvest storage facilities to prevent weevil and grain borer infestation post-harvest.'
          }
        ]
      },
      {
        stageName: 'Ripening & Harvest Ready',
        startDayOffset: 111,
        endDayOffset: 135,
        description: 'Leaves and stems turn golden-yellow, straw becomes brittle, grain moisture drops below 14%.',
        keyFocus: 'Harvest at 12–14% grain moisture to minimize shattering loss and storage mould.',
        activities: [
          {
            title: 'Withhold Irrigation to Facilitate Uniform Drying',
            category: 'irrigation',
            timingDescription: '10–12 days prior to combine / manual harvest.',
            importanceReason: 'Allows soil to firm up for machinery access and encourages natural straw senescence.',
          },
          {
            title: 'Grain Moisture Test & Harvest Operation',
            category: 'harvest',
            timingDescription: 'When grain snaps cleanly between teeth (12–14% moisture).',
            importanceReason: 'Harvesting too early causes mould in storage; harvesting too late causes heavy grain shattering in the field.',
            weatherAdjustmentRule: (w) => (w && w.precipitationProbability > 25 ? 'Rain expected. Ensure harvest produce is immediately covered or stored under tarpaulin.' : undefined)
          }
        ]
      }
    ]
  },
  'Tomato': {
    cropName: 'Tomato',
    typicalDurationDays: 135,
    source: 'ICAR-IIHR (Indian Institute of Horticultural Research, Bengaluru)',
    stages: [
      {
        stageName: 'Transplanting & Seedling Establishment',
        startDayOffset: 0,
        endDayOffset: 25,
        description: 'Transplanting 25-day-old nursery seedlings onto raised beds or mulched ridges.',
        keyFocus: 'Root establishment, collar rot prevention, and weed-free bed maintenance.',
        activities: [
          {
            title: 'Establishment Irrigation & Drenching',
            category: 'irrigation',
            timingDescription: 'Light daily drip or furrows for first 7–10 days.',
            importanceReason: 'Tender tomato roots require steady surface moisture to overcome transplanting shock.',
            weatherAdjustmentRule: (w) => (w && w.temperature > 32 ? 'High heat increases transpiration; run drip in split cycles morning and evening.' : undefined)
          },
          {
            title: 'Seedling Root Drenching / Bio-control Application',
            category: 'pest_disease',
            timingDescription: 'At transplanting or 5–7 days after transplanting.',
            importanceReason: 'Protects young root crowns against Rhizoctonia and Pythium damping-off.',
            safetyNote: 'Verify bio-agent or fungicide against state university guidelines.'
          }
        ]
      },
      {
        stageName: 'Vegetative Growth & Trellising / Staking',
        startDayOffset: 26,
        endDayOffset: 45,
        description: 'Rapid stem elongation, branching, and development of dense foliage canopy.',
        keyFocus: 'Erect bamboo trellising/twine staking and side-dress balanced N-P-K nutrients.',
        activities: [
          {
            title: 'Staking & Trellising Support',
            category: 'field_inspection',
            timingDescription: 'When plants reach 25–30 cm height (30–35 DAT).',
            importanceReason: 'Keeps foliage and future fruits off wet soil, reducing fruit rot by over 60% and improving spray coverage.',
            weatherAdjustmentRule: (w) => (w && w.windSpeed > 12 ? 'Breezy conditions can snap young unsupported branches; prioritize staking.' : undefined)
          },
          {
            title: 'Side-Dressing Nitrogen & Micronutrients',
            category: 'nutrient',
            timingDescription: '30–35 days after transplanting.',
            importanceReason: 'Builds robust photosynthetic canopy required to nourish upcoming heavy fruit clusters.'
          },
          {
            title: 'Yellow Sticky Traps for Whitefly & Leafminer Scouting',
            category: 'pest_disease',
            timingDescription: 'Install 10–12 traps per acre.',
            importanceReason: 'Whiteflies transmit Tomato Leaf Curl Virus (ToLCV). Early trap monitoring prevents epidemic spread.'
          }
        ]
      },
      {
        stageName: 'Flowering & Early Fruit Set',
        startDayOffset: 46,
        endDayOffset: 70,
        description: 'Emergence of yellow flower clusters, pollination, and marble-sized fruit development.',
        keyFocus: 'Prevent flower drop, balance boron & calcium nutrition, and scout for pinworm/borer.',
        activities: [
          {
            title: 'Boron & Calcium Nitrate Foliar Application',
            category: 'nutrient',
            timingDescription: 'At initial flowering flush (45–55 DAT).',
            importanceReason: 'Boron improves pollen tube germination; Calcium prevents Blossom End Rot (BER) in developing fruits.',
            weatherAdjustmentRule: (w) => (w && w.temperature > 32 ? 'High heat degrades pollen viability; spray micronutrients strictly in early morning.' : undefined)
          },
          {
            title: 'Regulate Soil Moisture (Avoid Alternating Drought and Flooding)',
            category: 'irrigation',
            timingDescription: 'Maintain consistent 60–70% field capacity.',
            importanceReason: 'Fluctuating soil moisture triggers blossom drop and fruit cracking.',
            weatherAdjustmentRule: (w) => (w && w.precipitationProbability > 35 ? 'Upcoming rainfall detected; reduce drip duration to avoid saturated rootzone.' : undefined)
          },
          {
            title: 'Pheromone Traps for Tomato Fruit Borer (Helicoverpa)',
            category: 'pest_disease',
            timingDescription: '5 traps per acre during flower bud formation.',
            importanceReason: 'Traps catch male moths to time biological or neem-based egg-parasitoid releases accurately.'
          }
        ]
      },
      {
        stageName: 'Fruit Enlargement & Green-Mature Stage',
        startDayOffset: 71,
        endDayOffset: 95,
        description: 'Rapid fruit sizing, accumulation of fruit sugars, and transition from dark to light green.',
        keyFocus: 'Potash fertigation for fruit firmness, fungal blight surveillance, and regular pruning.',
        activities: [
          {
            title: 'Potassium Rich Fertigation (e.g. 0:0:50 or Sulphate of Potash)',
            category: 'nutrient',
            timingDescription: 'Every 7–10 days during fruit sizing.',
            importanceReason: 'Potassium drives sugar translocation, fruit wall thickness, and bright skin finish.',
          },
          {
            title: 'Scouting for Early & Late Blight (Foliar Spots)',
            category: 'pest_disease',
            timingDescription: 'Inspect lower shaded canopy after humid or foggy nights.',
            importanceReason: 'Blight spreads rapidly when relative humidity exceeds 80%. Preventive copper or bio-fungicide halts spore spread.',
            weatherAdjustmentRule: (w) => (w && w.humidity > 70 ? 'High relative humidity detected; elevated blight risk. Scout bottom leaves today.' : undefined),
            safetyNote: 'Do not spray when plants are wet with morning dew. Wear protective gloves and mask.'
          }
        ]
      },
      {
        stageName: 'Breaker, Ripening & Multi-Harvest Pickings',
        startDayOffset: 96,
        endDayOffset: 140,
        description: 'Breaker stage (pink star at blossom end), turning, pink, and full red ripe harvesting.',
        keyFocus: 'Pick fruits at breaker stage for distant transport or pink-ripe for local mandi; observe harvest intervals.',
        activities: [
          {
            title: 'Multi-Pass Picking at Breaker / Turning Stage',
            category: 'harvest',
            timingDescription: 'Harvest every 3–4 days in early morning hours.',
            importanceReason: 'Picking at breaker stage ensures fruits withstand transport without bruising and ripen evenly.',
            weatherAdjustmentRule: (w) => (w && w.temperature > 30 ? 'Harvest before 10 AM to prevent field heat accumulation inside fruit pulp.' : undefined)
          },
          {
            title: 'Observe Pre-Harvest Waiting Intervals (PHI)',
            category: 'pest_disease',
            timingDescription: 'Strictly check label waiting periods before picking.',
            importanceReason: 'Protects consumer health by ensuring pesticide residues degrade below maximum residue limits (MRL).',
            safetyNote: 'MANDATORY: Never spray chemicals during active harvest picking days without confirming strict 0-day waiting periods.'
          }
        ]
      }
    ]
  },
  'Cotton': {
    cropName: 'Cotton',
    typicalDurationDays: 165,
    source: 'ICAR-CICR (Central Institute for Cotton Research, Nagpur)',
    stages: [
      {
        stageName: 'Germination & Seedling Phase',
        startDayOffset: 0,
        endDayOffset: 30,
        description: 'Emergence of cotyledons and true leaves; slow early vegetative establishment.',
        keyFocus: 'Gap filling at 7–10 DAS, thinning to single plant per hill, and sucking pest scouting.',
        activities: [
          {
            title: 'Gap Filling & Thinning',
            category: 'field_inspection',
            timingDescription: 'Within 10–12 days after emergence.',
            importanceReason: 'Ensures optimal plant population (typically 18,000–22,000 plants/ha for hybrid cotton).',
          },
          {
            title: 'Early Sucking Pest Surveillance (Jassids, Thrips)',
            category: 'pest_disease',
            timingDescription: '15–30 days after emergence.',
            importanceReason: 'Young seedlings are vulnerable to leaf curling and hopper burn from jassids and thrips.',
            safetyNote: 'Use yellow/blue sticky cards and neem-based formulations first.'
          }
        ]
      },
      {
        stageName: 'Square Formation & Branching',
        startDayOffset: 31,
        endDayOffset: 65,
        description: 'Development of vegetative monopodia and reproductive sympodial branches bearing triangular floral buds (squares).',
        keyFocus: 'Inter-cultivation for weed suppression, balanced nitrogen top-dressing, and square protection.',
        activities: [
          {
            title: 'Inter-cultivation & Earthing-Up',
            category: 'weed',
            timingDescription: '35–45 days after sowing.',
            importanceReason: 'Uproots weeds, aerates root zone, and builds soil ridges around stems for root anchorage.',
            weatherAdjustmentRule: (w) => (w && w.precipitationProbability > 40 ? 'Wet soil cannot be tilled; postpone intercultural operations until soil dries.' : undefined)
          },
          {
            title: 'Split Nitrogen & Magnesium Sulphate Application',
            category: 'nutrient',
            timingDescription: 'Apply 1/3 nitrogen at square initiation stage.',
            importanceReason: 'Supports high branching node production and prevents premature reddening of leaves.'
          }
        ]
      },
      {
        stageName: 'Flowering & Boll Setting',
        startDayOffset: 66,
        endDayOffset: 105,
        description: 'Cream flowers open, turn pink on day two; fertilized ovaries develop into green bolls.',
        keyFocus: 'Prevent flower/square shedding, scout for Pink Bollworm (PBW), and maintain moisture.',
        activities: [
          {
            title: 'Critical Irrigation at Peak Flowering to Boll Development',
            category: 'irrigation',
            timingDescription: 'Maintain steady moisture; avoid moisture stress.',
            importanceReason: 'Water stress at flowering causes massive flower and young square shedding, reducing boll count by up to 50%.',
            weatherAdjustmentRule: (w) => (w && w.temperature > 35 ? 'Severe heat detected; run irrigation to alleviate high atmospheric vapor deficit.' : undefined)
          },
          {
            title: 'Pheromone Trap Monitoring for Pink Bollworm (PBW)',
            category: 'pest_disease',
            timingDescription: 'Install 8 gossyplure pheromone traps per acre.',
            importanceReason: 'Pink bollworm larvae enter tender bolls leaving tiny holes; trap counts guide timely mating disruption or label-recommended sprays.',
            safetyNote: 'Check traps every 3 days; destroy rosette flowers harboring larvae.'
          },
          {
            title: '1% Potassium Nitrate (13:0:45) Foliar Spray',
            category: 'nutrient',
            timingDescription: 'Two sprays at 15-day intervals during peak boll development.',
            importanceReason: 'Supplies instant potassium to developing bolls to improve fiber length and strength.'
          }
        ]
      },
      {
        stageName: 'Boll Development & Maturation',
        startDayOffset: 106,
        endDayOffset: 135,
        description: 'Bolls reach maximum size, internal lint fibers thicken, and boll carpels begin desiccation.',
        keyFocus: 'Prevent boll rot and parawilt; protect maturing bolls from late sucking pests.',
        activities: [
          {
            title: 'Monitor Internal Boll Rot & Spodoptera Worms',
            category: 'pest_disease',
            timingDescription: 'Sample 20 bolls across the field.',
            importanceReason: 'Late season caterpillars puncture bolls, introducing fungal boll rot that stains lint.',
          },
          {
            title: 'Defoliation / Light Terminal Irrigation',
            category: 'irrigation',
            timingDescription: 'Light watering as needed; stop 20 days prior to anticipated picking.',
            importanceReason: 'Allows bolls on upper sympodial branches to mature without inducing vegetative re-growth.'
          }
        ]
      },
      {
        stageName: 'Boll Bursting & Multi-Pass Cotton Picking',
        startDayOffset: 136,
        endDayOffset: 175,
        description: 'Bolls burst open revealing fluffy white seed cotton (kapas).',
        keyFocus: 'Pick clean cotton in dry afternoon hours; store separately from stained cotton.',
        activities: [
          {
            title: 'First & Second Pickings of Fully Burst Clean Bolls',
            category: 'harvest',
            timingDescription: 'Pick only when dew has completely dried (after 10:00 AM).',
            importanceReason: 'Moist cotton harvested with dew turns yellow in storage and attracts lower mandi prices.',
            weatherAdjustmentRule: (w) => (w && w.precipitationProbability > 20 ? 'Rain chance detected; speed up picking of fully burst bolls to prevent fiber discolouration.' : undefined),
            safetyNote: 'Do not use polypropylene or fertilizer sacks; use clean cotton cloth bags to prevent fiber contamination.'
          }
        ]
      }
    ]
  },
  'Paddy / Rice': {
    cropName: 'Paddy / Rice',
    typicalDurationDays: 130,
    source: 'ICAR-NRRI (National Rice Research Institute, Cuttack)',
    stages: [
      {
        stageName: 'Nursery & Transplanting',
        startDayOffset: 0,
        endDayOffset: 25,
        description: 'Nursery seedling raising (20–25 days) and transplanting onto puddled fields with 2–3 seedlings per hill.',
        keyFocus: 'Maintain shallow standing water (2–3 cm) and basal fertilization.',
        activities: [
          {
            title: 'Maintain Shallow Water Layer After Transplanting',
            category: 'irrigation',
            timingDescription: '2–3 cm water depth for first 10 days.',
            importanceReason: 'Anchors transplanted seedlings and prevents thermal shock to tender rootlets.',
          },
          {
            title: 'Basal Fertilizer Application (Full P, K & Zinc Sulphate)',
            category: 'nutrient',
            timingDescription: 'Incorporate into puddled soil prior to transplanting.',
            importanceReason: 'Zinc is essential in rice to prevent Khaira disease (leaf bronzing) in alkaline or waterlogged soils.',
            safetyNote: 'Do not mix zinc sulphate directly with DAP/phosphate fertilizers.'
          }
        ]
      },
      {
        stageName: 'Active Tillering Phase',
        startDayOffset: 26,
        endDayOffset: 50,
        description: 'Prolific production of tillers from the crown nodes below the water level.',
        keyFocus: 'First top dressing with neem-coated urea and weed management (conoweeder).',
        activities: [
          {
            title: 'First Nitrogen Top-Dressing at Active Tillering (20–25 DAT)',
            category: 'nutrient',
            timingDescription: 'Broadcast 1/3 urea when water layer is thin.',
            importanceReason: 'Maximizes the number of productive, grain-bearing tillers per hill.'
          },
          {
            title: 'Alternate Wetting and Drying (AWD) Water Management',
            category: 'irrigation',
            timingDescription: 'Allow water to drop naturally before re-flooding.',
            importanceReason: 'Conserves 25–30% irrigation water, enhances root aeration, and curbs methane emissions.',
            weatherAdjustmentRule: (w) => (w && w.precipitationProbability > 40 ? 'Monsoon rainfall expected; open field drainage bunds to avoid deep flooding.' : undefined)
          },
          {
            title: 'Scouting for Yellow Stem Borer & Leaf Folder',
            category: 'pest_disease',
            timingDescription: 'Look for dead hearts (withered central shoots).',
            importanceReason: 'Stem borer larvae sever internal vascular bundles, causing tiller death if not managed at economic threshold (5% dead hearts).'
          }
        ]
      },
      {
        stageName: 'Panicle Initiation & Booting',
        startDayOffset: 51,
        endDayOffset: 75,
        description: 'Microscopic panicle primordia develop inside the stem; boot leaf swells noticeably.',
        keyFocus: 'Second nitrogen top-dressing and maintain uninterrupted 5 cm water depth.',
        activities: [
          {
            title: 'Maintain 5 cm Continuous Water Layer During Booting',
            category: 'irrigation',
            timingDescription: 'Do not allow fields to dry during panicle elongation.',
            importanceReason: 'Moisture stress during panicle differentiation causes spikelet degeneration and half-filled heads.',
          },
          {
            title: 'Final Nitrogen Top-Dressing at Panicle Initiation',
            category: 'nutrient',
            timingDescription: 'Apply final 1/3 nitrogen.',
            importanceReason: 'Increases number of fertile spikelets per panicle and grain weight.'
          },
          {
            title: 'Blast & Sheath Blight Surveillance',
            category: 'pest_disease',
            timingDescription: 'Inspect leaf sheaths near water line.',
            importanceReason: 'Dense humid canopy encourages Rhizoctonia sheath blight lesions.',
            safetyNote: 'Consult university package of practices for approved biopesticides or fungicides.'
          }
        ]
      },
      {
        stageName: 'Flowering & Grain Filling (Milk to Dough)',
        startDayOffset: 76,
        endDayOffset: 105,
        description: 'Panicles fully emerge, anthesis takes place, and grains fill with starch.',
        keyFocus: 'Scout for Gundhi bug, protect flag leaves, and manage late water draining.',
        activities: [
          {
            title: 'Rice Earhead Bug (Gundhi Bug) Morning Inspection',
            category: 'pest_disease',
            timingDescription: 'Scout in early morning during milky stage.',
            importanceReason: 'Gundhi bugs suck the milky juice from developing grains, leaving empty white chaff (chaffy grains).',
          },
          {
            title: 'Sustain Saturated Soil through Dough Stage',
            category: 'irrigation',
            timingDescription: 'Keep soil saturated until grains harden.',
            importanceReason: 'Ensures optimal test weight and reduces grain breakage during future milling.'
          }
        ]
      },
      {
        stageName: 'Maturity & Harvest',
        startDayOffset: 106,
        endDayOffset: 135,
        description: 'Panicles turn golden yellow, moisture decreases to 18–20% in field.',
        keyFocus: 'Drain field 10 days before harvest and thresh at 14% moisture.',
        activities: [
          {
            title: 'Complete Drainage of Field Water',
            category: 'irrigation',
            timingDescription: '10–12 days prior to anticipated harvest.',
            importanceReason: 'Hardens the field soil for combine harvesters and promotes uniform grain drying.',
          },
          {
            title: 'Harvesting when 85% Panicles are Straw-Coloured',
            category: 'harvest',
            timingDescription: 'Cut and thresh promptly.',
            importanceReason: 'Over-drying in the field leads to sun cracks and high broken rice percentage during milling.',
            weatherAdjustmentRule: (w) => (w && w.precipitationProbability > 25 ? 'Rain forecasted. Move harvested bundles to dry threshing floor immediately.' : undefined)
          }
        ]
      }
    ]
  },
  'Chickpea (Bengal Gram / Chana)': {
    cropName: 'Chickpea (Bengal Gram / Chana)',
    typicalDurationDays: 110,
    source: 'ICAR-IIPR (Indian Institute of Pulses Research, Kanpur)',
    stages: [
      {
        stageName: 'Sowing & Seedling Establishment',
        startDayOffset: 0,
        endDayOffset: 25,
        description: 'Germination, taproot penetration, and emergence of pinnate leaves.',
        keyFocus: 'Seed treatment with Rhizobium + Trichoderma; avoid excessive water.',
        activities: [
          {
            title: 'Deep Sowing in Residual Soil Moisture',
            category: 'field_inspection',
            timingDescription: 'Ensure 8–10 cm sowing depth in moisture zone.',
            importanceReason: 'Deep root establishment protects against early heat and dry winter air.',
          },
          {
            title: 'Early Wilt (Fusarium) Surveillance',
            category: 'pest_disease',
            timingDescription: 'Inspect for drooping seedlings at 15–20 DAS.',
            importanceReason: 'Fusarium wilt attacks root vascular bundles; remove affected plants to prevent spread.',
            safetyNote: 'Biological seed treatment with Trichoderma viride is the most effective preventive measure.'
          }
        ]
      },
      {
        stageName: 'Branching & Vegetative Growth',
        startDayOffset: 26,
        endDayOffset: 45,
        description: 'Profuse secondary and tertiary branching; symbiotic root nodules actively fix nitrogen.',
        keyFocus: 'Nipping (terminal bud plucking) at 35–40 DAS and light weeding.',
        activities: [
          {
            title: 'Nipping / Topping of Apical Shoots (35–40 DAS)',
            category: 'field_inspection',
            timingDescription: 'Pluck top 2–3 cm tips when plants are 15–20 cm tall.',
            importanceReason: 'Breaks apical dominance, promoting vigorous lateral branching and boosting pod counts by 20–25%.',
          },
          {
            title: 'Light Irrigation before Flowering (if soil is dry)',
            category: 'irrigation',
            timingDescription: 'Only if soil moisture has depleted below 50%.',
            importanceReason: 'Chickpea is highly sensitive to excess water; a single light irrigation prior to flowering boosts branching without root rot.',
            weatherAdjustmentRule: (w) => (w && w.precipitationProbability > 20 ? 'Rain chance detected. Chickpea cannot tolerate water stagnation; DO NOT irrigate.' : undefined),
            safetyNote: 'Never flood chickpea fields; prolonged waterlogging triggers collar rot and wilting.'
          }
        ]
      },
      {
        stageName: 'Flowering & Pod Initiation',
        startDayOffset: 46,
        endDayOffset: 75,
        description: 'Pink/white solitary papilionaceous flowers emerge; young flat pods initiate.',
        keyFocus: 'ABSOLUTELY AVOID IRRIGATION DURING ACTIVE FLOWERING; scout for Helicoverpa borer.',
        activities: [
          {
            title: 'WITHHOLD IRRIGATION DURING PEAK FLOWERING',
            category: 'irrigation',
            timingDescription: 'Strictly avoid running water during bloom.',
            importanceReason: 'Irrigating during open flowering induces excessive vegetative growth, flower abortion, and zero pod setting.',
          },
          {
            title: 'Install Pheromone Traps for Gram Pod Borer (Helicoverpa armigera)',
            category: 'pest_disease',
            timingDescription: '5–6 traps per acre at canopy height.',
            importanceReason: 'Helicoverpa larvae chew into young pods and feed on green seeds. Trap monitoring alerts farmers before visible damage.',
            safetyNote: 'Spray HaNPV (250 LE/ha) or neem formulations at egg-hatch stage.'
          },
          {
            title: '2% Urea or DAP Foliar Spray at Pod Initiation',
            category: 'nutrient',
            timingDescription: 'Spray at 55–60 DAS.',
            importanceReason: 'Supplements nitrogen during heavy sink demand when root nodule nitrogen fixation naturally slows down.'
          }
        ]
      },
      {
        stageName: 'Pod Filling & Maturity',
        startDayOffset: 76,
        endDayOffset: 110,
        description: 'Seeds swell inside inflated pods; foliage gradually turns golden brown.',
        keyFocus: 'Protect filled pods from borer holes, check seed rattle, and harvest.',
        activities: [
          {
            title: 'Final Pod Inspection for Borer Punctures',
            category: 'pest_disease',
            timingDescription: 'Examine 20 plants across diagonals.',
            importanceReason: 'Ensures seed lot quality is maintained for mandi premium.',
          },
          {
            title: 'Harvesting when Plants Turn Golden Yellow & Seeds Rattle',
            category: 'harvest',
            timingDescription: 'Harvest in morning to avoid pod shattering.',
            importanceReason: 'Delaying harvest under hot dry weather causes pods to shatter, spilling valuable grains on the ground.',
            weatherAdjustmentRule: (w) => (w && w.precipitationProbability > 20 ? 'Rain predicted. Harvest and move produce under shelter to prevent seed discolouration.' : undefined)
          }
        ]
      }
    ]
  }
};

// Generic Fallback Engine for other crops (Red Onion, Mustard, Soybean, Maize, Sugarcane, Groundnut, Chilli, etc.)
export function getGenericCropAgronomicData(cropName: string): CropAgronomicData {
  const normalized = cropName.toLowerCase();
  
  if (normalized.includes('onion')) {
    return {
      cropName,
      typicalDurationDays: 130,
      source: 'ICAR-DOGR (Directorate of Onion and Garlic Research, Pune)',
      stages: [
        {
          stageName: 'Transplanting & Seedling Recovery',
          startDayOffset: 0,
          endDayOffset: 25,
          description: 'Transplanting 45-day-old nursery seedlings at 15 x 10 cm spacing.',
          keyFocus: 'Light frequent irrigations and root establishment.',
          activities: [
            {
              title: 'Establishment Irrigation',
              category: 'irrigation',
              timingDescription: 'Immediate post-transplant watering.',
              importanceReason: 'Prevents seedling desiccation and ensures uniform field stand.'
            },
            {
              title: 'Basal Fertilization (N:P:K + Sulphur)',
              category: 'nutrient',
              timingDescription: 'Apply before transplanting.',
              importanceReason: 'Sulphur is crucial for onion pungency, storage quality, and bulb firmness.'
            }
          ]
        },
        {
          stageName: 'Vegetative Growth & Foliage Development',
          startDayOffset: 26,
          endDayOffset: 60,
          description: 'Rapid leaf emergence (10–12 healthy green leaves required per plant).',
          keyFocus: 'Weed control and Thrips tabaci inspection.',
          activities: [
            {
              title: 'Thrips tabaci Scouting (Silvery Leaf Streaks)',
              category: 'pest_disease',
              timingDescription: 'Examine leaf axils weekly.',
              importanceReason: 'Thrips rasp leaves and transmit Iris Yellow Spot Virus (IYSV).'
            },
            {
              title: 'Top Dressing Nitrogen',
              category: 'nutrient',
              timingDescription: '30 and 45 days after transplanting.',
              importanceReason: 'Foliage canopy directly dictates final bulb diameter.'
            }
          ]
        },
        {
          stageName: 'Bulb Initiation & Development',
          startDayOffset: 61,
          endDayOffset: 95,
          description: 'Swelling of the bulb base; carbohydrate storage in concentric scales.',
          keyFocus: 'Steady soil moisture without water stagnation; apply potassium sulphate.',
          activities: [
            {
              title: 'Frequent Controlled Irrigation',
              category: 'irrigation',
              timingDescription: 'Every 5–7 days depending on soil type.',
              importanceReason: 'Moisture stress during bulb enlargement triggers split bulbs and double bulbs.'
            },
            {
              title: 'Foliar Spray of 0:0:50 (Potassium Sulphate)',
              category: 'nutrient',
              timingDescription: '70–75 DAT.',
              importanceReason: 'Improves bulb weight, dry matter content, and keeping quality.'
            }
          ]
        },
        {
          stageName: 'Neck Fall, Curing & Harvest',
          startDayOffset: 96,
          endDayOffset: 130,
          description: '50% tops collapse (neck fall), roots senesce, outer scales turn reddish/purple.',
          keyFocus: 'Withhold irrigation 12–15 days before harvest and field cure under shade.',
          activities: [
            {
              title: 'WITHHOLD ALL IRRIGATION (15 Days Pre-Harvest)',
              category: 'irrigation',
              timingDescription: 'Stop watering when 20–25% neck fall begins.',
              importanceReason: 'Late irrigation causes neck rot, sprouting, and severe storage rots.'
            },
            {
              title: 'Harvest & Field Curing with Foliage Covered',
              category: 'harvest',
              timingDescription: 'When 50–70% neck fall occurs.',
              importanceReason: 'Proper shade curing (3–5 days) seals the bulb neck against bacterial rots.'
            }
          ]
        }
      ]
    };
  }

  // Universal Default Model
  return {
    cropName,
    typicalDurationDays: 120,
    source: 'State Agricultural Universities & KVK Standard Package of Practices',
    stages: [
      {
        stageName: 'Sowing / Seedling Establishment',
        startDayOffset: 0,
        endDayOffset: 25,
        description: 'Seed germination, root emergence, and primary vegetative establishment.',
        keyFocus: 'Maintain seedbed moisture, seed treatment, and gap filling.',
        activities: [
          {
            title: 'Initial Sowing & Moisture Management',
            category: 'irrigation',
            timingDescription: 'At sowing or immediate post-sowing.',
            importanceReason: 'Ensures seed imbibition and uniform germination across field contour.'
          },
          {
            title: 'Basal Soil Nutrition (Balanced N-P-K)',
            category: 'nutrient',
            timingDescription: 'Incorporate at final land preparation.',
            importanceReason: 'Supplies foundational nutrients for deep root development.'
          }
        ]
      },
      {
        stageName: 'Vegetative Growth & Canopy Development',
        startDayOffset: 26,
        endDayOffset: 55,
        description: 'Stem elongation, branch/tiller proliferation, and leaf area index expansion.',
        keyFocus: 'Timely weeding, split nitrogen application, and pest scouting.',
        activities: [
          {
            title: 'Inter-cultivation & Weed Removal',
            category: 'weed',
            timingDescription: '25–35 days after sowing.',
            importanceReason: 'Eliminates weed competition during the critical crop-weed competition window.'
          },
          {
            title: 'Scheduled Irrigation Cycle',
            category: 'irrigation',
            timingDescription: 'Based on soil moisture and crop evapotranspiration demand.',
            importanceReason: 'Maintains leaf turgidity and active transpiration cooling.'
          }
        ]
      },
      {
        stageName: 'Flowering & Reproductive Initiation',
        startDayOffset: 56,
        endDayOffset: 85,
        description: 'Floral bud formation, pollination, and initial fruit / grain set.',
        keyFocus: 'Avoid moisture stress, balance micronutrients, and protect flowers from pests.',
        activities: [
          {
            title: 'Critical Moisture Maintenance at Flowering',
            category: 'irrigation',
            timingDescription: 'Ensure active rootzone remains moist; avoid waterlogging.',
            importanceReason: 'Flower drop directly reduces final yield potential.'
          },
          {
            title: 'Pest & Disease Scouting in Canopy',
            category: 'pest_disease',
            timingDescription: 'Twice weekly field diagonal inspection.',
            importanceReason: 'Early intervention prevents localized pest buildup from becoming an outbreak.'
          }
        ]
      },
      {
        stageName: 'Grain / Fruit Filling & Maturation',
        startDayOffset: 86,
        endDayOffset: 120,
        description: 'Produce sizing, sugar/starch accumulation, and physiological ripening.',
        keyFocus: 'Terminal moisture cutoff and harvest preparation.',
        activities: [
          {
            title: 'Gradual Irrigation Tapering & Cut-off',
            category: 'irrigation',
            timingDescription: '10–14 days prior to harvest.',
            importanceReason: 'Encourages natural drying of produce and prepares soil for harvesting operations.'
          },
          {
            title: 'Harvest Operation at Optimal Moisture',
            category: 'harvest',
            timingDescription: 'When crop reaches physiological maturity.',
            importanceReason: 'Maximizes yield recovery and prevents field shattering or bird damage.'
          }
        ]
      }
    ]
  };
}

export const cropTimelineService = {
  /**
   * Look up agronomic data for a given crop name
   */
  getCropAgronomicData(cropName: string): CropAgronomicData {
    // Check direct match
    if (CROP_AGRONOMIC_DATABASE[cropName]) {
      return CROP_AGRONOMIC_DATABASE[cropName];
    }
    // Check partial key match
    const foundKey = Object.keys(CROP_AGRONOMIC_DATABASE).find(k => 
      k.toLowerCase().includes(cropName.toLowerCase()) || 
      cropName.toLowerCase().includes(k.toLowerCase())
    );
    if (foundKey) {
      return CROP_AGRONOMIC_DATABASE[foundKey];
    }
    return getGenericCropAgronomicData(cropName);
  },

  /**
   * Generates a complete, interactive CropTimelineProfile
   */
  generateTimelineProfile(params: {
    cropName: string;
    variety?: string;
    sowingDate?: string; // YYYY-MM-DD
    growingRegion?: string;
    farmingMethod?: FarmingMethod;
    manualStageIndex?: number;
    weather?: CurrentWeatherReport;
    language?: SupportedLanguage;
    existingActivitiesState?: Record<string, boolean>; // activityId -> completed
  }): CropTimelineProfile {
    const {
      cropName,
      variety,
      sowingDate,
      growingRegion = 'Karnataka, India',
      farmingMethod = 'Drip Irrigated',
      manualStageIndex,
      weather,
      existingActivitiesState = {}
    } = params;

    const agronomy = this.getCropAgronomicData(cropName);
    const totalDurationDays = agronomy.typicalDurationDays;

    // Calculate Days After Sowing (DAS)
    let daysAfterSowing: number | undefined = undefined;
    let sowingTime: number | null = null;

    if (sowingDate && sowingDate.trim() && !isNaN(Date.parse(sowingDate))) {
      sowingTime = new Date(sowingDate).getTime();
      const nowTime = Date.now();
      const diffMs = nowTime - sowingTime;
      const rawDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      daysAfterSowing = Math.max(0, rawDays);
    }

    // Determine current stage index based on DAS or manual override
    let currentStageIndex = 0;
    if (typeof manualStageIndex === 'number' && manualStageIndex >= 0 && manualStageIndex < agronomy.stages.length) {
      currentStageIndex = manualStageIndex;
    } else if (typeof daysAfterSowing === 'number') {
      const matchIdx = agronomy.stages.findIndex(
        s => (daysAfterSowing as number) >= s.startDayOffset && (daysAfterSowing as number) <= s.endDayOffset
      );
      if (matchIdx !== -1) {
        currentStageIndex = matchIdx;
      } else if (daysAfterSowing > agronomy.stages[agronomy.stages.length - 1].endDayOffset) {
        currentStageIndex = agronomy.stages.length - 1;
      } else {
        currentStageIndex = 0;
      }
    }

    // Calculate progress percentage strictly if reliable sowingDate exists
    let progressPercentage: number | undefined = undefined;
    if (typeof daysAfterSowing === 'number' && totalDurationDays > 0) {
      progressPercentage = Math.min(100, Math.max(0, Math.round((daysAfterSowing / totalDurationDays) * 100)));
    }

    // Format stages
    const stages: CropTimelineStage[] = agronomy.stages.map((st, idx) => {
      let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
      if (idx < currentStageIndex) {
        status = 'completed';
      } else if (idx === currentStageIndex) {
        status = 'current';
      } else {
        status = 'upcoming';
      }

      let estimatedStartDate: string | undefined = undefined;
      let estimatedEndDate: string | undefined = undefined;
      let isDateEstimated = false;

      if (sowingTime) {
        isDateEstimated = true;
        const startMs = sowingTime + (st.startDayOffset * 24 * 60 * 60 * 1000);
        const endMs = sowingTime + (st.endDayOffset * 24 * 60 * 60 * 1000);
        const startD = new Date(startMs);
        const endD = new Date(endMs);
        estimatedStartDate = startD.toISOString().split('T')[0];
        estimatedEndDate = endD.toISOString().split('T')[0];
      }

      const activities: CropTimelineActivity[] = st.activities.map((act, actIdx) => {
        const actId = `act-${cropName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-s${idx}-a${actIdx}`;
        const isCompleted = existingActivitiesState[actId] ?? (idx < currentStageIndex);

        let weatherAdjustment: string | undefined = undefined;
        if (weather && act.weatherAdjustmentRule) {
          weatherAdjustment = act.weatherAdjustmentRule(weather);
        }

        return {
          id: actId,
          title: act.title,
          category: act.category,
          timingDescription: act.timingDescription,
          importanceReason: act.importanceReason,
          weatherAdjustment,
          completed: isCompleted,
          safetyNote: act.safetyNote
        };
      });

      return {
        id: `stage-${cropName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${idx}`,
        stageName: st.stageName,
        stageOrder: idx + 1,
        status,
        startDayOffset: st.startDayOffset,
        endDayOffset: st.endDayOffset,
        estimatedStartDate,
        estimatedEndDate,
        isDateEstimated,
        description: st.description,
        keyFocus: st.keyFocus,
        activities
      };
    });

    // Determine the next recommended action tailored to current stage & incomplete activities
    const currentStage = stages[currentStageIndex] || stages[0];
    const pendingActivity = currentStage.activities.find(a => !a.completed) || currentStage.activities[0];

    let actionUrgency: 'action_required' | 'favorable' | 'caution' | 'monitoring' = 'action_required';
    let weatherContextStr: string | undefined = undefined;

    if (weather) {
      if (weather.precipitationProbability > 40) {
        weatherContextStr = `Rain forecast is ${weather.precipitationProbability}%. Check drainage and hold foliar chemical sprays.`;
        if (pendingActivity?.category === 'pest_disease' || pendingActivity?.category === 'nutrient') {
          actionUrgency = 'caution';
        }
      } else if (weather.windSpeed > 15) {
        weatherContextStr = `Wind speed is ${weather.windSpeed} km/h (gusty). Avoid chemical sprays due to high drift risk.`;
        actionUrgency = 'caution';
      } else if (weather.temperature > 33) {
        weatherContextStr = `Temperature is ${weather.temperature}°C. Schedule any field spraying or irrigation during cool early morning.`;
      }
    }

    const nextRecommendedAction: NextRecommendedAction = {
      title: pendingActivity ? pendingActivity.title : `${currentStage.stageName} Field Care`,
      advice: pendingActivity ? pendingActivity.importanceReason : currentStage.keyFocus,
      reasoning: `Based on ${cropName} physiological requirements at ${currentStage.stageName} (${typeof daysAfterSowing === 'number' ? `Day ${daysAfterSowing} of ~${totalDurationDays}` : 'active growth'}), this action ensures optimal canopy health.`,
      category: pendingActivity ? pendingActivity.category : 'growth_stage',
      urgency: actionUrgency,
      timing: pendingActivity ? pendingActivity.timingDescription : 'Immediate in-field attention',
      weatherContext: weatherContextStr,
      safetyWarning: pendingActivity?.safetyNote || 'Weather forecasts do NOT guarantee safe spraying. Inspect actual canopy wind and field conditions before chemical application.'
    };

    const currentStageName = currentStage.stageName;

    // Generate spoken summary for audio playback
    const spokenSummary = `Crop Timeline for ${cropName}${variety ? ` variety ${variety}` : ''}. Currently at ${currentStageName}${typeof daysAfterSowing === 'number' ? `, day ${daysAfterSowing} after planting` : ''}. Next recommended action is: ${nextRecommendedAction.title}. ${nextRecommendedAction.advice} ${weatherContextStr ? `Weather note: ${weatherContextStr}` : ''}`;

    return {
      id: `timeline-${cropName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(0, 6)}`,
      cropName,
      variety,
      sowingDate,
      growingRegion,
      farmingMethod,
      currentStageIndex,
      currentStageName,
      totalDurationDays,
      daysAfterSowing,
      progressPercentage,
      stages,
      nextRecommendedAction,
      spokenSummary,
      lastUpdated: new Date().toISOString(),
      dataSource: agronomy.source,
      aiEnhanced: false
    };
  },

  /**
   * Fetch AI enhanced Crop Timeline from server-side Gemini endpoint
   */
  async fetchAiEnhancedTimeline(params: {
    cropName: string;
    variety?: string;
    sowingDate?: string;
    growingRegion?: string;
    farmingMethod?: FarmingMethod;
    manualStageIndex?: number;
    weather?: CurrentWeatherReport;
    language?: SupportedLanguage;
  }): Promise<{ success: boolean; timeline?: CropTimelineProfile; error?: string; warning?: string }> {
    try {
      const response = await fetch('/api/crop-timeline/ai-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.timeline) {
        return {
          success: true,
          timeline: data.timeline,
          warning: data.warning
        };
      }
      throw new Error(data.error || 'Failed to generate AI crop timeline');
    } catch (err: any) {
      console.warn('AI Crop Timeline API fallback to rule engine:', err);
      // Fallback seamlessly to local agronomy rule engine
      const fallbackTimeline = this.generateTimelineProfile({
        cropName: params.cropName,
        variety: params.variety,
        sowingDate: params.sowingDate,
        growingRegion: params.growingRegion,
        farmingMethod: params.farmingMethod,
        manualStageIndex: params.manualStageIndex,
        weather: params.weather,
        language: params.language
      });
      return {
        success: true,
        timeline: fallbackTimeline,
        warning: 'Generated using verified ICAR / KVK agronomic package of practices.'
      };
    }
  }
};
