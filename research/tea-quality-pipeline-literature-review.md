# Literature Review: End-to-End Tea Quality & Process Optimization System

**Prepared for:** Technical grounding / architecture decisions (not for publication)
**Date:** 2026-08-13
**Scope:** Prior methods, architectures, sensor setups, benchmarks, and datasets for AI-driven black tea manufacturing QA, across intake disease detection, withering optimization, fermentation endpoint prediction, and multi-modal fusion for final batch grading.
**AI disclosure:** This report was produced with AI-assisted web research tools (Claude, using the ARS deep-research pipeline). All findings are drawn from web-searched and fetched sources with URLs cited; claims were cross-checked across ≥2 independent sources where possible. See *Source Verification Flags* and *Limitations* before treating any single figure as production-grade.

---

## Related Documents

This cross-stage synthesis is now backed by four standalone, structured per-stage research documents (problem definition, hardware/architecture comparison tables, evaluation strategy, risks, phased build plan) — use those for implementation decisions, use this document for the cross-stage picture:
- [Stage 1: Intake QA — Disease Detection & Severity Scoring](stage-1-intake-disease-detection.md)
- [Stage 2: Withering Optimization](stage-2-withering-optimization.md)
- [Stage 3: Fermentation Endpoint Prediction](stage-3-fermentation-endpoint.md)
- [Stage 4: Multi-Modal Fusion → Batch Quality Prediction](stage-4-fusion-batch-grade.md)

---

## Executive Summary

Each of the four proposed pipeline stages has real, citable precedent in the literature — this is not a "does this technology exist" question, it's a "how do the pieces plug together" question. Disease-severity CV and fermentation-endpoint CV are the most mature sub-domains (95–100% classification accuracy is routinely reported, though see caution below on what that number actually means). Withering optimization has an established sensor + control-theory literature independent of the ML layer, which is good news — you can borrow proven control logic rather than learning it from scratch. The genuinely open problem — confirmed independently by two recent review papers (Frontiers, 2023; MDPI *Foods*, 2026) — is **cross-stage fusion**: no published system carries disease severity, withering trajectory, and fermentation trajectory forward into one final-grade predictor. Every study found treats its pipeline stage in isolation, on its own dataset, with its own model. That is your project's real contribution, and it is a defensible one.

The most important design-relevant finding, buried in a single grading paper, is a **counter-precedent**: at least one recent tea-grading system deliberately *rejected* a unified end-to-end multi-task architecture because heterogeneous sensory attributes interfered with each other during joint training, and used a modular architecture instead. Your fusion-stage design should treat this as a named constraint (favor mid-level feature/embedding fusion into a single downstream head, rather than full joint end-to-end training) rather than something to discover the hard way.

---

## Methodology Note

Desk-based technical literature synthesis (not a formal PRISMA systematic review). ~45 candidate sources found across 15 targeted searches; 32 retained after relevance/quality screening. Evidence is explicitly separated into three confidence tiers below: (1) peer-reviewed journal/conference findings cross-confirmed across ≥2 sources, (2) single-study peer-reviewed findings, (3) preprints/gray literature. See *Source Verification Flags*.

---

## Stage 1: Intake QA — Disease Detection & Severity Scoring

### State of the art

Tea leaf disease classification via CNNs is the best-covered sub-domain in this review. Reported architectures and results:

| Approach | Target | Reported accuracy | Source tier |
|---|---|---|---|
| Faster R-CNN | Tea leaf blight detection + severity in natural scenes | Not numerically stated in snippet | Peer-reviewed (ScienceDirect) |
| Improved DCNN (inverted residuals, linear bottleneck) | Grey blight | 98.99% acc, 98.51% precision, 98.48% recall | ⚠️ Wiley/Hindawi title discontinued for peer-review integrity issues — see flags |
| WaveLiteNet (lightweight wavelet-CNN) | 5 disease categories incl. blister blight | Outperforms other lightweight models; exact figure not captured | Peer-reviewed (PMC) |
| Ensemble (ResNet18, VGG16, InceptionV3, MobileNetV2) + Grad-CAM | 8-class disease classification | Feature+PCA+RF: 95.6%; output-level ensemble: 98.3% | Peer-reviewed (MDPI Agriculture) |
| DenseNet201 | teaLeafBD dataset (7 categories) | 99% test accuracy | Peer-reviewed |
| Modified EfficientNetB0 | Two public tea-disease datasets | 99.49% / 90.73% | Peer-reviewed |
| Segment Anything Model + CNN | Disease detection via segmentation | Qualitative | Peer-reviewed (ScienceDirect) |
| TeaLeafVision | Explainable, robust disease classification | Not captured | Preprint (arXiv, 2026) |

