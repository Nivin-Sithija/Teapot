# Stage 2: Withering Optimization

**Part of:** [End-to-End Tea Quality & Process Optimization System](tea-quality-pipeline-literature-review.md)
**Status:** Research complete — ready for architecture decision
**Date:** 2026-08-13

---

## 1. Problem Definition & Objective

Predict time-to-optimal moisture (58–62% residual) during withering, and recommend airflow/fan adjustments that balance quality outcome against energy consumption. This stage has the best-established engineering literature of all four — both the sensing and the control-theory sides are mature, independent of the ML layer.

---

## 2. Inputs & Data Requirements

**Sensor stack (established in the literature, directly adoptable):**
| Sensor | Purpose | Placement | Notes |
|---|---|---|---|
| Temp/humidity sensor | Air condition monitoring | Trough inlet + outlet (both, per multiple sources) | DHT22 (cheap, ±0.5°C/±1.8% RH demonstrated, 2s min sampling interval) or SHT31 (premium, ±0.3°C/±2% RH, no sampling delay) |
| Load cell | Real-time moisture-loss weighing | Under withering trough/bed | Standard in customized trough designs |
| Airflow/anemometer | Air velocity monitoring | Air duct | Typical operating range 1.2 ± 0.3 m/s |
| (Optional) NIR spectrometer | Direct moisture content, higher accuracy | Above leaf bed | Higher cost, best accuracy (RMSEP 0.0204 vs. 0.0216 for e-eye) |
| (Optional) Microwave sensor (2–10 GHz) | Non-destructive moisture measurement | — | Ant-colony-optimized signal processing shown effective |
| (Optional) Capacitive/dielectric sensor | Low-cost moisture proxy | Portable device | Cost-effective alternative to NIR |
| (Optional) RGB camera | Color/texture-based moisture proxy | Above leaf bed | Backup/supplementary signal, PLS/SVM models |

**Recommended baseline hardware:** ESP32 + DHT22 or SHT31 (temp/humidity) + load cell + airflow sensor is sufficient to replicate the core published systems; NIR/microwave/hyperspectral are accuracy upgrades, not requirements, for a first version.

**Operating parameter ranges (from the literature, usable as your control-system bounds):** temperature 20–35°C, RH 40–90%, airflow ~1.2 ± 0.3 m/s, target residual moisture 58–62% (matches your stated spec).

---

## 3. State of the Art — Model & Control Architecture Comparison

### 3a. Moisture prediction models (benchmarked)

| Model | Sensing input | RMSE / R² | Source |
|---|---|---|---|
| STA-BiGRU-XGBoost | NIR spectroscopy | RMSE 0.0920, MAE 0.0772, R² 0.9806 | Peer-reviewed (white tea) |
| STA-BiLSTM-XGBoost | Dielectric constant device | RMSE 0.022, R² 0.967 | Peer-reviewed (industrial withering) |
| PRXBoost (PLSR+Ridge+XGBoost ensemble) | VNIR spectroscopy | R² 0.854, RMSE 0.080 | Peer-reviewed |
| Image classification confidence model | RGB image only | Rp 0.9983, RMSEP 0.006278, RPD 39.25 | PMC — surprisingly strong for vision-only |
| E-eye vs. NIRS (single-sensor comparison) | Electronic eye vs. NIR | RMSEP 0.0216 (e-eye) vs. 0.0204 (NIRS) | Nature Sci Reports — NIRS marginally better, e-eye much cheaper |
| XGBoost/LightGBM + IoT (ThingSpeak) | Temp/humidity IoT | Not numerically captured | ⚠️ journal indexing unverified |
| 1D heat/mass-transfer finite-difference | Physics-based, no ML | — | Classical baseline, deterministic |

**Read:** NIR-based models cluster around R² 0.85–0.98 depending on architecture sophistication; pure RGB-image-based models can be surprisingly competitive (Rp 0.998) at far lower hardware cost, making a vision-first approach a reasonable starting point before investing in spectroscopy hardware.

