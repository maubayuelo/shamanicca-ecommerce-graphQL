type DatabaseIdNode = {
  databaseId?: number | string | null;
};

/** Return numeric WordPress database IDs for a set of rendered post nodes. */
export function visiblePostIds(nodes: readonly DatabaseIdNode[]): string[] {
  return [...new Set(
    nodes
      .map((node) => node.databaseId)
      .filter((id): id is number | string =>
        typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id)),
      )
      .map(String),
  )];
}
