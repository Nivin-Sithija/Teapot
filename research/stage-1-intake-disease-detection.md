# Stage 1: Intake QA — Disease Detection & Severity Scoring

**Part of:** [End-to-End Tea Quality & Process Optimization System](tea-quality-pipeline-literature-review.md)
**Status:** Research complete — ready for architecture decision
**Date:** 2026-08-13

---

## 1. Problem Definition & Objective

Score freshly plucked leaf for disease severity (blister blight, grey blight, and other foliar diseases) before withering begins, producing a batch-level severity score that grounds downstream quality prediction in known biochemical decline (theaflavin/thearubigin loss). This is **not** a simple healthy/diseased classifier — the deliverable is a continuous or ordinal severity measure that can be carried forward as a feature into Stage 4 fusion.

---

## 2. Inputs & Data Requirements

**Sensing modality:** RGB imaging (leaf-level or batch-tray level). No source in this review used hyperspectral or NIR for disease detection specifically — that technology is used elsewhere in the pipeline (withering, grading) but disease-CV work is uniformly RGB-camera-based, which keeps intake hardware cheap.

**Datasets available (public):**
| Dataset | Size | Categories | Region |
|---|---|---|---|
| teaLeafBD | ~4,000 images | 7 (incl. blister blight, grey blight) | Sylhet, Bangladesh |
| Kaggle Tea_Leaf_Disease | Not specified | 6 (Algal Spot, Brown Blight, Gray Blight, Healthy, Helopeltis, Red Spot) | — |
| Combined Hibiscus+Tea leaf dataset | Not specified | Multi-crop | — |
| PlantVillage (cross-crop transfer) | Large (general) | 4-stage severity annotated for apple black rot — precedent for severity labeling scheme | — |

**Gap:** No public dataset is severity-labeled for tea specifically. You will need either (a) botanist-annotated severity stages (following the PlantVillage 4-stage precedent), or (b) a segmentation-based proxy that avoids manual severity labeling entirely (see §4).

---

## 3. State of the Art — Architecture Comparison

### 3a. Disease classification (presence/type) — solved problem, pick any of these

| Architecture | Accuracy | Params/notes | Source |
|---|---|---|---|
| DenseNet201 | 99% (teaLeafBD) | Heavier model | Peer-reviewed |
| Modified EfficientNetB0 | 99.49% / 90.73% (2 datasets) | Efficient | Peer-reviewed |
| Ensemble (ResNet18+VGG16+InceptionV3+MobileNetV2) + Grad-CAM | 98.3% (output-level fusion) | Heaviest, best interpretability track record | MDPI Agriculture 2025 |
| WaveLiteNet (wavelet-CNN) | Not captured, "outperforms lightweight baselines" | Lightweight | PMC |
| Improved DCNN (grey blight specific) | 98.99% | ⚠️ compromised-journal flag (see master review) | Flagged |

### 3b. Disease **severity** estimation — the actual gap you need to fill

This is the important finding from the deeper search: severity estimation is a distinct, smaller, well-defined sub-literature (mostly from other crops, directly transferable to tea):

| Approach | Method | Result | Source |
|---|---|---|---|
| VGG16 post-classification | Severity index from segmented spot area via U-Net | Applied specifically to tea leaf blight | Peer-reviewed |
| U-Net / SegNet / DeepLab semantic segmentation | Severity = diseased-pixel-count / total-leaf-pixel-count | 92% segmentation accuracy, 90% IoU (rice example) | Frontiers/PMC (cross-crop) |
| BLSNet (U-Net + attention + multi-scale) | Rice bacterial leaf streak severity | Improved lesion segmentation accuracy | Peer-reviewed |
| Attention-optimized DeepLabV3+ | Cucumber disease severity | Automatic estimation | PMC |
| YOLOv8 (severity classification variant) | Real-time severity classification | "Compelling balance of speed and reliability" | Peer-reviewed |
| PDSE-Lite | Convolutional Autoencoder + Few-Shot Learning | Lightweight, works with limited labeled severity data | Frontiers 2023 |

**The pattern across all of these:** severity = (segmented diseased-leaf-area) / (total-leaf-area), computed from a semantic segmentation mask, not predicted directly as a regression target from raw pixels. This is the standard approach and it sidesteps the need for large hand-labeled severity-stage datasets — you only need pixel-level (or even just bounding-box-level, with a simpler area proxy) disease annotations, which are cheaper to collect than expert severity grading.