### 3b. Fan/airflow control architecture

| Approach | Mechanism | Source |
|---|---|---|
| PID control via VSD (variable speed drive) | Classical control, feedback from temp/humidity/weight sensors to hit setpoint | Established industrial standard |
| ML-optimized PID | RL model tunes PID coefficients (P/I/D) dynamically based on performance data, setpoint, and a loss function (fan speed, temp overshoot, fan acceleration terms) | Hybrid approach — not tea-specific but directly transferable pattern |
| Threshold/heuristic control | "Fan off when not required, auto-on if weight-loss rate falls below target" | Simple, already proven in tea withering control systems |
| Mathematical mass-flow model | Fan speed set via thermodynamic calculation of required air mass flow given real-time moisture | Deterministic, interpretable, good baseline/safety layer |
| Air-source heat pump + auto control | Higher energy efficiency, integrated with temp/humidity sensors | Increasingly standard in industrial withering |

**Recommendation:** Don't reach for pure end-to-end RL control on day one. The literature converges on a **PID/VSD control loop as the actuation layer**, with your ML moisture-prediction model supplying the setpoint/target trajectory the PID loop tracks — this matches the "ML-optimized PID" hybrid pattern found in the general HVAC-control literature and is far more robust/interpretable for a factory environment than a from-scratch RL controller.

---

## 4. Recommended Approach for This Project

1. **Sensing:** Temp/humidity (inlet+outlet) + load cell + airflow sensor as the mandatory baseline; add an RGB camera as a cheap accuracy-boosting supplementary signal before considering NIR/microwave/hyperspectral upgrades.
2. **Moisture/endpoint prediction model:** BiLSTM or BiGRU with attention (STA-BiLSTM/BiGRU pattern), optionally boosted with XGBoost on engineered features — this architecture appears repeatedly with the best benchmarked results (R² > 0.96) and is well within reach of a small dedicated team.
3. **Control layer:** Physics-based mass-flow model as a baseline/safety bound; PID/VSD fan control tracking the ML-predicted target trajectory; heuristic on/off logic as a simple energy-saving overlay (fan off below a weight-loss-rate threshold).
4. **Energy/quality tradeoff:** Frame explicitly as a multi-objective decision — the mass-flow model gives you the *minimum* airflow needed for quality, and the ML model tells you *how much time* that buys you; energy savings come from not over-driving fans beyond what the moisture trajectory requires.

---

## 5. Evaluation Metrics & Validation Strategy

- **Moisture prediction:** RMSE/MAE/R² against ground-truth moisture (oven-drying method or validated NIR reference) — target R² > 0.95 given precedent, but validate per-cultivar/per-season since all benchmarked studies are single-site.
- **Endpoint prediction:** time-to-target-moisture prediction error (minutes), evaluated against actual batch completion times.
- **Energy:** specific energy consumption (kWh per kg moisture removed) compared against a non-optimized baseline (fixed fan speed/schedule) — this is the metric that justifies the "energy waste reduction" goal and isn't directly benchmarked in any source found; you'll need your own before/after comparison.
- **Control stability:** overshoot/oscillation of the PID loop under the ML-predicted setpoint — standard control-systems validation, not covered in the tea-specific literature, treat as a general control-engineering task.

---

## 6. Risks & Open Questions

| Risk | Severity | Mitigation |
|---|---|---|
| All benchmarked accuracy figures (R² 0.85–0.98) are single-site/single-season | Medium | Validate on your own trough hardware before trusting published R² as a target |
| Energy-savings claims in the literature are qualitative ("intelligent monitoring saves considerable energy") not quantified with kWh figures | Medium | Plan a dedicated energy-baseline measurement phase — this number doesn't exist yet in the literature for you to cite |
| NIR/microwave/hyperspectral upgrade path is tempting given better RMSE, but adds real hardware cost | Low | Start temp/humidity+camera only; treat spectroscopy as a v2 upgrade gated on whether v1 accuracy is insufficient |
| CANA-journal IoT/ML source (XGBoost/LightGBM+ThingSpeak) has unverified indexing | Low | Don't rely on it as sole justification for an architecture choice; corroborated by better-verified STA-BiLSTM/BiGRU papers |

