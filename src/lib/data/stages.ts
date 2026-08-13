import type { Stage } from '@/lib/types';

/**
 * The ten canonical stages of black-tea manufacture, laid out as a serpentine
 * path in world space:
 *
 *   row A (z=-8)   1 ──▶ 2 ──▶ 3 ──▶ 4
 *                                    │
 *   row B (z= 0)   7 ◀── 6 ◀── 5 ◀───╯
 *                  │
 *   row C (z= 8)   8 ──▶ 9 ──▶ 10
 *
 * Stage colours walk the actual chromatic journey of the leaf — fresh green
 * through oxidised copper to brewed amber — so the scene reads as one
 * continuous transformation rather than ten arbitrary swatches.
 */
export const STAGES: Stage[] = [
  {
    slug: 'plantation',
    index: 1,
    name: 'Tea Plantation',
    tagline: 'Cultivation & canopy health',
    process:
      'Camellia sinensis bushes are maintained on a plucking table, with growth driven by altitude, shade, rainfall and nutrition. The flush cycle — the rate at which new tender shoots emerge — sets the ceiling on both yield and quality for everything downstream.',
    aiSummary:
      'UAV and satellite remote sensing turn the plantation into a measurable surface. Multispectral indices (NDVI, Clgreen) plus canopy coverage feed regression models that estimate nitrogen status, leaf area index and yield weeks ahead of plucking. Random forest is the repeatedly-reported best performer, and canopy coverage is the feature that rescues models from NDVI saturation at high LAI.',
    researchDepth: 'survey',
    color: '#4E7C3F',
    accent: '#7BA85C',
    position: [-12, 0, -8],
    metrics: [
      { label: 'Best model class', value: 'Random Forest' },
      { label: 'Key features', value: 'Canopy cover + NDVI + Clgreen' },
      { label: 'Sensing', value: 'UAV multispectral / hyperspectral' },
    ],
    processParams: [
      { label: 'Plucking cycle', value: '7–14 days' },
      { label: 'Standard pluck', value: 'Two leaves and a bud' },
    ],
  },
  {
    slug: 'harvest',
    index: 2,
    name: 'Harvest',
    tagline: 'Shoot detection & selective plucking',
    process:
      'Tender shoots are plucked by hand or by machine. Hand plucking is selective and preserves the two-leaves-and-a-bud standard; mechanical harvesting is faster but indiscriminate, cutting mature leaf and stalk into the batch and lowering the intake grade.',
    aiSummary:
      'Tea-bud detection is the single most crowded sub-field in tea CV. YOLO-family detectors locate tender shoots in cluttered canopy so a robotic end-effector can cut at the right point — the enabling step for selective mechanical harvesting. Reported mAP clusters in the 85–93% band, with lightweight backbones (GhostNet, depthwise separable convolutions) used to hit real-time inference on embedded boards.',
    researchDepth: 'survey',
    color: '#55813F',
    accent: '#86AF5E',
    position: [-4, 0, -8],
    metrics: [
      { label: 'Tea-YOLOv8s', value: '88.27% mAP @ 37.1 ms' },
      { label: 'Improved YOLOv4', value: '93.1% precision / 89.3% recall' },
      { label: 'YOLOv7-DWS', value: '+5.5–8.2% mAP@.5:.95 by density' },
    ],
    processParams: [
      { label: 'Target', value: 'Bud + 2 leaves' },
      { label: 'Constraint', value: 'Occlusion & density variation' },
    ],
  },
  {
    slug: 'sorting',
    index: 3,
    name: 'Sorting',
    tagline: 'Intake QA — disease severity & impurities',
    process:
      'Green leaf is weighed in at the factory and inspected before withering begins. Diseased leaf, coarse leaf, and foreign matter are removed. This is the last point at which a bad batch can be rejected before it consumes processing capacity.',
    aiSummary:
      'Two separable problems live here. Disease classification is effectively solved — DenseNet201, EfficientNetB0 and CNN ensembles all report 95–99% on public tea-leaf datasets. Continuous disease *severity* is the real gap: no public tea dataset is severity-labelled, so the transferable pattern from other crops is segmentation-based — severity = diseased-pixel-area / total-leaf-area from a U-Net or DeepLabV3+ mask. Impurity sorting is a parallel, mostly-YOLO track.',
    researchDepth: 'core',
    researchDoc: 'stage-1-intake-disease-detection.md',
    color: '#5C8641',
    accent: '#90B461',
    position: [4, 0, -8],
    metrics: [
      { label: 'DenseNet201 (teaLeafBD)', value: '99% test accuracy' },
      { label: 'Ensemble + Grad-CAM', value: '98.3% output-level fusion' },
      { label: 'Segmentation benchmark', value: '92% acc / 90% IoU (cross-crop)' },
    ],
    processParams: [
      { label: 'Severity definition', value: 'Diseased px ÷ leaf px' },
      { label: 'Edge latency', value: '6.1–120 ms depending on board' },
    ],
  },
  {
    slug: 'withering',
    index: 4,
    name: 'Withering',
    tagline: 'Moisture trajectory & airflow control',
    process:
      'Leaf is spread on troughs and air is drawn through the bed for 12–18 hours, reducing moisture from roughly 75% to a target 58–62%. This makes the leaf pliable enough to roll without shattering, and starts the chemical changes fermentation will finish.',
    aiSummary:
      'The best-engineered stage of the four core ones: both sensing and control are mature independently of the ML layer. Attention-based recurrent models (STA-BiLSTM / STA-BiGRU, usually boosted with XGBoost) predict moisture content from NIR or dielectric readings at R² 0.96–0.98. The control side borrows directly from HVAC: a PID loop on a variable-speed drive tracks the setpoint trajectory the ML model produces, with a weight-loss-rate threshold as a simple energy-saving overlay.',
    researchDepth: 'core',
    researchDoc: 'stage-2-withering-optimization.md',
    color: '#6E8C43',
    accent: '#A3BB68',
    position: [12, 0, -8],
    metrics: [
      { label: 'STA-BiLSTM-XGBoost', value: 'RMSE 0.022 / R² 0.967' },
      { label: 'STA-BiGRU-XGBoost', value: 'RMSE 0.0920 / R² 0.9806' },
      { label: 'RGB-only model', value: 'Rp 0.9983 — vision competitive' },
    ],
    processParams: [
      { label: 'Target moisture', value: '58–62% residual' },
      { label: 'Air velocity', value: '1.2 ± 0.3 m/s' },
      { label: 'Operating range', value: '20–35 °C, 40–90% RH' },
    ],
  },
  {
    slug: 'rolling',
    index: 5,
    name: 'Rolling',
    tagline: 'Cell rupture & pigment release',
    process:
      'Withered leaf is rolled under pressure to rupture cell walls and release cell fluid, bringing polyphenols into contact with polyphenol oxidase. This is what makes the subsequent oxidation possible — rolling does not just shape the leaf, it loads the reaction.',
    aiSummary:
      'Rolling degree is still judged by eye from the colour of the rolled leaf, which makes it a clean target for machine vision. Colour features from inexpensive camera rigs classify rolling degree at ~97.5% accuracy, and multi-source fusion models predict tea-pigment content (theaflavins/thearubigins) quantitatively during the roll — moving from "how rolled is it" to "what is it becoming".',
    researchDepth: 'survey',
    color: '#85893F',
    accent: '#B4B463',
    position: [8, 0, 0],
    metrics: [
      { label: 'Rolling-degree classification', value: '97.5% overall accuracy' },
      { label: 'Multimodal attention fusion', value: '95.56% accuracy' },
      { label: 'Pigment prediction', value: 'Quantitative TF/TR during roll' },
    ],
    processParams: [
      { label: 'Purpose', value: 'Rupture cells, release cell fluid' },
      { label: 'Current practice', value: 'Sensory colour judgement' },
    ],
  },
  {
    slug: 'fermenting',
    index: 6,
    name: 'Fermenting',
    tagline: 'Oxidation endpoint prediction',
    process:
      'Rolled leaf is spread in a humid, temperature-controlled room and left to oxidise. Colour moves yellow-red to purple-red as theaflavins and thearubigins form. Calling the cutoff early leaves the cup thin; calling it late makes it flat and dull. Traditionally judged by a tea maker on sight and smell.',
    aiSummary:
      'The stage with the most intra-stage fusion precedent in the entire tea literature. Image + e-nose fusion (feature-level and decision-level) reliably beats either modality alone — the closest published analogue to cross-stage fusion. The single most actionable implementation detail in the whole corpus lives here: convert RGB to CIE-Lab before feature extraction, since Lab consistently outperforms RGB and HSV for tracking oxidation colour progression.',
    researchDepth: 'core',
    researchDoc: 'stage-3-fermentation-endpoint.md',
    color: '#9A7A38',
    accent: '#C79B4E',
    position: [0, 0, 0],
    metrics: [
      { label: 'PSO-CNN-LSTM (hyperspectral)', value: '96.78%' },
      { label: 'TeaNet (CNN)', value: '100% — 3 classes, small set' },
      { label: 'Image + e-nose fusion', value: 'Beats either alone' },
    ],
    processParams: [
      { label: 'Colour space', value: 'CIE-Lab (not RGB/HSV)' },
      { label: 'Lighting', value: 'Controlled, e.g. 100 lx uniform' },
      { label: 'Chemistry', value: 'Theaflavins 2–6% of dry weight' },
    ],
  },
  {
    slug: 'drying',
    index: 7,
    name: 'Drying',
    tagline: 'Firing & moisture endpoint',
    process:
      'Hot air arrests oxidation and drives residual moisture down to roughly 3%, fixing the chemistry in place and making the tea shelf-stable. Over-firing scorches and flattens the cup; under-firing leaves the tea prone to spoilage in storage.',
    aiSummary:
      'Hyperspectral imaging is the distinguishing technique here because it makes moisture *distribution* visible, not just batch-average moisture — imaging of stacked leaf shows tips and petioles retain more water than the leaf surface, which a single probe cannot see. Spectral quantitative models reach R² > 0.94; NIR models with multi-scale feature fusion and attention are the current deep-learning frontier for fixation/drying moisture.',
    researchDepth: 'survey',
    color: '#A66A30',
    accent: '#D08C44',
    position: [-8, 0, 0],
    metrics: [
      { label: 'Spectral models', value: 'R² > 0.940' },
      { label: 'PLSR baseline', value: 'R² 0.77–0.80' },
      { label: 'HSI insight', value: 'Non-uniform moisture distribution' },
    ],
    processParams: [
      { label: 'Target moisture', value: '~3% residual' },
      { label: 'Function', value: 'Arrest oxidation, stabilise' },
    ],
  },
  {
    slug: 'grading',
    index: 8,
    name: 'Grading',
    tagline: 'Cross-stage fusion → final batch grade',
    process:
      'Dried tea is sieved and sorted into grades by particle size and leaf style — from whole-leaf down through brokens, fannings and dust. Grade determines which lot the tea joins and, ultimately, what it sells for at auction.',
    aiSummary:
      'This is where the project\'s novel contribution sits. Single-stage grading is well covered (CLPSO-SVM on NIRS at 99.17%, YOLOv8 variants on fresh leaf). What does not exist — confirmed independently by two review papers — is any system carrying disease severity, withering trajectory and fermentation trajectory forward into one grade predictor. The load-bearing design constraint is a real counter-precedent: at least one grading system deliberately rejected unified end-to-end multi-task training because heterogeneous sensory attributes interfered, and used a modular architecture instead.',
    researchDepth: 'core',
    researchDoc: 'stage-4-fusion-batch-grade.md',
    color: '#8E5A2E',
    accent: '#BC7C3E',
    position: [-8, 0, 8],
    metrics: [
      { label: 'CLPSO-SVM on NIRS', value: '99.17%' },
      { label: 'Cross-stage fusion systems', value: 'None published — open gap' },
      { label: 'Causal DL (SCM + CGAN)', value: 'RMSE 0.16–0.39' },
    ],
    processParams: [
      { label: 'Recommended fusion', value: 'Mid-level (feature/embedding)' },
      { label: 'Validation split', value: 'Hold out by season or estate' },
    ],
  },
  {
    slug: 'packaging',
    index: 9,
    name: 'Tea Packaging',
    tagline: 'Shelf life, provenance & traceability',
    process:
      'Graded tea is packed into foil-lined sacks, chests or retail units under controlled humidity. From this point the product is opaque: quality can only degrade, and the buyer has no direct way to verify what happened upstream.',
    aiSummary:
      'Two distinct threads. Shelf-life prediction couples embedded sensors and edge analytics with CNN/RNN models to forecast spoilage under real cold-chain conditions rather than assuming nominal storage. Traceability couples blockchain with ML — one tea-specific system logged 26 characteristic values per lot including shelf life, grade, appearance, planting date and packaging date. For this project the traceability chain is not a bolt-on: it is the mechanism that produces the labelled cross-stage dataset Stage 8 needs.',
    researchDepth: 'survey',
    color: '#6B4A2C',
    accent: '#99713F',
    position: [0, 0, 8],
    metrics: [
      { label: 'Blockchain + IoT tea system', value: '26 features / lot' },
      { label: 'Methods', value: 'CNN + RNN + SVM on sensor streams' },
      { label: 'Strategic value', value: 'Generates the fusion training set' },
    ],
    processParams: [
      { label: 'Risk', value: 'Moisture reabsorption, aroma loss' },
      { label: 'Data', value: 'Provenance chain per lot' },
    ],
  },
  {
    slug: 'cup',
    index: 10,
    name: 'Enjoy Tea',
    tagline: 'Sensory quality & the taster benchmark',
    process:
      'The tea is brewed and evaluated — professionally by a taster scoring liquor, aroma, infusion and leaf, and eventually by the drinker. The taster score is the ground truth the entire pipeline is optimising toward, and it is set before auction.',
    aiSummary:
      'Electronic sensing platforms — e-nose, e-tongue, e-eye — exist specifically to replace a judgement that is subjective even within a single expert across sessions. Multi-level fusion of e-nose and e-tongue is an established framework, and NIR + e-tongue with SVM reaches 93.56% classification. An SVM on eight key chemical indices predicts sensory quality at F1 > 0.92. The honest framing: these systems approximate the taster, and the taster sets the price — so taster score remains the label, not the competitor.',
    researchDepth: 'survey',
    color: '#C6862F',
    accent: '#E0A64E',
    position: [8, 0, 8],
    metrics: [
      { label: 'NIR + e-tongue + SVM', value: '93.56% classification' },
      { label: 'SVM on 8 chemical indices', value: 'F1 > 0.92' },
      { label: 'Known limitation', value: 'Human scores vary session to session' },
    ],
    processParams: [
      { label: 'Ground truth', value: 'Taster score / auction grade' },
      { label: 'Proxy assay', value: 'TF:TR ratio' },
    ],
  },
];

export const STAGE_BY_SLUG = new Map(STAGES.map((s) => [s.slug, s]));

/** Ordered centre points used to build the connecting journey ribbon. */
export const JOURNEY_POINTS = STAGES.map((s) => s.position);

export function getStage(slug: string): Stage | undefined {
  return STAGE_BY_SLUG.get(slug);
}

export function adjacentStages(slug: string): { prev?: Stage; next?: Stage } {
  const i = STAGES.findIndex((s) => s.slug === slug);
  if (i === -1) return {};
  return { prev: STAGES[i - 1], next: STAGES[i + 1] };
}