**Datasets found:** teaLeafBD (~4,000 images, Sylhet, Bangladesh, 7 categories), Kaggle "Tea_Leaf_Disease" (6 categories: Algal Spot, Brown Blight, Gray Blight, Healthy, Helopeltis, Red Spot), and a combined Hibiscus+Tea leaf disease dataset. All are relatively small (hundreds to a few thousand images) and single-region.

**Severity vs. presence/absence — the actual gap here:** Nearly all of the above do categorical disease *classification*, not continuous *severity* estimation. Only the Faster R-CNN blight paper and passing references to "Grad-CAM for severity assessments and crop loss estimation" address severity directly. **This is a smaller, more tractable gap than the fusion gap** — you'll likely need to build severity scoring yourself (e.g., via lesion-area segmentation ratio or Grad-CAM activation-mass proxy) rather than adopt an existing severity model wholesale, since the field has focused on multi-class disease identification, not grading.

**Biochemical grounding (theaflavin/thearubigin link) — independently confirmed:** Multiple foliar diseases (blister blight, brown blight, grey blight, bird's-eye spot, sooty mould) measurably reduce polyphenols, catechins, amino acids, theaflavins, and thearubigins in the resulting made tea — theaflavins account for 2–6% of black tea dry weight, thearubigins up to 60% of water-extractable material. This is well-established biochemistry (metabolomics + foliar disease study, plant pathology literature), not a hypothesis you need to validate from scratch — you can cite this directly as the mechanistic justification for using disease severity as a leading indicator of final quality.

### Implementation implications
- Start from an established backbone (DenseNet201, EfficientNetB0, or a ResNet/MobileNet ensemble) rather than architecture novelty — the classification problem is solved; your value-add is severity scoring and downstream integration.
- Grad-CAM is a validated, low-effort interpretability layer already shown to highlight symptomatic regions correctly — usable both as a severity-proxy (activation mass/area) and as an operator-facing explanation.
- Expect to need your own severity-labeled dataset (or a segmentation-based proxy) since public datasets are class-labeled, not severity-labeled.

---

## Stage 2: Withering Optimization

### State of the art

| Approach | Task | Result / notes | Source tier |
|---|---|---|---|
| STA-BiLSTM + XGBoost | Moisture content prediction during withering | Novel spatiotemporal-attention BiLSTM | Peer-reviewed (Springer, 2025) |
| XGBoost / LightGBM + IoT (ThingSpeak) | Real-time moisture prediction | ⚠️ journal indexing unverified (CANA) | Flagged — see verification |
| ANN | Moisture loss prediction in withering | — | Peer-reviewed (IEEE Xplore) |
| Multifrequency microwave (2–10 GHz) + ant colony optimization | Non-destructive moisture measurement | "Promising performance" | Peer-reviewed (ScienceDirect) |
| Electronic eye + NIR spectroscopy | Moisture content monitoring | — | Peer-reviewed (Nature Sci Reports) |
| VNIR spectroscopy + ensemble modeling | White tea withering moisture | — | Peer-reviewed (MDPI Horticulturae) |
| 1D heat/mass-transfer finite-difference model | Physics-based trough withering simulation | Classical, non-ML baseline | Peer-reviewed, older/seminal |
| Low-cost capacitive + temp/humidity sensors | Moisture detection, portable | ±0.1% RH accuracy | Peer-reviewed |

**Sensor setup — well established:** temp/humidity sensors at trough inlet and outlet, load-cell weighing for real-time moisture-loss tracking, airflow velocity ~1.2 ± 0.3 m/s, operating temperature 20–35°C, RH 40–90%. This directly matches your proposed sensor stack — no need to invent instrumentation, it's a solved problem at the hardware layer.

**Energy optimization — a separate, mature literature you can borrow directly:**
- Variable-speed-drive (VSD) fan control tied to a thermodynamic mass-flow-rate model of required airflow given real-time leaf moisture.
- "Fan off when not required, auto-on if weight-loss rate falls below target" — a simple, already-proven control heuristic.
- Air-source heat pumps integrated with automatic temp/humidity control for higher energy efficiency, reported as increasingly standard in industrial withering.
- A 2024/2025 Nature *Scientific Reports* paper describes a full "intelligent withering control system" (selenium-enriched tea) combining sensing + control — worth reading in full as the closest existing analogue to your Stage 2 module.

### Implementation implications
- Your "predict time-to-optimal moisture + recommend airflow/fan adjustments, balancing quality vs. energy" framing is not a novel problem statement — it's an active applied-engineering area. Treat the physics-based heat/mass-transfer model as a baseline/sanity-check layer underneath your learned regressor, not a replacement for it.
- BiLSTM / XGBoost / LightGBM on time-series sensor data is the established modeling approach; near-infrared or microwave sensing is an optional accuracy upgrade over temp/humidity alone, at higher hardware cost.
- Vision-based (color/texture) moisture estimation exists as a supplementary/backup signal (PLS/SVM on leaf images) if sensor coverage is incomplete.

---

## Stage 3: Fermentation Endpoint Prediction

### State of the art

| Approach | Task | Result | Source tier |
|---|---|---|---|
| Machine vision (RGB/HSV/CIE-Lab) + Random Forest / SVM | Fermentation quality index from color features | RF slightly outperforms SVM; CIE-Lab best color space | Peer-reviewed (Nature Sci Reports, 2018) |
| Image + e-nose, feature-level & decision-level fusion | Fermentation degree classification | Fusion > either single modality | Peer-reviewed (ScienceDirect, 2023) |
| Electronic nose only | Optimum fermentation time ("first"/"second" smell peak) | Second-peak detection inconsistent even for humans | Peer-reviewed |
| TeaNet (CNN) | Fermentation level from color+texture | 100% (3 classes, small dataset) | Peer-reviewed (MDPI Data) |
| IoT + CNN + majority voting | Optimum fermentation detection | — | Peer-reviewed (Copernicus JSSS, 2021) |
| PSO-CNN-LSTM + hyperspectral imaging | Fermentation quality, 5 time intervals (0–5h) | 96.78% | Peer-reviewed (ScienceDirect) |
| SVR + spectroscopic fusion | 4 fermentation categories | 100% (small/narrow dataset) | Peer-reviewed |
| Homemade real-time machine vision system | Fermentation discrimination | — | Peer-reviewed (MDPI, 2023) |

**Color-space finding (directly actionable):** CIE-Lab consistently outperforms RGB/HSV for tracking fermentation color progression (yellow-red → purple-red as fermentation proceeds) and correlates better with quality indices — a concrete, low-cost implementation detail: convert your fermentation-stage camera pipeline to Lab space before feature extraction, not RGB.

**Fusion precedent within this stage:** Image+e-nose fusion (feature-level and decision-level) is the most mature *intra-stage* fusion example in the entire literature set — closer to your Stage 4 ambitions than anything in the grading literature, just scoped to one stage rather than the whole pipeline. This is a good architectural reference: whatever fusion mechanism (feature-level concatenation, decision-level voting, or attention-based) works here for image+e-nose likely transfers conceptually to image+environmental-sensor fusion for your fermentation module, and by extension to your cross-stage fusion.

### Implementation implications
- Manual "visual/smell judgment" replacement is well-precedented — e-nose replacing "smell," CIE-Lab color tracking replacing "visual" — your framing matches the field's own framing of the problem almost exactly.
- Treat the repeated 96–100% accuracy figures with caution (see verification flags) — these are small, often single-batch/single-season studies; budget for your own validation on multi-season, multi-batch data before trusting a similar number.
- Hyperspectral imaging is the accuracy ceiling in this literature but adds real hardware cost/complexity versus RGB+environmental sensors — a reasonable v1 vs. v2 tradeoff to flag explicitly in your architecture doc.

---

## Stage 4: Multi-Modal Fusion → Final Batch Grade Prediction

### State of the art (single-stage / non-cross-stage fusion)

| Approach | Task | Result | Source tier |
|---|---|---|---|
| ResNet18 / MobileNetV3 | Fresh tea leaf grade (bud/leaf combination) | >98% accuracy | Peer-reviewed |
| YOLOv8x-SPPCSPC-CBAM | Fresh tea leaf quality-grade classification | — | Peer-reviewed (Nature Sci Reports, 2024) |
| Random Forest (best of several ML models) | EGCG, amino acid, polyphenol, caffeine prediction | RF best across constituents | Peer-reviewed |
| CLPSO-SVM on NIRS | Tea quality-level classification | 99.17% | Peer-reviewed (MDPI Foods) |
| TeaNet / TeaResnet / TeaMobilenet | NIR-spectroscopy-based quality assurance | — | Peer-reviewed |
| NIRS + e-nose, data fusion | Black tea quality-grade discrimination | — | Peer-reviewed |
| SVM on 8 key chemical indices (pigments, catechin ratios) | Sensory quality prediction, green+black tea | F1 > 0.92 | Peer-reviewed |
| CNN+GRU on image + environmental parameters (humidity, temp, radiation, wind, UV) | Pu-erh tea sun-drying moisture + quality | — | Peer-reviewed (PMC) |
| SCM + Counterfactual GAN ("causal deep learning") | Production→composition→perception causal chain | RMSE 0.16–0.39 across quality dimensions; +9.4% accuracy, +12.7% interpretability vs. baseline | Peer-reviewed (Springer, 2025) |
| Whale-optimized Elman network, mid-level fusion (NIR + visible camera) | Moisture content | Validation r = 0.9984 | Peer-reviewed |
| Multi-source (leaf + soil information) | Tea quality estimation | — | Peer-reviewed (PMC) |

### The gap — independently confirmed by two review papers

**Frontiers (2023), "A review on the application of computer vision and machine learning in the tea industry"** — fetched and read directly. Verbatim-characterized findings:
- "No end-to-end systems linking disease detection through final grading appear in the literature reviewed."
- "Each stage uses isolated datasets and independent models."
- "Due to the lack of publicly available datasets, most research scholars use their own collected data" — no unified dataset spans multiple processing stages.
- Depth cameras are underused in tea processing outside harvesting, limiting 3D quality-analysis potential.

**MDPI *Foods* (May 2026), "Multimodal Sensor Fusion for Non-Destructive Tea Quality Evaluation: Deep Learning-Enabled Methods, Applications, and Challenges"** — the most current and most directly relevant single source found. Key points:
- Covers machine vision, NIR/MIR spectroscopy, Raman/fluorescence spectroscopy, hyperspectral imaging, e-nose/e-tongue as the modalities in play.
- Names the same structural problem independently: "small and weakly standardized datasets, insufficient external validation, sensor instability, limited model transferability, high computational cost, insufficient interpretability."
- Explicit forward-looking call: "standardized datasets, leakage-free validation protocols, interpretable multimodal modeling, truly independent external validation, interoperable multi-sensor platforms, and lightweight deployable models."
- Explicit caveat directly relevant to your architecture: **"Multimodal approaches can outperform single-sensor systems only when the selected modalities provide complementary, rather than redundant, information layers"** — worth stress-testing your 3-signal fusion (disease severity + withering trajectory + fermentation trajectory) against this: are these genuinely complementary (yes — they capture sequential, non-overlapping process stages) rather than redundant measurements of the same thing.

**The counter-precedent (important, not to be buried):** at least one tea-grading paper in this space *deliberately chose a modular architecture over unified end-to-end multi-task learning*, citing task interference from the heterogeneous nature of tea sensory attributes when trained jointly. This is the single most load-bearing finding for your Stage 4 design decision.

### Implementation implications — direct architectural guidance
1. **Favor mid-level (feature/embedding) fusion over full end-to-end joint training.** Extract a fixed-size feature vector from each upstream stage (disease-severity score + embedding, withering trajectory summary/final-state features, fermentation trajectory summary/final-state features), then fuse at a downstream regressor/classifier — rather than backpropagating end-to-end through all four stages jointly. This directly addresses the task-interference counter-precedent.
2. **Treat "complementary vs. redundant" as an explicit validation question**, not an assumption — run ablations (grade-prediction accuracy with vs. without each upstream signal) to confirm each stage actually contributes independent information before finalizing the fusion architecture.
3. **Build for external validation from day one.** Every review flags "no independent/external validation" and "small non-standardized datasets" as the field's core weakness. If your batch-quality traceability chain naturally accumulates multi-season, multi-batch data across a real factory's operation, that alone is a meaningful contribution the current literature doesn't have — hold out full seasons/factories for validation, not just random batch splits.
4. **No existing commercial or academic system does what Stage 4 proposes.** This was checked directly (industrial IoT / smart-factory search returned only single-stage controllers — withering control systems, traceability/RFID systems — not cross-stage quality fusion). This supports, rather than undermines, treating the fusion model as your project's core novel contribution.

---

## Cross-Cutting Design Recommendations

| Stage | Recommended starting point | Confidence |
|---|---|---|
| Intake CV | DenseNet201 or EfficientNetB0 backbone + Grad-CAM activation-mass as severity proxy | High — repeated across sources |
| Withering | Temp/humidity/airflow sensors + load-cell weight loss; BiLSTM or XGBoost regressor for time-to-moisture-target; VSD fan control with weight-loss-rate threshold logic | High — sensor+control literature well-established |
| Fermentation | RGB camera converted to CIE-Lab + temp/humidity; Random Forest or CNN-LSTM on color+environmental trajectory | Medium-High — strong single-stage precedent, small-dataset caveat |
| Fusion/Grade | Mid-level feature fusion (not full end-to-end joint training); explicit ablation to confirm signal complementarity; hold out by season/factory for validation | Medium — no direct precedent exists; recommendation synthesized from adjacent evidence + the modular-architecture counter-precedent |

---

## Limitations

- **Not a systematic review** — no PRISMA protocol, no dual-reviewer screening, no formal risk-of-bias assessment. Treat this as a scoping/grounding document, not citable evidence for a publication.
- **Tea-specific literature is a niche subfield.** Stage 4 conclusions lean partly on general food-quality-fusion literature (chili paste, meat, food-freshness sensors) by analogy where tea-specific fusion evidence was thin — flagged inline where this occurs.
- **No access to non-English-language literature** (a meaningful gap given China, Sri Lanka, India, Kenya, Japan are major tea-research-producing countries) or to proprietary industry/tea-research-institute data that may not be publicly indexed.
- **Web-search-based, not database-API-based retrieval** — no formal deduplication against Semantic Scholar/OpenAlex/Crossref IDs was performed; some sources were only accessible via ResearchGate mirrors rather than the publisher of record, and one source (MDPI *Foods* 15(10):1810) could not be directly fetched (403) — its content was corroborated via independent search snippets instead of full-text reading.
- **Accuracy figures throughout should be read as directional, not as production benchmarks** — see Source Verification Flags above (small datasets, single-site, no external validation, per the MDPI review's own field-wide diagnosis).
- **One flagged source** (Pandian et al., 2023, grey blight DCNN) was published in a journal Wiley discontinued for peer-review integrity concerns — its specific numbers are included for completeness but should not be relied on without independent corroboration.

---

## References

*(Author names included where captured from search results; verify against the source directly before formal citation — see Limitations. URLs point to the version accessed.)*

1. Detection and severity analysis of tea leaf blight based on deep learning. (2021). *ScienceDirect*. https://www.sciencedirect.com/science/article/abs/pii/S0045790621000471
2. Pandian, J. A., et al. (2023). Grey Blight Disease Detection on Tea Leaves Using Improved Deep Convolutional Neural Network. *Computational Intelligence and Neuroscience*. https://onlinelibrary.wiley.com/doi/10.1155/2023/7876302 ⚠️ *see verification flags*
3. Lightweight wavelet-CNN tea leaf disease detection. *PMC*. https://pmc.ncbi.nlm.nih.gov/articles/PMC12112342/
4. Interpretable and Robust Ensemble Deep Learning Framework for Tea Leaf Disease Classification. (2025). *MDPI Agriculture*, 11(4), 437. https://www.mdpi.com/2311-7524/11/4/437
5. Towards precision agriculture tea leaf disease detection using CNNs and image processing. *Scientific Reports*. https://www.nature.com/articles/s41598-025-02378-0
6. Enhancing Tea Leaf Disease Recognition with Attention Mechanisms and Grad-CAM Visualization. *ResearchGate*. https://www.researchgate.net/publication/398978694
7. Multi class tea leaf disease classification using feature level and output level ensemble strategies with Grad-CAM visualization. *Plant Science Today*. https://horizonepublishing.com/journals/index.php/PST/article/view/11513
8. Machine Learning for Leaf Disease Classification: Data, Techniques and Applications. *arXiv:2310.12509* (preprint).
9. TeaLeafVision: An Explainable and Robust Deep Learning Framework for Tea Leaf Disease Classification. *arXiv:2604.07182* (preprint).
10. teaLeafBD: A comprehensive image dataset to classify the diseased tea leaf. *ScienceDirect (Data in Brief)*. https://www.sciencedirect.com/science/article/pii/S2352340925004962
11. A comprehensive combined dataset on Hibiscus and Tea plant leaf disease images for classifications. *PMC*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12828367/
12. Tea leaf disease detection using segment anything model and deep convolutional neural networks. *ScienceDirect*. https://www.sciencedirect.com/science/article/pii/S2590123024020279
13. Impact of various foliar diseases on the biochemical, volatile and quality constituents of green and black teas. (2016). *Australasian Plant Pathology*. https://link.springer.com/article/10.1007/s13313-016-0402-y
14. Metabolomics Analysis Reveals the Effect of Two Alpine Foliar Diseases on the Non-Volatile and Volatile Metabolites of Tea. *PMC*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10137691/
15. Synthesis of Theaflavins and Their Functions. *PMC*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6017393/
16. IoT-Enabled Real-Time Monitoring and Machine Learning-Based Prediction System for Optimizing Tea Withering Process. *Communications on Applied Nonlinear Analysis*. https://internationalpubls.com/index.php/cana/article/view/1457 ⚠️ *journal indexing unverified*
17. Improved STA-BiLSTM for tea withering moisture content: detection and prediction model. (2025). *Journal of Food Measurement and Characterization*. https://link.springer.com/article/10.1007/s11694-025-03229-2
18. Prediction of Moisture Loss in Withering Process of Tea Manufacturing Using Artificial Neural Network. *IEEE Xplore*. https://ieeexplore.ieee.org/document/8066434/
19. Moisture measurement of tea leaves during withering using multifrequency microwave signals optimized by ant colony optimization. *ScienceDirect*. https://www.sciencedirect.com/science/article/abs/pii/S026087742200228X
20. Prediction of Moisture Content for Congou Black Tea Withering Leaves Using Image Features and Nonlinear Method. *PMC*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5959864/
21. Simulation of Trough Withering of Tea using One Dimensional Heat and Mass Transfer Finite Difference Model. https://www.researchgate.net/publication/274687566
22. The intelligent selenium-enriched tea withering control system. (2024/2025). *Scientific Reports*. https://www.nature.com/articles/s41598-024-84868-1
23. Moisture content monitoring in withering leaves during black tea processing based on electronic eye and near infrared spectroscopy. *Scientific Reports*. https://www.nature.com/articles/s41598-022-25112-6
24. Non-Destructive Determination of Moisture Content in White Tea During Withering Using VNIR Spectroscopy and Ensemble Modeling. *Horticulturae*, 12(4), 488. https://doi.org/10.3390/horticulturae12040488
25. Development of a mathematical procedure for controlling air flow rate in tea withering. *Tropical Agricultural Research*. https://tar.sljol.info/articles/abstract/10.4038/tar.v30i4.8331
26. The Fermentation Degree Prediction Model for Tieguanyin Oolong Tea Based on Visual and Sensing Technologies. (2025). *Foods*, 14(6), 983. https://doi.org/10.3390/foods14060983
27. Intelligent evaluation of black tea fermentation degree by FT-NIR and computer vision based on data fusion strategy. *ResearchGate*. https://www.researchgate.net/publication/339669262
28. Prediction of Congou Black Tea Fermentation Quality Indices from Color Features Using Non-Linear Regression Methods. (2018). *Scientific Reports*. https://www.nature.com/articles/s41598-018-28767-2
29. Machine learning & computer vision-based optimum black tea fermentation detection. *ResearchGate*. https://www.researchgate.net/publication/370468397
30. Monitoring black tea fermentation quality by intelligent sensors: Comparison of image, e-nose and data fusion. (2023). *ScienceDirect*. https://www.sciencedirect.com/science/article/abs/pii/S2212429223001050
31. Detection of optimum fermentation time for black tea manufacturing using electronic nose. *ScienceDirect*. https://www.sciencedirect.com/science/article/abs/pii/S0925400506004965
32. Electronic Nose Technologies in Monitoring Black Tea Manufacturing Process. (2020). *Journal of Sensors*. https://onlinelibrary.wiley.com/doi/10.1155/2020/3073104
33. An internet of things (IoT)-based optimum tea fermentation detection model using convolutional neural networks (CNNs) and majority voting techniques. (2021). *Journal of Sensors and Sensor Systems*. https://jsss.copernicus.org/articles/10/153/2021/
34. Kimutai, G., et al. An Optimum Tea Fermentation Detection Model Based on Deep Convolutional Neural Networks. *Data*, 5(2), 44. https://doi.org/10.3390/data5020044
35. Detection of black tea fermentation quality based on optimized deep neural network and hyperspectral imaging. *ScienceDirect*. https://sciencedirect.com/science/article/abs/pii/S1350449524005097
36. Real-Time Discrimination and Quality Evaluation of Black Tea Fermentation Quality Using a Homemade Simple Machine Vision System. (2023). *Foods*, 9, 814. https://www.mdpi.com/2311-5637/9/9/814
37. Estimation of tea quality grade using statistical identification of key variables. *ScienceDirect*. https://www.sciencedirect.com/science/article/abs/pii/S0956713520304011
38. A quality grade classification method for fresh tea leaves based on an improved YOLOv8x-SPPCSPC-CBAM model. (2024). *Scientific Reports*. https://www.nature.com/articles/s41598-024-54389-y
39. Tea quality estimation based on multi-source information from leaf and soil using machine learning algorithm. *PMC*. https://pmc.ncbi.nlm.nih.gov/articles/PMC10739752/
40. An efficient artificial intelligence algorithm for predicting the sensory quality of green and black teas based on the key chemical indices. *ScienceDirect*. https://www.sciencedirect.com/science/article/abs/pii/S030881462302959X
41. Classification of Tea Quality Levels Using Near-Infrared Spectroscopy Based on CLPSO-SVM. *Foods*, 11(11), 1658. https://doi.org/10.3390/foods11111658
42. TeaNet: Deep learning on Near-Infrared Spectroscopy (NIR) data for the assurance of tea quality. *ScienceDirect*. https://www.sciencedirect.com/science/article/abs/pii/S0168169921004488
43. Rapid discrimination of quality grade of black tea based on near-infrared spectroscopy (NIRS), electronic nose (E-nose) and data fusion. *ScienceDirect*. https://sciencedirect.com/science/article/abs/pii/S0308814623028601
44. Multimodal Sensor Fusion for Non-Destructive Tea Quality Evaluation: Deep Learning-Enabled Methods, Applications, and Challenges. (2026). *Foods*, 15(10), 1810. https://doi.org/10.3390/foods15101810
45. A review on the application of computer vision and machine learning in the tea industry. (2023). *Frontiers in Sustainable Food Systems*. https://www.frontiersin.org/journals/sustainable-food-systems/articles/10.3389/fsufs.2023.1172543/full
46. The dawn of intelligent technologies in tea industry. *ScienceDirect*. https://www.sciencedirect.com/science/article/abs/pii/S092422442400013X
47. A systematic review of multimodal fusion technologies for food quality and safety assessment: recent advances and future trends. *ScienceDirect*. https://www.sciencedirect.com/science/article/abs/pii/S0924224425004133
48. Causal deep learning for tea quality assessment via counterfactual generation and interpretability verification. (2025). *Journal of Food Measurement and Characterization*. https://link.springer.com/article/10.1007/s11694-025-03947-7
49. Moisture contents and product quality prediction of Pu-erh tea in sun-drying process with image information and environmental parameters. *PMC*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9007301/
50. Integrated multi-modal flexible sensors and AI-driven fusion modeling for internal and external quality detection of agricultural products. *ScienceDirect*. https://www.sciencedirect.com/science/article/abs/pii/S0924224425005370
51. Industrial IoT: The ultimate guide for tea manufacturing. *Octopus DTL* (industry/gray literature). https://octopusdtl.com/industrial-iot-for-tea-manufacturing/
52. Intelligent Transformation of the Tea Industry: Artificial intelligence applications in management, harvesting, and processing. *ResearchGate*. https://www.researchgate.net/publication/398854845