---

## 7. Phased Build Plan

1. **MVP:** Temp/humidity (in/out) + load cell + airflow sensor → simple regression (XGBoost or LSTM) for time-to-target-moisture; PID/VSD fan control with fixed setpoint tracking; heuristic on/off energy-saving overlay.
2. **V2:** Add attention-based BiLSTM/BiGRU model for improved prediction accuracy; add RGB camera as supplementary signal; instrument specific-energy-consumption tracking against a baseline batch to quantify actual savings.
3. **V3:** Evaluate NIR or capacitive/dielectric sensor upgrade if v1/v2 accuracy proves insufficient for your quality tolerance; feed final withering trajectory summary (encoded, see Stage 4 doc) into cross-stage fusion.

---

## 8. References

1. Improved STA-BiLSTM for tea withering moisture content: detection and prediction model. (2025). *Journal of Food Measurement and Characterization*. https://link.springer.com/article/10.1007/s11694-025-03229-2
2. Deep learning model for real time moisture content detection and prediction in white tea withering using near infrared spectroscopy (STA-BiGRU-XGBoost). *Scientific Reports*. https://www.nature.com/articles/s41598-026-57739-0
3. Non-Destructive Determination of Moisture Content in White Tea During Withering Using VNIR Spectroscopy and Ensemble Modeling (PRXBoost). *Horticulturae*, 12(4), 488. https://doi.org/10.3390/horticulturae12040488
4. Moisture content monitoring in withering leaves during black tea processing based on electronic eye and near infrared spectroscopy. *Scientific Reports*. https://www.nature.com/articles/s41598-022-25112-6
5. Predicting the Degree of Fresh Tea Leaves Withering Using Image Classification Confidence. *PMC*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11989217/
6. Prediction of Moisture Content for Congou Black Tea Withering Leaves Using Image Features and Nonlinear Method. *PMC*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5959864/
7. Moisture measurement of tea leaves during withering using multifrequency microwave signals optimized by ant colony optimization. *ScienceDirect*. https://www.sciencedirect.com/science/article/abs/pii/S026087742200228X
8. Simulation of Trough Withering of Tea using One Dimensional Heat and Mass Transfer Finite Difference Model. https://www.researchgate.net/publication/274687566
9. Development of a mathematical procedure for controlling air flow rate in tea withering. *Tropical Agricultural Research*. https://tar.sljol.info/articles/abstract/10.4038/tar.v30i4.8331
10. The intelligent selenium-enriched tea withering control system. *Scientific Reports*. https://www.nature.com/articles/s41598-024-84868-1
11. IoT-Enabled Real-Time Monitoring and Machine Learning-Based Prediction System for Optimizing Tea Withering Process. *Communications on Applied Nonlinear Analysis*. ⚠️ journal indexing unverified. https://internationalpubls.com/index.php/cana/article/view/1457
12. E5-H PID control universal variable speed drive (VSD). https://www.automation.com/article/e5-h-pid-control-universal-variable-speed-drive-vs
13. AN3530 PID Fan Speed Control for 4-Wire Fans. *Microchip Application Note*. https://ww1.microchip.com/downloads/en/Appnotes/PID-Fan-Speed-Control-for-4-Wire-Fans-00003530A.pdf
14. Machine-learning-optimized PID fan control patent filings (generating fan control signal for computing device). USPTO. https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11907032
15. SHT31 vs DHT22 vs BME280: Best Humidity Sensor comparison. https://zbotic.in/sht31-vs-dht22-vs-bme280-best-humidity-sensor-for-your-project/
16. Design and Implementation of an IoT-Based Temperature and Humidity Monitoring System using ESP32. *ResearchGate*. https://www.researchgate.net/publication/401368513
