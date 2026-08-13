import type { Dataset } from '../../types';

/**
 * Public datasets discoverable per stage.
 *
 * The dominant finding across every stage: tea datasets are small, single-region
 * and single-season, and several stages have no public dataset at all. Entries
 * with `restricted: true` are named in the literature but not openly downloadable
 * — they are listed because knowing a dataset exists (and who holds it) is itself
 * useful when planning collection.
 */
export const DATASETS: Dataset[] = [
  // ── Plantation ────────────────────────────────────────────────────────────
  {
    id: 'ds-uav-tea-canopy',
    stageSlug: 'plantation',
    name: 'UAV multispectral tea-canopy collections',
    size: 'Study-specific, typically single-estate',
    categories: 'Canopy coverage, NDVI, Clgreen, LAI, N status',
    modality: 'uav',
    notes:
      'No consolidated public release. Each UAV growth-monitoring study collects its own flights over one estate, which is exactly the standardisation gap the field-wide reviews call out.',
    restricted: true,
  },
  {
    id: 'ds-tea-parcel-seg',
    stageSlug: 'plantation',
    name: 'Tea plantation parcel segmentation imagery (DVIT-UNet study)',
    categories: 'Parcel boundaries in UAV imagery',
    url: 'https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0345760',
    modality: 'uav',
    notes: 'Availability per the PLOS One data-availability statement; check the article before assuming an open download.',
  },

  // ── Harvest ───────────────────────────────────────────────────────────────
  {
    id: 'ds-tbd',
    stageSlug: 'harvest',
    name: 'Tea Bud Dataset (TBD)',
    size: '3,728 tea shoots',
    categories: 'Anji White Tea, Huangshan Seed, Longjing 43, NongKang Early',
    region: 'China',
    url: 'https://www.nature.com/articles/s41598-024-53498-y',
    modality: 'rgb',
    notes:
      'One of the few multi-cultivar tea-bud sets. Deliberately contains visually similar categories, which makes it a harder and more realistic benchmark than single-cultivar collections.',
  },
  {
    id: 'ds-bud-longjing',
    stageSlug: 'harvest',
    name: 'Small-leaf green tea bud collections (Longjing-dominant)',
    categories: 'Tender shoot bounding boxes',
    region: 'China',
    modality: 'rgb',
    notes:
      'The detection literature is heavily skewed toward Longjing and other small-leaf green cultivars — a real transfer risk for large-leaf Assamica used in Sri Lankan and Indian black tea.',
    restricted: true,
  },

  // ── Sorting / intake ──────────────────────────────────────────────────────
  {
    id: 'ds-tealeafbd',
    stageSlug: 'sorting',
    name: 'teaLeafBD',
    size: '~4,000 images',
    categories: '7 categories including blister blight and grey blight',
    region: 'Sylhet, Bangladesh',
    url: 'https://www.sciencedirect.com/science/article/pii/S2352340925004962',
    license: 'See Data in Brief article',
    modality: 'rgb',
    notes: 'The most-used public tea disease dataset. Class-labelled only — no severity annotation.',
  },
  {
    id: 'ds-kaggle-tea-leaf-disease',
    stageSlug: 'sorting',
    name: 'Kaggle "Tea Leaf Disease"',
    categories: 'Algal Spot, Brown Blight, Gray Blight, Healthy, Helopeltis, Red Spot',
    url: 'https://www.kaggle.com/datasets',
    modality: 'rgb',
    notes: 'Six-class set, size not stated in the source review. Convenient for a first transfer-learning baseline.',
  },
  {
    id: 'ds-hibiscus-tea',
    stageSlug: 'sorting',
    name: 'Combined Hibiscus + Tea leaf disease dataset',
    categories: 'Multi-crop disease imagery',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12828367/',
    modality: 'rgb',
    notes: 'Useful for multi-crop pretraining before fine-tuning on tea alone.',
  },
  {
    id: 'ds-plantvillage',
    stageSlug: 'sorting',
    name: 'PlantVillage (cross-crop transfer)',
    size: 'Large, general',
    categories: '4-stage severity annotation precedent (apple black rot)',
    url: 'https://www.kaggle.com/datasets/emmarex/plantdisease',
    modality: 'rgb',
    notes:
      'Not tea, but the source of the 4-stage severity labelling scheme worth copying — and a standard pretraining corpus for leaf-disease backbones.',
  },
  {
    id: 'ds-severity-tea-gap',
    stageSlug: 'sorting',
    name: 'Tea disease SEVERITY labels — does not exist',
    modality: 'rgb',
    notes:
      'No public tea dataset carries continuous or ordinal severity labels. This is the single most concrete data gap in the intake stage: plan to generate segmentation masks (cheaper) rather than expert severity grades.',
    restricted: true,
  },

  // ── Withering ─────────────────────────────────────────────────────────────
  {
    id: 'ds-wither-nir',
    stageSlug: 'withering',
    name: 'Withering NIR / dielectric moisture time series',
    categories: 'Spectra or dielectric readings paired with oven-dry reference moisture',
    modality: 'nir',
    notes:
      'Held privately by the STA-BiLSTM / STA-BiGRU study groups. No open release found — expect to build your own paired sensor-and-gravimetry set.',
    restricted: true,
  },
  {
    id: 'ds-wither-congou-images',
    stageSlug: 'withering',
    name: 'Congou black tea withering leaf imagery',
    categories: 'Leaf images paired with moisture content',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5959864/',
    modality: 'rgb',
    notes: 'Image-feature moisture prediction study; the vision-only route that avoids spectroscopy hardware entirely.',
  },

  // ── Rolling ───────────────────────────────────────────────────────────────
  {
    id: 'ds-rolling-degree',
    stageSlug: 'rolling',
    name: 'Rolling-degree colour feature sets',
    categories: 'Local + global colour features across rolling stages',
    url: 'https://www.cell.com/heliyon/fulltext/S2405-8440(25)02255-8',
    modality: 'rgb',
    notes:
      'Colorimeter and machine-vision readings at labelled rolling stages. Small and single-line, like most of this literature.',
    restricted: true,
  },
  {
    id: 'ds-rolling-pigments',
    stageSlug: 'rolling',
    name: 'Rolling-stage tea pigment assays',
    categories: 'Theaflavin / thearubigin content during rolling',
    url: 'https://doi.org/10.3390/foods14162829',
    modality: 'lab-assay',
    notes: 'Paired vision-and-assay data — the pattern to copy if you want rolling to emit a chemically meaningful feature.',
    restricted: true,
  },

  // ── Fermenting ────────────────────────────────────────────────────────────
  {
    id: 'ds-teanet-fermentation',
    stageSlug: 'fermenting',
    name: 'TeaNet fermentation image dataset',
    categories: '3 fermentation classes',
    url: 'https://doi.org/10.3390/data5020044',
    license: 'Published in MDPI Data — check article terms',
    modality: 'rgb',
    notes:
      'Published in a data journal, so more likely to be genuinely available than most entries here. Small — the source of the "100% accuracy" figure that should not be treated as a target.',
  },
  {
    id: 'ds-ferm-enose',
    stageSlug: 'fermenting',
    name: 'Fermentation image + e-nose paired recordings',
    categories: 'Synchronised vision and MOS gas-sensor arrays',
    url: 'https://www.sciencedirect.com/science/article/abs/pii/S2212429223001050',
    modality: 'multimodal',
    notes: 'The most fusion-relevant tea dataset described anywhere in this corpus. Not openly released.',
    restricted: true,
  },
  {
    id: 'ds-ferm-hyperspectral',
    stageSlug: 'fermenting',
    name: 'Fermentation hyperspectral cubes (0–5 h intervals)',
    categories: '5 fermentation time intervals',
    modality: 'hyperspectral',
    notes: 'Underpins the PSO-CNN-LSTM 96.78% result. Hyperspectral capture cost ($4k–$90k+) is the barrier to replication.',
    restricted: true,
  },

  // ── Drying ────────────────────────────────────────────────────────────────
  {
    id: 'ds-dry-hsi-stacked',
    stageSlug: 'drying',
    name: 'Stacked-leaf hyperspectral moisture imagery',
    categories: 'Moisture distribution across 7 processing steps',
    url: 'https://www.mdpi.com/2304-8158/14/9/1551',
    modality: 'hyperspectral',
    notes:
      'Notable for spanning multiple processing steps rather than one — the closest thing in the corpus to a cross-stage collection.',
  },
  {
    id: 'ds-puerh-sundry',
    stageSlug: 'drying',
    name: 'Pu-erh sun-drying image + environment log',
    categories: 'Images with humidity, temperature, radiation, wind, UV',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9007301/',
    modality: 'multimodal',
    notes: 'Template for pairing imagery with an environmental time series — the schema your own logging should mirror.',
  },

  // ── Grading ───────────────────────────────────────────────────────────────
  {
    id: 'ds-grade-crossstage-gap',
    stageSlug: 'grading',
    name: 'Cross-stage batch dataset — does not exist',
    categories: 'Disease severity + withering trajectory + fermentation trajectory + final grade',
    modality: 'multimodal',
    notes:
      'No public dataset pairs all upstream signals with a final grade label. Building one from your own factory batch records is both the prerequisite for Stage 8 and, per the field-wide reviews, a contribution in its own right.',
    restricted: true,
  },
  {
    id: 'ds-grade-nirs',
    stageSlug: 'grading',
    name: 'NIRS tea quality-level spectra',
    categories: 'Graded quality levels with NIR spectra',
    url: 'https://doi.org/10.3390/foods11111658',
    modality: 'nir',
    notes: 'Underpins the CLPSO-SVM 99.17% result. Single-timepoint, not trajectory.',
    restricted: true,
  },
  {
    id: 'ds-grade-fresh-leaf',
    stageSlug: 'grading',
    name: 'Fresh tea leaf quality-grade imagery',
    categories: 'Bud/leaf combination grades',
    url: 'https://www.nature.com/articles/s41598-024-54389-y',
    modality: 'rgb',
    notes: 'Intake-side grading imagery used by the YOLOv8x-SPPCSPC-CBAM study.',
  },

  // ── Packaging ─────────────────────────────────────────────────────────────
  {
    id: 'ds-huangshan-traceability',
    stageSlug: 'packaging',
    name: 'Huangshan tea traceability records',
    size: '500 lots × 26 characteristic values',
    categories: 'Shelf life, product grade, appearance, planting date, packaging date',
    region: 'Huangshan, China',
    url: 'https://onlinelibrary.wiley.com/doi/10.1155/2022/8618230',
    modality: 'tabular',
    notes:
      'The only tea dataset found that is structured as a per-lot provenance chain. Small, but the schema is a good starting point for your own traceability records.',
    restricted: true,
  },

  // ── Cup / sensory ─────────────────────────────────────────────────────────
  {
    id: 'ds-etongue-nir-taste',
    stageSlug: 'cup',
    name: 'Black tea taste: miniature NIR + e-tongue readings',
    categories: 'Taste quality classes',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9855879/',
    modality: 'e-tongue',
    notes: 'Paired instrument readings with taste-quality labels.',
    restricted: true,
  },
  {
    id: 'ds-chemical-sensory',
    stageSlug: 'cup',
    name: 'Chemical indices ↔ sensory score pairs',
    categories: '8 key chemical indices with sensory quality scores, green + black tea',
    url: 'https://www.sciencedirect.com/science/article/abs/pii/S030881462302959X',
    modality: 'lab-assay',
    notes:
      'The cleanest published chemistry-to-sensory mapping. If you can assay the same indices, this is the most directly reusable external reference in the corpus.',
    restricted: true,
  },
  {
    id: 'ds-taster-scores-gap',
    stageSlug: 'cup',
    name: 'Taster score / auction price panel — must be collected',
    categories: 'Per-lot taster scores and realised auction prices',
    modality: 'tabular',
    notes:
      'The label that ultimately matters. Colombo, Mombasa and Guwahati auctions publish price data, but linking it back to per-batch process records is something only the producer can do.',
    restricted: true,
  },
];

export const DATASETS_BY_STAGE = DATASETS.reduce<Record<string, Dataset[]>>((acc, d) => {
  (acc[d.stageSlug] ??= []).push(d);
  return acc;
}, {});
