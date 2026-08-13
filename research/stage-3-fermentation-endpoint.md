# Stage 3: Fermentation Endpoint Prediction

**Part of:** [End-to-End Tea Quality & Process Optimization System](tea-quality-pipeline-literature-review.md)
**Status:** Research complete — ready for architecture decision
**Date:** 2026-08-13

---

## 1. Problem Definition & Objective

Fuse color-progression imaging with temperature/humidity data to predict the optimal fermentation (oxidation) cutoff time, replacing manual visual/smell judgment by tea makers. This is the stage where the literature already demonstrates **intra-stage multi-modal fusion** (image + e-nose) — the closest existing precedent to your project's cross-stage fusion ambitions, just scoped to one stage.

---

## 2. Inputs & Data Requirements

**Sensing modalities in use across the literature:**
| Modality | Purpose | Hardware examples from sources |
|---|---|---|
| RGB camera + controlled lighting | Color-progression tracking (yellow-red → purple-red as fermentation proceeds) | Digital SLR (Canon DS60D, 18MP) + uniform light source (Sphere100, 100 lx) in one published setup; consumer-grade "homemade machine vision system" also demonstrated as sufficient |
| Electronic nose (MOS gas sensor array) | Aroma/volatile compound tracking ("first"/"second" smell peak detection) | Array of metal-oxide-semiconductor sensors; low-cost, fast response, low power |
| Temperature/humidity sensors | Environmental conditions during fermentation | Standard IoT temp/humidity probes (same DHT22/SHT31 class as Stage 2); dual controllers (e.g., Inkbird-class) with humidifier/dehumidifier actuation used in analogous controlled-fermentation setups |
| Hyperspectral imaging | Higher-accuracy fermentation quality detection | $4,000–$90,000+ camera systems — real cost tradeoff vs. RGB |
| NIR spectroscopy (FT-NIR) | Fermentation degree evaluation, fused with vision | Used in "intelligent evaluation of black tea fermentation degree" study |

**Environmental control requirement (important, not just sensing):** fermentation requires uniform, controlled ambient temperature/humidity to be meaningful as a signal — this is a room/chamber design constraint, not just a sensor-placement one. Budget for humidity/temperature control actuation (dehumidifier/humidifier), not just passive monitoring, mirroring the withering stage's control loop.

**Lighting is a first-class design variable, not an afterthought:** the published machine-vision fermentation studies explicitly control light source and intensity (uniform 100 lx sphere lighting in one case) because raw color readings are lighting-dependent — CIE-Lab conversion partially compensates, but consistent, controlled lighting at the camera position is still required for reliable results.

---

## 3. State of the Art — Architecture Comparison

| Approach | Modalities | Result | Source |
|---|---|---|---|
| RF / SVM on CIE-Lab color features | RGB→Lab color only | RF slightly beats SVM; both beat linear PLS | Nature Sci Reports 2018 |
| TeaNet (CNN) | Color + texture | 100% (3 classes, small dataset — treat cautiously) | MDPI Data |
| PSO-CNN-LSTM | Hyperspectral, 5 time intervals (0–5h) | 96.78% | ScienceDirect |
| Feature-level & decision-level fusion | Image + e-nose | Fusion outperforms either single modality | ScienceDirect 2023 |
| SVR + spectroscopic fusion | Multi-sensor spectral fusion | 100% (4 categories, small/narrow dataset) | Peer-reviewed |
| IoT + CNN + majority voting | Image, distributed inference | — | Copernicus JSSS 2021 |
| Homemade real-time machine vision | RGB only | — | MDPI 2023 |
| E-nose only ("first"/"second" smell peak) | Aroma only | Second-peak detection inconsistent even for human tasters | Peer-reviewed |
| FT-NIR + computer vision, data fusion | Spectroscopy + vision | "Intelligent evaluation" | Peer-reviewed |

**Color-space finding (directly actionable, repeated across sources):** convert RGB → CIE-Lab before feature extraction; Lab consistently outperforms both raw RGB and HSV for correlating with fermentation quality indices and tracking the yellow-red→purple-red progression.

**Fusion-mechanism precedent (most relevant transferable pattern for your project):** the image+e-nose studies use both **feature-level fusion** (concatenate feature vectors before a shared classifier) and **decision-level fusion** (train separate classifiers per modality, combine via voting/weighted averaging) — both outperform single-modality baselines, with feature-level generally preferred when modalities are well-aligned in time. This is your best available template for how to fuse image + temp/humidity within this stage before you get to the harder cross-stage fusion problem in Stage 4.

---

## 4. Recommended Approach for This Project

1. **Camera + controlled lighting:** RGB camera (consumer-grade is demonstrated sufficient — no need for hyperspectral as a v1 requirement) with a fixed, uniform light source at the fermentation bed; convert to CIE-Lab in the processing pipeline.
2. **Environmental sensing:** temp/humidity sensors (same hardware class as Stage 2) with active humidity/temperature control, not just passive logging — fermentation consistency depends on it.
3. **Fusion architecture:** feature-level fusion of (a) CNN-extracted image features (color/texture trajectory) and (b) temp/humidity time-series features, feeding a shared classifier/regressor (RF or CNN-LSTM per the strongest-precedented approaches) predicting fermentation degree/endpoint.
4. **E-nose as an optional v2 addition:** the literature shows e-nose fusion adds real value (outperforms vision-only), but it's a separate hardware investment (MOS sensor array) — treat as an accuracy upgrade path once the vision+environmental baseline is validated, mirroring the phased-cost logic in Stage 2.

---

## 5. Evaluation Metrics & Validation Strategy

