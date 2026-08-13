'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Database,
  ExternalLink,
  FileText,
  Lock,
  MessageSquarePlus,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import type { Dataset, Paper, ResearchEdge } from '@/lib/types';
import { safeUrl } from '@/lib/safeUrl';
import { useNotes } from '@/lib/useNotes';
import { TierChip, Tag } from './chips';

/* ────────────────────────────── types ────────────────────────────────────── */

type GraphItem = { kind: 'paper'; data: Paper } | { kind: 'dataset'; data: Dataset };

interface GraphNode {
  id: string;
  item: GraphItem;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Colour accent based on modality */
  accent: string;
}

interface GraphEdge {
  source: string;
  target: string;
  /** Why connected */
  reason: string;
}

/* ──────────────────────── modality colour map ────────────────────────────── */

const MODALITY_COLORS: Record<string, string> = {
  rgb: '#4e7c3f',
  hyperspectral: '#7b5ea7',
  nir: '#3a7ca5',
  'e-nose': '#c6862f',
  'e-tongue': '#b05a3a',
  sensor: '#5a8a8a',
  uav: '#6fa04e',
  'lab-assay': '#8e5a2e',
  tabular: '#6b7280',
  multimodal: '#c0392b',
};

function modalityColor(modality?: string): string {
  return MODALITY_COLORS[modality ?? ''] ?? '#94a196';
}

/* ────────────────────────── graph building ───────────────────────────────── */

/**
 * Lays out nodes for papers + datasets and formats the already-computed
 * edges (from the `research_edges` table, or the local fallback in
 * `repository.ts`) for rendering. The connection logic itself lives once in
 * `computeEdges` (src/lib/data/edges.ts) — this component just draws it.
 */
function buildGraph(
  papers: Paper[],
  datasets: Dataset[],
  rawEdges: ResearchEdge[],
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const items: GraphItem[] = [
    ...papers.map((p): GraphItem => ({ kind: 'paper', data: p })),
    ...datasets.map((d): GraphItem => ({ kind: 'dataset', data: d })),
  ];

  const nodes: GraphNode[] = items.map((item, i) => {
    const angle = (i / items.length) * Math.PI * 2;
    const radius = Math.min(items.length * 18, 160);
    return {
      id: `${item.kind}:${item.data.id}`,
      item,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      accent: modalityColor(item.data.modality),
    };
  });

  const edges: GraphEdge[] = rawEdges.map((e) => ({
    source: `${e.sourceKind}:${e.sourceId}`,
    target: `${e.targetKind}:${e.targetId}`,
    reason: e.reason,
  }));

  return { nodes, edges };
}

/* ──────────────────────── force simulation ───────────────────────────────── */

function simulate(nodes: GraphNode[], edges: GraphEdge[], iterations = 80) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;
    const repulsion = 3200 * alpha;
    const attraction = 0.008 * alpha;
    const centerPull = 0.002 * alpha;

    // Repulsion between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        a.vx += dx;
        a.vy += dy;
        b.vx -= dx;
        b.vy -= dy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const a = nodeMap.get(edge.source);
      const b = nodeMap.get(edge.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const force = attraction;
      a.vx += dx * force;
      a.vy += dy * force;
      b.vx -= dx * force;
      b.vy -= dy * force;
    }

    // Center gravity
    for (const n of nodes) {
      n.vx -= n.x * centerPull;
      n.vy -= n.y * centerPull;
    }

    // Apply velocity with damping
    for (const n of nodes) {
      n.vx *= 0.6;
      n.vy *= 0.6;
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  return nodes;
}

/* ──────────────────────── Item detail panel ──────────────────────────────── */