**Recommended severity pipeline:** (1) train or fine-tune a segmentation model (U-Net or DeepLabV3+, given precedent) to output a diseased-pixel mask per leaf/tray image; (2) compute severity ratio = diseased pixels / total leaf pixels; (3) aggregate to batch level (mean/weighted severity across all imaged leaves in the intake batch); (4) optionally calibrate the ratio against a small botanist-labeled validation set (following PlantVillage's 4-stage precedent) to convert the raw ratio into an interpretable stage label for operators, while keeping the continuous ratio as the feature passed to Stage 4.

### 3c. Edge/real-time deployment feasibility

Intake QA needs to run fast at a factory weighbridge/intake point, likely on local hardware rather than cloud (network reliability at rural tea estates is a real constraint, though not covered in the literature — treat as an implementation assumption to validate on-site).

| Platform | Model | Latency | Notes |
|---|---|---|---|
| Jetson Nano | Lightweight CNN | ~80 ms | Peer-reviewed benchmark |
| Raspberry Pi 4 | Lightweight CNN | ~120 ms (RTR_Lite_MobileNet: 78 ms) | Peer-reviewed |
| Raspberry Pi 4B | L-Net (~167K params, 56.9M FLOPs) | Real-time capable | Peer-reviewed |
| INT8-quantized MobileNetV3-Small | — | 6.1 ms/inference, 1.1 MB | Peer-reviewed |
| TFLite / ONNX export | MobileNet/EfficientNet family | — | Standard toolchain, confirmed used in multiple studies |

**Implication:** segmentation models (U-Net/DeepLabV3+) are heavier than classification-only CNNs — budget for either a Jetson-class edge device (not just Raspberry Pi) at the intake point, or batch-process images server-side within the batch-intake time window (minutes, not seconds, since this runs once per batch at intake, not continuously) — the latency requirement here is much looser than real-time fermentation monitoring (Stage 3), so server-side/quantized-edge inference are both viable.

---

## 4. Recommended Approach for This Project

1. **Classification backbone:** MobileNetV3 or EfficientNetB0 (transfer-learned from ImageNet or PlantVillage) for disease type identification — fast, well-precedented, edge-deployable.
2. **Severity layer:** U-Net or DeepLabV3+ segmentation head (can share the same backbone via multi-task setup, or run as a separate model) producing diseased-pixel-ratio per leaf image, aggregated to batch-level severity score.
3. **Interpretability:** Grad-CAM on the classification branch (validated in tea-specific literature to correctly highlight symptomatic regions) — dual-purpose as operator-facing explanation and as a cheap severity proxy (activation mass) if full segmentation labeling proves too costly initially.
4. **Labeling strategy:** Start with classification-level labels (cheap, existing datasets transfer directly); add segmentation/severity labels incrementally on a subset, prioritizing the disease types most correlated with theaflavin/thearubigin loss (blister blight, grey blight, brown blight per the biochemistry literature in the master review).

---

## 5. Evaluation Metrics & Validation Strategy

- **Classification:** accuracy, precision/recall/F1 per disease class (standard in the literature — expect 95%+ achievable given precedent).
- **Segmentation/severity:** IoU and pixel accuracy against botanist-annotated masks (92% IoU is the benchmark to beat, per cross-crop precedent).
- **Severity calibration:** correlation between predicted severity ratio and actual made-tea theaflavin/thearubigin content on a held-out validation batch set — this is the metric that actually matters for this project (does severity score predict quality decline), and it does not exist in any source found; **you will need to generate this validation data yourself** by pairing intake severity scores with lab biochemical assays on the same batches.
- **Deployment validation:** on-device latency test at actual intake volume (leaves/images per minute during peak plucking season).

---

## 6. Risks & Open Questions

| Risk | Severity | Mitigation |
|---|---|---|
| No tea-specific severity-labeled dataset exists | High | Build via segmentation-mask labeling (cheaper than stage-grading); start with a small expert-annotated seed set |
| Severity→quality-decline link is established at the *biochemistry* level (disease → TF/TR loss) but not yet validated at the *CV-severity-score* level (does your segmentation ratio actually predict TF/TR loss in *your* batches) | High | This is the single most important validation gap — plan for a dedicated calibration study early, not as an afterthought |
| Single-region/single-dataset training risks poor generalization to your specific estate's leaf variety, lighting, camera angle | Medium | Plan for on-site data collection and fine-tuning from day one; don't expect public-dataset accuracy to transfer directly |
| Compromised-journal source (Pandian et al. 2023 grey-blight DCNN, 98.99%) shouldn't be treated as a validated accuracy ceiling | Low-Medium | Already flagged; use as directional only |

---

## 7. Phased Build Plan

1. **MVP:** Classification-only (disease type + confidence), MobileNetV3/EfficientNetB0, transfer-learned from public tea datasets + on-site fine-tuning. Output: per-disease presence + basic Grad-CAM-based severity proxy.
2. **V2:** Add segmentation-based severity ratio (U-Net/DeepLabV3+), batch-level aggregation, operator-facing severity stage (calibrated to 4-ish stages per PlantVillage precedent).
3. **V3:** Closed-loop validation against lab TF/TR assays to confirm and recalibrate the severity→quality-decline relationship for your specific estate/cultivar; feed calibrated severity score into Stage 4 fusion.

---

## 8. References

*(Numbered independently per stage; overlapping sources with the master bibliography are noted.)*

1. Detection and severity analysis of tea leaf blight based on deep learning. *ScienceDirect*. https://www.sciencedirect.com/science/article/abs/pii/S0045790621000471
2. Pandian, J. A., et al. (2023). Grey Blight Disease Detection on Tea Leaves Using Improved Deep CNN. *Computational Intelligence and Neuroscience*. ⚠️ compromised-journal flag. https://onlinelibrary.wiley.com/doi/10.1155/2023/7876302
3. Interpretable and Robust Ensemble Deep Learning Framework for Tea Leaf Disease Classification. (2025). *MDPI Agriculture*, 11(4), 437. https://www.mdpi.com/2311-7524/11/4/437
4. teaLeafBD: A comprehensive image dataset. *ScienceDirect (Data in Brief)*. https://www.sciencedirect.com/science/article/pii/S2352340925004962
5. PDSE-Lite: lightweight framework for plant disease severity estimation based on Convolutional Autoencoder and Few-Shot Learning. (2023). *Frontiers in Plant Science*. https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2023.1319894/full
6. Apple leaf disease severity grading based on deep learning and the DRL-Watershed algorithm. *Scientific Reports*. https://www.nature.com/articles/s41598-025-15246-8
7. Recent advances in plant disease severity assessment using convolutional neural networks. *Scientific Reports* / PMC. https://www.nature.com/articles/s41598-023-29230-7
8. Deep Learning Models for Detection and Severity Assessment of Cercospora Leaf Spot in Chili Peppers Under Natural Conditions. *PMC*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12251717/
9. Attention-optimized DeepLab V3+ for automatic estimation of cucumber disease severity. *PMC*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9450308/
10. A Small Target Tea Leaf Disease Detection Model Combined with Transfer Learning. *MDPI Forests*, 15(4), 591. https://www.mdpi.com/1999-4907/15/4/591
11. Automatic Image-Based Plant Disease Severity Estimation Using Deep Learning. (2017). *Computational Intelligence and Neuroscience* / PMC. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5516765/
12. The Stress Detection and Segmentation Strategy in Tea Plant at Canopy Level. *PMC*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9298540/
13. RTR_Lite_MobileNetV2: A lightweight and efficient model for plant disease detection and classification. *ScienceDirect*. https://www.sciencedirect.com/science/article/pii/S2214662825000271
14. L-Net: a lightweight CNN framework for sustainable multicrop leaf disease detection and classification on edge devices. *RSC Sustainable Food Technology*. https://pubs.rsc.org/en/content/articlehtml/2026/fb/d5fb00191a
15. AI and IoT-powered edge device optimized for crop pest and disease detection. *Scientific Reports*. https://www.nature.com/articles/s41598-025-06452-5
16. Impact of various foliar diseases on the biochemical, volatile and quality constituents of green and black teas. (2016). *Australasian Plant Pathology*. https://link.springer.com/article/10.1007/s13313-016-0402-y (biochemistry grounding — see master review §Stage 1 for full context)