- **Classification/degree accuracy:** treat published 96–100% figures as **upper bounds achieved on small, single-site datasets**, not realistic first-pass targets — the master review's caution applies most strongly here of all four stages (most repeated "100%" claims in the whole literature set come from this stage).
- **Endpoint-timing accuracy:** minutes-of-deviation between predicted and tea-taster-confirmed optimal cutoff — this is the metric that actually matters operationally and isn't directly reported in any source; requires your own paired taster-judgment dataset for validation.
- **Cross-batch/cross-season generalization:** explicitly test across multiple fermentation batches/seasons before trusting any single-batch accuracy number, given the field-wide small-dataset problem confirmed by the MDPI 2026 review (see master document).
- **Lighting robustness:** validate model performance under realistic lighting drift (bulb aging, ambient light leakage) since all published setups used tightly controlled lighting that a working factory may not maintain perfectly.

---

## 6. Risks & Open Questions

| Risk | Severity | Mitigation |
|---|---|---|
| Near-universal "100% accuracy" claims in this stage's literature are the strongest instance of the small-dataset validation problem flagged in the master review | High | Do not treat any cited accuracy figure as a target; build your own multi-season validation set before trusting any number |
| Fermentation rooms need active humidity/temp control, not just sensing — this is a facilities/hardware cost the "sensor-only" framing might undercount | Medium | Budget for humidification/dehumidification actuation alongside sensors, not sensors alone |
| Lighting control is load-bearing for the vision signal but fragile in a working factory (dust, bulb degradation, ambient light) | Medium | Plan periodic camera/lighting calibration into the operational design, not just the initial build |
| E-nose MOS sensors have documented long-term drift/stability considerations in general e-nose literature (not fully covered in tea-specific sources found) | Low-Medium | If adopting e-nose in v2, budget for periodic recalibration against reference standards |
| Hyperspectral upgrade path is costly ($4K–$90K+) relative to RGB — easy to over-invest before validating whether it's needed | Low | Validate RGB+environmental baseline first; hyperspectral only if accuracy proves insufficient |

---

## 7. Phased Build Plan

1. **MVP:** RGB camera + controlled lighting + CIE-Lab color feature extraction, temp/humidity sensors with active control, RF or CNN classifier on fused image+environmental features for fermentation degree; simple threshold-based endpoint alert.
2. **V2:** Upgrade to CNN-LSTM for trajectory-aware endpoint prediction (not just point-in-time degree classification); validate against paired tea-taster judgments across multiple batches/seasons; add e-nose as a second fused modality if vision+environmental accuracy proves insufficient.
3. **V3:** Evaluate hyperspectral/FT-NIR upgrade only if v1/v2 accuracy plateaus below operational requirements; encode fermentation trajectory (see Stage 4 doc) for cross-stage fusion into final grade prediction.

---

## 8. References

1. Prediction of Congou Black Tea Fermentation Quality Indices from Color Features Using Non-Linear Regression Methods. (2018). *Scientific Reports*. https://www.nature.com/articles/s41598-018-28767-2
2. An Optimum Tea Fermentation Detection Model Based on Deep Convolutional Neural Networks (TeaNet). *Data*, 5(2), 44. https://doi.org/10.3390/data5020044
3. Detection of black tea fermentation quality based on optimized deep neural network and hyperspectral imaging (PSO-CNN-LSTM). *ScienceDirect*. https://sciencedirect.com/science/article/abs/pii/S1350449524005097
4. Monitoring black tea fermentation quality by intelligent sensors: Comparison of image, e-nose and data fusion. (2023). *ScienceDirect*. https://www.sciencedirect.com/science/article/abs/pii/S2212429223001050
5. An internet of things (IoT)-based optimum tea fermentation detection model using CNNs and majority voting techniques. (2021). *JSSS*. https://jsss.copernicus.org/articles/10/153/2021/
6. Real-Time Discrimination and Quality Evaluation of Black Tea Fermentation Quality Using a Homemade Simple Machine Vision System. (2023). *Foods*, 9, 814. https://www.mdpi.com/2311-5637/9/9/814
7. Detection of optimum fermentation time for black tea manufacturing using electronic nose. *ScienceDirect*. https://www.sciencedirect.com/science/article/abs/pii/S0925400506004965
8. Electronic Nose Technologies in Monitoring Black Tea Manufacturing Process. (2020). *Journal of Sensors*. https://onlinelibrary.wiley.com/doi/10.1155/2020/3073104
9. Intelligent evaluation of black tea fermentation degree by FT-NIR and computer vision based on data fusion strategy. *ResearchGate*. https://www.researchgate.net/publication/339669262
10. Monitoring and grading of tea by computer vision – A review (camera/lighting setup detail: Canon DS60D + Sphere100 lighting). https://www.academia.edu/109628092/
11. Computer based system for matching colours during the monitoring of tea fermentation. *International Journal of Food Science and Technology*. https://academic.oup.com/ijfst/article/40/6/675/7911389
12. Design of Electronic Nose Based on MOS Gas Sensors and Its Application in Juice Identification. *PMC*. https://pmc.ncbi.nlm.nih.gov/articles/PMC11860815/
13. Electronic Sensor Technologies in Monitoring Quality of Tea: A Review. *Biosensors*, 12(5), 356. https://doi.org/10.3390/bios12050356
14. Benefits of Hyperspectral Imaging for Food Quality Assurance (cost figures). https://www.advian.fi/en/blog/benefits-of-hyperspectral-imaging-for-food-quality-assurance
15. How Much Does a Hyperspectral Camera Cost? https://www.chnspec.net/camara-hiperespectral-guia-precos-figspec.html