function ItemDetail({
  item,
  onClose,
}: {
  item: GraphItem;
  onClose: () => void;
}) {
  const id = item.data.id;
  const { notes, addNote, deleteNote, syncNotes } = useNotes(id);
  const [noteText, setNoteText] = useState('');

  // Re-sync notes when the inspected item changes
  useEffect(() => {
    syncNotes(id);
  }, [id, syncNotes]);

  const handleAddNote = () => {
    if (noteText.trim()) {
      addNote(noteText);
      setNoteText('');
    }
  };

  const paper = item.kind === 'paper' ? item.data : null;
  const dataset = item.kind === 'dataset' ? item.data : null;

  const meta = paper ? [paper.authors, paper.venue, paper.year].filter(Boolean).join(' · ') : '';

  const datasetRows = dataset
    ? ([
        ['Size', dataset.size],
        ['Categories', dataset.categories],
        ['Region', dataset.region],
        ['License', dataset.license],
        ['Modality', dataset.modality],
      ].filter(([, v]) => Boolean(v)) as [string, string][])
    : [];

  const sourceUrl = safeUrl(paper?.url ?? dataset?.url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="scroll-thin h-full overflow-y-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
    >
      <div className="mb-2 flex items-start gap-2">
        {paper ? (
          <FileText size={16} className="mt-0.5 shrink-0 text-[var(--color-amber)]" aria-hidden />
        ) : dataset?.restricted ? (
          <Lock size={16} className="mt-0.5 shrink-0 text-[var(--color-faint)]" aria-hidden />
        ) : (
          <Database size={16} className="mt-0.5 shrink-0 text-[var(--color-mature)]" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          {paper && (
            <div className="mb-1 flex items-center gap-2">
              <TierChip tier={paper.tier} />
              {paper.metric && (
                <span className="rounded-md bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[11px] text-[var(--color-ink-2)]">
                  {paper.metric}
                </span>
              )}
            </div>
          )}
          <h4 className="text-[14px] leading-snug font-semibold text-[var(--color-ink)]">
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--color-amber)]"
              >
                {paper?.title ?? dataset?.name}
              </a>
            ) : (
              (paper?.title ?? dataset?.name)
            )}
          </h4>
          {meta && <p className="mt-0.5 text-[12px] text-[var(--color-muted)]">{meta}</p>}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-lg p-1 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
        >
          <X size={14} />
        </button>
      </div>

      {paper?.finding && (
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-2)]">{paper.finding}</p>
      )}

      {paper && paper.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {paper.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}

      {dataset && datasetRows.length > 0 && (
        <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12.5px]">
          {datasetRows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-[var(--color-faint)]">{k}</dt>
              <dd className="text-[var(--color-ink-2)]">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {dataset?.notes && (
        <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--color-ink-2)]">{dataset.notes}</p>
      )}

      {dataset?.restricted && (
        <p className="mt-2 text-[11.5px] text-[var(--color-faint)]">
          Not openly downloadable — listed so you know it exists and who holds it.
        </p>
      )}

      {sourceUrl && (
        <div className="mt-2.5 flex gap-2">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--color-amber)] hover:underline"
          >
            <ExternalLink size={12} aria-hidden /> Source
          </a>
        </div>
      )}

      {/* Notes section */}
      <div className="mt-4 border-t border-[var(--color-line)] pt-3">
        <h5 className="eyebrow mb-2 flex items-center gap-1.5">
          <StickyNote size={12} aria-hidden />
          Notes
        </h5>

        {notes.length > 0 && (
          <ul className="mb-3 space-y-2">
            {notes.map((note, i) => (
              <li
                key={i}
                className="group flex items-start gap-2 rounded-lg bg-[var(--color-surface-2)] p-2.5 text-[12.5px] leading-relaxed text-[var(--color-ink-2)]"
              >
                <span className="min-w-0 flex-1">{note}</span>
                <button
                  onClick={() => deleteNote(i)}
                  title="Delete note"
                  className="shrink-0 rounded p-0.5 text-[var(--color-faint)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--color-gap)]"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddNote();
              }
            }}
            placeholder="Add a note…"
            rows={2}
            className="min-h-[2.5rem] flex-1 resize-none rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[12.5px] text-[var(--color-ink)] placeholder:text-[var(--color-faint)] focus:border-[var(--color-amber)] focus:outline-none"
          />
          <button
            onClick={handleAddNote}
            disabled={!noteText.trim()}
            className="shrink-0 self-end rounded-lg bg-[var(--color-amber)] px-3 py-2 text-[12px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <MessageSquarePlus size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────── Main graph component ──────────────────────────── */

const NODE_W = 140;
const NODE_H = 48;

export function ResearchGraph({
  papers,
  datasets = [],
  edges: rawEdges,
}: {
  papers: Paper[];
  datasets?: Dataset[];
  edges: ResearchEdge[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<GraphItem | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Measure container
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: Math.max(width, 300), height: Math.max(height, 300) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build and simulate graph
  const { nodes, edges } = useMemo(() => {
    const g = buildGraph(papers, datasets, rawEdges);
    simulate(g.nodes, g.edges);
    return g;
  }, [papers, datasets, rawEdges]);

  // State for node positions (so dragging works)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    for (const n of nodes) {
      pos[n.id] = { x: n.x, y: n.y };
    }
    setPositions(pos);
  }, [nodes]);

  const cx = dimensions.width / 2;
  const cy = dimensions.height / 2;

  // Drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      const pos = positions[nodeId];
      if (!pos) return;
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return;
      setDragId(nodeId);
      setDragOffset({
        x: e.clientX - svgRect.left - cx - pos.x,
        y: e.clientY - svgRect.top - cy - pos.y,
      });
    },
    [positions, cx, cy],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragId) return;
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return;
      const newX = e.clientX - svgRect.left - cx - dragOffset.x;
      const newY = e.clientY - svgRect.top - cy - dragOffset.y;
      setPositions((prev) => ({
        ...prev,
        [dragId]: { x: newX, y: newY },
      }));
    },
    [dragId, dragOffset, cx, cy],
  );

  const handleMouseUp = useCallback(() => {
    setDragId(null);
  }, []);

  if (papers.length === 0 && datasets.length === 0) {
    return (
      <p className="px-3 py-8 text-center text-[13px] text-[var(--color-muted)]">
        No papers or datasets for this stage yet.
      </p>
    );
  }

  const graphHeight = Math.max(320, Math.min((papers.length + datasets.length) * 45, 500));

  return (
    <div className="animate-fade-up space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-[3px] border border-current" />
          Paper
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-[2px] border border-dashed border-current" />
          Dataset
        </span>
        <span className="font-medium text-[var(--color-ink-2)]">Modality:</span>
        {Object.entries(MODALITY_COLORS)
          .filter(([m]) => papers.some((p) => p.modality === m) || datasets.some((d) => d.modality === m))
          .map(([m, c]) => (
            <span key={m} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: c }} />
              {m}
            </span>
          ))}
        <span className="ml-2 text-[var(--color-faint)]">Lines = shared tags/modality</span>
      </div>

      {/* Graph + inspector: side-by-side 50/50 once a node is selected */}
      <div className={clsx('gap-3', selected ? 'flex flex-col lg:flex-row' : 'flex')}>
        {/* SVG Graph */}
        <div
          ref={containerRef}
          className={clsx(
            'relative overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]',
            selected ? 'lg:w-1/2' : 'w-full',
          )}
          style={{ height: graphHeight }}
        >
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Edges */}
            {edges.map((edge, i) => {
              const sp = positions[edge.source];
              const tp = positions[edge.target];
              if (!sp || !tp) return null;
              return (
                <line
                  key={i}
                  x1={cx + sp.x}
                  y1={cy + sp.y}
                  x2={cx + tp.x}
                  y2={cy + tp.y}
                  stroke="var(--color-line)"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  opacity={0.6}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const pos = positions[node.id];
              if (!pos) return null;
              const nx = cx + pos.x - NODE_W / 2;
              const ny = cy + pos.y - NODE_H / 2;
              const isSelected = selected
                ? `${selected.kind}:${selected.data.id}` === node.id
                : false;
              const isDataset = node.item.kind === 'dataset';
              const title = node.item.kind === 'paper' ? node.item.data.title : node.item.data.name;
              const truncTitle = title.length > 50 ? title.slice(0, 47) + '…' : title;

              return (
                <g
                  key={node.id}
                  transform={`translate(${nx}, ${ny})`}
                  style={{ cursor: dragId === node.id ? 'grabbing' : 'pointer' }}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  onClick={() => {
                    if (!dragId) setSelected(isSelected ? null : node.item);
                  }}
                >
                  {/* Card background */}
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={isDataset ? 6 : 10}
                    ry={isDataset ? 6 : 10}
                    fill="var(--color-surface)"
                    stroke={isSelected ? node.accent : 'var(--color-line)'}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeDasharray={isDataset ? '4 2' : undefined}
                    className="transition-colors"
                  />
                  {/* Modality colour bar */}
                  <rect x={0} y={0} width={4} height={NODE_H} rx={2} fill={node.accent} />
                  {/* Title */}
                  <text
                    x={12}
                    y={18}
                    fontSize={10}
                    fontWeight={600}
                    fill="var(--color-ink)"
                    className="pointer-events-none"
                  >
                    {truncTitle.slice(0, 22)}
                  </text>
                  <text
                    x={12}
                    y={30}
                    fontSize={9.5}
                    fill="var(--color-muted)"
                    className="pointer-events-none"
                  >
                    {truncTitle.length > 22 ? truncTitle.slice(22, 48) : ''}
                  </text>
                  {/* Modality / kind badge */}
                  <text
                    x={12}
                    y={43}
                    fontSize={8}
                    fill={node.accent}
                    fontWeight={600}
                    className="pointer-events-none uppercase"
                  >
                    {node.item.data.modality ?? (isDataset ? 'dataset' : '')}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected item detail — right half when inspecting a node */}
        <AnimatePresence mode="wait">
          {selected && (
            <div className="min-w-0 lg:w-1/2" style={{ height: graphHeight }}>
              <ItemDetail
                key={`${selected.kind}:${selected.data.id}`}
                item={selected}
                onClose={() => setSelected(null)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
