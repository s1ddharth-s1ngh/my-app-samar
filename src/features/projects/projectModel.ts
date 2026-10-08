import type { ID, Project } from '@/data/types';

/**
 * Projects in display order. `order` can be sparse or tied — older rows were
 * written before the list renumbered itself — so creation time breaks ties.
 */
export function ordered(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

/**
 * Moving `id` by `delta` renumbers the list to 0..n-1: the rows whose `order`
 * actually changed, ready to be written. Out of range means nothing moves.
 */
export function reorder(projects: Project[], id: ID, delta: number): { id: ID; order: number }[] {
  const next = ordered(projects);
  const from = next.findIndex((project) => project.id === id);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= next.length) return [];

  const moved = next[from]!;
  next[from] = next[to]!;
  next[to] = moved;

  // ponytail: renumbers every row that drifted, not just the two swapped ones.
  // Projects are a handful; sparse orders would need a fractional index.
  return next.flatMap((project, index) =>
    project.order === index ? [] : [{ id: project.id, order: index }]
  );
}
