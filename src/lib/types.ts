/**
 * Core domain types for the tea-pipeline research atlas.
 *
 * These types are the contract shared by three consumers:
 *   1. the local seed corpus (`src/lib/data/seed/*`)
 *   2. the Supabase tables (`supabase/migrations/0001_init.sql`)
 *   3. the 3D scene + UI components
 *
 * Keep them in sync with the SQL migration when adding fields.
 */

/** How well-served a research area is by existing published work. */
export type Maturity =
  | 'mature' // solved / heavily replicated in the literature
  | 'emerging' // real precedent exists but thin or single-site
  | 'open-gap'; // named as an unaddressed gap by review papers

/** Provenance confidence for a cited source. */
export type SourceTier =
  | 'peer-reviewed'
  | 'preprint'
  | 'gray' // industry / non-peer-reviewed
  | 'flagged'; // integrity or indexing concerns — see `caveat`

/** Sensing modality a paper or dataset relies on. */
export type Modality =
  | 'rgb'
  | 'hyperspectral'
  | 'nir'
  | 'e-nose'
  | 'e-tongue'
  | 'sensor'
  | 'uav'
  | 'lab-assay'
  | 'tabular'
  | 'multimodal';

/**
 * Depth of coverage in this repository. `core` stages have a dedicated
 * long-form research document in /research; `survey` stages are covered
 * by targeted literature search only.
 */
export type ResearchDepth = 'core' | 'survey';

export interface StageMetric {
  label: string;
  value: string;
}

export interface Stage {
  slug: string;
  /** 1-indexed position in the pipeline, matching the journey diagram. */
  index: number;
  name: string;
  /** Short line shown under the name in the UI and on the 3D label. */
  tagline: string;
  /** What physically happens to the leaf at this stage. */
  process: string;
  /** Where AI/ML plugs in, in one paragraph. */
  aiSummary: string;
  researchDepth: ResearchDepth;
  /** Relative path to the long-form doc in /research, if one exists. */
  researchDoc?: string;
  /** Base colour for the stage platform + UI accent. */
  color: string;
  /** Brighter accent used for highlights, labels and the active state. */
  accent: string;
  /** World-space position of the stage platform in the 3D scene. */
  position: [number, number, number];
  /** Headline numbers surfaced on the drawer. */
  metrics: StageMetric[];
  /** Operating parameters / physical constants worth knowing. */
  processParams?: StageMetric[];
}

export interface AIOpportunity {
  id: string;
  stageSlug: string;
  title: string;
  description: string;
  /** Concrete model families / methods, e.g. ['U-Net', 'DeepLabV3+']. */
  techniques: string[];
  maturity: Maturity;
  /** Why we believe this — pointer to the supporting evidence. */
  evidence?: string;
}

export interface Paper {
  id: string;
  stageSlug: string;
  title: string;
  authors?: string;
  year?: number;
  venue?: string;
  url: string;
  doi?: string;
  tier: SourceTier;
  /** The one-line takeaway that makes this paper worth opening. */
  finding?: string;
  /** Headline reported number, verbatim where possible. */
  metric?: string;
  modality?: Modality;
  tags: string[];
  /** Storage path inside the Supabase `research-pdfs` bucket. */
  pdfPath?: string;
  /** Integrity / interpretation warning shown inline in the UI. */
  caveat?: string;
}

export interface Dataset {
  id: string;
  stageSlug: string;
  name: string;
  size?: string;
  categories?: string;
  region?: string;
  url?: string;
  license?: string;
  modality?: Modality;
  notes?: string;
  /** True when the dataset is not publicly downloadable. */
  restricted?: boolean;
}

/**
 * A connection between two papers/datasets in the research graph — shared
 * tags or matching modality. Persisted in the `research_edges` table,
 * recomputed by `computeEdges` (src/lib/data/edges.ts) whenever the seed
 * corpus changes, and never crosses stage boundaries.
 */
export interface ResearchEdge {
  stageSlug: string;
  sourceKind: 'paper' | 'dataset';
  sourceId: string;
  targetKind: 'paper' | 'dataset';
  targetId: string;
  reason: string;
}

/** Everything the drawer needs for one stage, resolved in a single call. */
export interface StageDetail {
  stage: Stage;
  opportunities: AIOpportunity[];
  papers: Paper[];
  datasets: Dataset[];
  edges: ResearchEdge[];
}

/** Flattened row used by the global cmd-K search index. */
export interface SearchHit {
  kind: 'paper' | 'dataset' | 'opportunity' | 'stage';
  id: string;
  stageSlug: string;
  title: string;
  subtitle?: string;
  url?: string;
}
