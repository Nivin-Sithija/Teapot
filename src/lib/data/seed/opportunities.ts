import type { AIOpportunity } from '../../types';

/**
 * Where AI/ML can actually be applied at each stage, with an honest maturity
 * label attached. `mature` means the literature has effectively solved it and
 * you should adopt rather than innovate; `open-gap` means a review paper has
 * explicitly named it as unaddressed.
 */
export const OPPORTUNITIES: AIOpportunity[] = [
  // ── Plantation ────────────────────────────────────────────────────────────
  {
    id: 'op-plant-yield',
    stageSlug: 'plantation',
    title: 'Pre-harvest yield forecasting',
    description:
      'Estimate the volume of pluckable shoot per block weeks before harvest so factory capacity, labour and withering trough allocation can be planned instead of reacted to.',
    techniques: ['Random Forest', 'Gradient Boosting', 'Elastic Net', 'CNN on UAV imagery'],
    maturity: 'emerging',
    evidence: 'Random forest outperforms linear, SVM, GBM and elastic-net baselines at every growth stage tested.',
  },
  {
    id: 'op-plant-nutrition',
    stageSlug: 'plantation',
    title: 'Nitrogen and stress status mapping',
    description:
      'Turn multispectral flights into per-block nitrogen and water-stress maps, targeting fertiliser and irrigation where they change the outcome rather than uniformly.',
    techniques: ['Vegetation indices (NDVI, Clgreen)', 'Canopy coverage regression', 'Parameter optimisation algorithms'],
    maturity: 'emerging',
    evidence: 'Canopy coverage combined with spectral indices mitigates NDVI saturation at high LAI.',
  },
  {
    id: 'op-plant-parcel',
    stageSlug: 'plantation',
    title: 'Automated parcel delineation',
    description:
      'Segment plantation parcels from aerial imagery so every downstream measurement can be attributed to a specific block — the spatial key that makes estate-level traceability possible.',
    techniques: ['DVIT-UNet', 'Semantic segmentation'],
    maturity: 'emerging',
  },

  // ── Harvest ───────────────────────────────────────────────────────────────
  {
    id: 'op-harvest-bud-detection',
    stageSlug: 'harvest',
    title: 'Tender shoot detection for selective robotic plucking',
    description:
      'Locate the bud-and-two-leaves target in cluttered canopy and hand a cut point to a mechanical end-effector, recovering hand-plucking selectivity at machine speed.',
    techniques: ['YOLOv4/v7/v8/X', 'GhostNet backbone', 'Depthwise separable convolution'],
    maturity: 'mature',
    evidence: 'Multiple independent groups report 88–93% mAP/precision with real-time inference on embedded boards.',
  },
  {
    id: 'op-harvest-depth',
    stageSlug: 'harvest',
    title: 'RGB-D pose estimation for cut-point placement',
    description:
      'Add depth so the system knows not just where the shoot is in the image but where it is in space — the difference between detecting a bud and actually picking it.',
    techniques: ['RGB-D feature fusion', 'Improved YOLOv7'],
    maturity: 'emerging',
    evidence: 'The Frontiers review flags depth cameras as underused in tea outside harvesting.',
  },
  {
    id: 'op-harvest-timing',
    stageSlug: 'harvest',
    title: 'Optimal plucking-round scheduling',
    description:
      'Combine canopy growth models with weather to decide when a block should be plucked, trading shoot maturity against round length.',
    techniques: ['Time-series regression', 'Growth modelling'],
    maturity: 'open-gap',
    evidence: 'No tea-specific scheduling model surfaced in this search — the growth-monitoring and harvesting literatures do not meet.',
  },

  // ── Sorting ───────────────────────────────────────────────────────────────
  {
    id: 'op-sort-disease-class',
    stageSlug: 'sorting',
    title: 'Disease type classification',
    description:
      'Identify which foliar disease is present in the intake batch. Adopt an established backbone — this problem is solved and architecture novelty here buys nothing.',
    techniques: ['DenseNet201', 'EfficientNetB0', 'MobileNetV3', 'CNN ensembles'],
    maturity: 'mature',
    evidence: '95–99% reported across at least six independent studies on public tea datasets.',
  },
  {
    id: 'op-sort-severity',
    stageSlug: 'sorting',
    title: 'Continuous disease severity scoring',
    description:
      'Produce a continuous severity ratio per batch — diseased leaf area over total leaf area from a segmentation mask — rather than a presence/absence label. This is the feature Stage 8 fusion actually consumes.',
    techniques: ['U-Net', 'DeepLabV3+', 'SAM-assisted annotation', 'Grad-CAM activation mass (cheap proxy)'],
    maturity: 'open-gap',
    evidence:
      'Nearly all tea disease work is categorical classification. The segmentation-ratio approach is well established in other crops and directly transferable.',
  },
  {
    id: 'op-sort-impurity',
    stageSlug: 'sorting',
    title: 'Foreign matter and impurity rejection',
    description:
      'Detect non-tea material in the intake stream — still largely a manual job, and one where the cost of a miss compounds through every downstream stage.',
    techniques: ['Pruned YOLOv8', 'Knowledge distillation', 'Spectral vision'],
    maturity: 'emerging',
  },
  {
    id: 'op-sort-severity-calibration',
    stageSlug: 'sorting',
    title: 'Severity → biochemical decline calibration',
    description:
      'Confirm that your computed severity ratio actually predicts theaflavin/thearubigin loss in your own batches. The disease-to-biochemistry link is established; the CV-score-to-biochemistry link is not.',
    techniques: ['Correlation study', 'Paired lab assay'],
    maturity: 'open-gap',
    evidence: 'Named in the Stage 1 research document as the single most important validation gap for intake QA.',
  },

  // ── Withering ─────────────────────────────────────────────────────────────
  {
    id: 'op-wither-moisture',
    stageSlug: 'withering',
    title: 'Real-time moisture content prediction',
    description:
      'Predict current and future leaf moisture from sensor streams so the endpoint is called on data rather than on a fixed clock.',
    techniques: ['STA-BiLSTM', 'STA-BiGRU', 'XGBoost', 'PLSR ensembles'],
    maturity: 'mature',
    evidence: 'R² 0.85–0.98 across at least five independent studies with differing sensor stacks.',
  },
  {
    id: 'op-wither-time-to-target',
    stageSlug: 'withering',
    title: 'Time-to-target-moisture estimation',
    description:
      'Forecast how many minutes remain until the 58–62% target, which is what actually lets a shift supervisor sequence troughs and rolling capacity.',
    techniques: ['Recurrent forecasting', 'Physics-informed baseline'],
    maturity: 'emerging',
    evidence: 'Implied by the moisture-prediction literature but rarely reported as a minutes-of-error metric.',
  },
  {
    id: 'op-wither-energy',
    stageSlug: 'withering',
    title: 'Energy-aware airflow control',
    description:
      'Drive fans only as hard as the moisture trajectory requires. The physics model gives the minimum airflow for quality; the ML model says how much time that buys.',
    techniques: ['PID over VSD', 'ML-tuned PID', 'Mass-flow thermodynamic model', 'Threshold heuristics'],
    maturity: 'mature',
    evidence:
      'Control side is an established industrial standard. Note that energy savings are described qualitatively in the literature — no kWh figures exist to cite.',
  },

  // ── Rolling ───────────────────────────────────────────────────────────────
  {
    id: 'op-roll-degree',
    stageSlug: 'rolling',
    title: 'Rolling degree classification',
    description:
      'Replace the operator\'s colour judgement with a camera, giving a repeatable rolling endpoint instead of one that varies by shift and by person.',
    techniques: ['Colour feature extraction', 'SVM / RF classifiers', 'Pyramid CNN'],
    maturity: 'emerging',
    evidence: '97.5% classification accuracy reported using inexpensive machine vision.',
  },
  {
    id: 'op-roll-pigment',
    stageSlug: 'rolling',
    title: 'In-line pigment content prediction',
    description:
      'Predict theaflavin and thearubigin content during the roll itself, converting a process-stage observation into a chemically meaningful feature worth carrying into fusion.',
    techniques: ['Multi-source information fusion', 'System analysis methods'],
    maturity: 'emerging',
  },
  {
    id: 'op-roll-maceration',
    stageSlug: 'rolling',
    title: 'Cell-rupture completeness estimation',
    description:
      'Estimate how thoroughly cell walls have ruptured — the actual mechanism rolling exists to achieve — rather than inferring it from surface colour alone.',
    techniques: ['Microscopy + CV', 'Texture analysis'],
    maturity: 'open-gap',
    evidence: 'No direct measurement approach surfaced; current practice infers rupture indirectly from colour.',
  },

  // ── Fermenting ────────────────────────────────────────────────────────────
  {
    id: 'op-ferm-endpoint',
    stageSlug: 'fermenting',
    title: 'Oxidation endpoint prediction',
    description:
      'Call the fermentation cutoff from colour trajectory plus environment, replacing the tea maker\'s sight-and-smell judgement with something reproducible across shifts.',
    techniques: ['CNN-LSTM', 'Random Forest on CIE-Lab features', 'PSO-tuned architectures'],
    maturity: 'mature',
    evidence: 'The most heavily studied stage in the corpus — though the repeated 96–100% figures come from small single-batch datasets.',
  },
  {
    id: 'op-ferm-fusion',
    stageSlug: 'fermenting',
    title: 'Image + aroma sensor fusion',
    description:
      'Fuse vision with an electronic nose, which is the mechanised version of exactly what a tea maker does — look and smell — and reliably beats either signal alone.',
    techniques: ['Feature-level fusion', 'Decision-level fusion', 'MOS gas sensor arrays'],
    maturity: 'mature',
    evidence: 'The most mature intra-stage fusion precedent in tea, and the best available template for cross-stage fusion.',
  },
  {
    id: 'op-ferm-lighting',
    stageSlug: 'fermenting',
    title: 'Lighting-drift robustness',
    description:
      'Keep colour readings valid as bulbs age, dust accumulates and ambient light leaks in. Every published setup used tightly controlled lighting a working factory will not maintain.',
    techniques: ['Colour constancy', 'Reference-target calibration', 'Domain adaptation'],
    maturity: 'open-gap',
    evidence: 'Flagged as a risk in the Stage 3 research document; not addressed in any source found.',
  },

  // ── Drying ────────────────────────────────────────────────────────────────
  {
    id: 'op-dry-moisture',
    stageSlug: 'drying',
    title: 'Drying moisture endpoint prediction',
    description:
      'Hit ~3% residual moisture without over-firing, which flattens the cup, or under-firing, which invites spoilage in storage.',
    techniques: ['PLSR', 'NIR + attention networks', 'Multi-scale feature fusion'],
    maturity: 'emerging',
    evidence: 'Spectral models reach R² > 0.94; PLSR remains a strong, simple baseline at R² 0.77–0.80.',
  },
  {
    id: 'op-dry-uniformity',
    stageSlug: 'drying',
    title: 'Moisture distribution uniformity',
    description:
      'Detect uneven drying across the bed — tips and petioles hold more water than leaf surfaces, so a batch that averages correctly can still contain wet pockets that spoil.',
    techniques: ['Hyperspectral imaging', 'Spatial moisture mapping'],
    maturity: 'emerging',
    evidence: 'Non-uniform distribution demonstrated directly by hyperspectral imaging of stacked leaf.',
  },
  {
    id: 'op-dry-energy',
    stageSlug: 'drying',
    title: 'Dryer energy optimisation',
    description:
      'Drying is the most energy-intensive stage in the factory, yet no tea-specific optimisation study surfaced — the modelling patterns proven in withering transfer here directly.',
    techniques: ['Thermodynamic modelling', 'Predictive control'],
    maturity: 'open-gap',
  },

  // ── Grading ───────────────────────────────────────────────────────────────
  {
    id: 'op-grade-fusion',
    stageSlug: 'grading',
    title: 'Cross-stage fusion → final batch grade',
    description:
      'Carry disease severity, withering trajectory and fermentation trajectory forward into a single grade predictor, so a bad outcome can be caught before drying locks it in. No published system does this.',
    techniques: [
      'Mid-level feature fusion',
      'Cross-attention',
      'Attention bottlenecks',
      'Gradient-boosted trees on concatenated features',
    ],
    maturity: 'open-gap',
    evidence:
      'Confirmed absent by two independent reviews (Frontiers 2023, MDPI Foods 2026). Design constraint: prefer modular mid-level fusion over joint end-to-end training, per the Long-Tea-CLIP task-interference counter-precedent.',
  },
  {
    id: 'op-grade-ablation',
    stageSlug: 'grading',
    title: 'Signal complementarity ablation',
    description:
      'Train the fusion model with each upstream signal held out to prove the three signals carry genuinely complementary information rather than three views of the same thing.',
    techniques: ['Ablation study', 'Feature importance analysis'],
    maturity: 'open-gap',
    evidence:
      'The MDPI 2026 review warns explicitly that multimodal only beats single-sensor when modalities are complementary, not redundant.',
  },
  {
    id: 'op-grade-single-stage',
    stageSlug: 'grading',
    title: 'Spectroscopic grade classification',
    description:
      'Classify made-tea grade from NIR spectra at a single timepoint — the well-solved, conventional version of grading, and the right baseline to beat.',
    techniques: ['CLPSO-SVM', 'TeaNet / TeaResNet', 'NIRS + e-nose fusion'],
    maturity: 'mature',
    evidence: '99.17% reported for CLPSO-SVM on NIRS.',
  },
  {
    id: 'op-grade-causal',
    stageSlug: 'grading',
    title: 'Causal attribution of grade outcomes',
    description:
      'Answer "which stage cost us the grade" rather than only "what grade is it", modelling production → composition → perception as an explicit causal chain.',
    techniques: ['Structural causal models', 'Counterfactual GANs'],
    maturity: 'emerging',
    evidence: 'Reported +9.4% accuracy and +12.7% interpretability over baseline; a v2/v3 target, not a first build.',
  },

  // ── Packaging ─────────────────────────────────────────────────────────────
  {
    id: 'op-pack-shelf-life',
    stageSlug: 'packaging',
    title: 'Shelf-life and spoilage prediction',
    description:
      'Forecast remaining shelf life from actual storage and transport conditions rather than from a nominal date printed at packing time.',
    techniques: ['CNN', 'RNN', 'SVM', 'Edge analytics on embedded sensors'],
    maturity: 'emerging',
  },
  {
    id: 'op-pack-traceability',
    stageSlug: 'packaging',
    title: 'Per-lot provenance chain',
    description:
      'Record a verifiable per-lot chain from block to pack. For this project the chain is not compliance overhead — it is the mechanism that assembles the labelled cross-stage dataset grading needs.',
    techniques: ['Blockchain ledger', 'IoT sensor logging', 'Fuzzy logic quality scoring'],
    maturity: 'emerging',
    evidence: 'A tea-specific system logged 26 characteristic values per lot across 500 lots.',
  },
  {
    id: 'op-pack-authentication',
    stageSlug: 'packaging',
    title: 'Origin authentication and fraud detection',
    description:
      'Verify that single-origin and geographical-indication claims hold, protecting the price premium those claims carry.',
    techniques: ['Spectroscopic fingerprinting', 'Blockchain provenance', 'Anomaly detection'],
    maturity: 'emerging',
  },

  // ── Cup ───────────────────────────────────────────────────────────────────
  {
    id: 'op-cup-sensory',
    stageSlug: 'cup',
    title: 'Instrumental sensory quality prediction',
    description:
      'Approximate the taster panel with e-nose, e-tongue and e-eye, addressing the fact that human scores vary session to session even within one assessor.',
    techniques: ['Multi-level e-nose/e-tongue fusion', 'SVM', 'Miniature NIR'],
    maturity: 'mature',
    evidence: 'Up to 93.56% classification with NIR + e-tongue + SVM.',
  },
  {
    id: 'op-cup-chemistry',
    stageSlug: 'cup',
    title: 'Chemistry-to-cup mapping',
    description:
      'Predict sensory score from measurable chemistry — pigments and catechin ratios — giving a lab-verifiable target the whole pipeline can optimise against.',
    techniques: ['SVM on key chemical indices', 'Random Forest'],
    maturity: 'mature',
    evidence: 'F1 > 0.92 across green and black teas on eight chemical indices.',
  },
  {
    id: 'op-cup-price',
    stageSlug: 'cup',
    title: 'Auction price prediction',
    description:
      'Link predicted quality to realised auction price, which is the only signal that converts a quality improvement into a business case.',
    techniques: ['Regression on sensory + market features'],
    maturity: 'open-gap',
    evidence:
      'Taster assessment sets the pre-auction estimate, but market conditions set the realised price — no published model found joining process data to price outcomes.',
  },
  {
    id: 'op-cup-drift',
    stageSlug: 'cup',
    title: 'Sensor drift compensation',
    description:
      'Keep e-nose and e-tongue readings comparable over months of operation, since MOS sensors drift and a quality benchmark that silently moves is worse than none.',
    techniques: ['Autoencoder denoising', 'Periodic reference calibration'],
    maturity: 'emerging',
  },
];

export const OPPORTUNITIES_BY_STAGE = OPPORTUNITIES.reduce<Record<string, AIOpportunity[]>>((acc, o) => {
  (acc[o.stageSlug] ??= []).push(o);
  return acc;
}, {});
