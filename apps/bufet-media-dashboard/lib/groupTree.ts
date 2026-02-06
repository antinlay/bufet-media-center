import type { ConcertoGroup, ConcertoScreen } from '@bufet/shared';

export type GroupNode = {
  group: ConcertoGroup;
  children: GroupNode[];
};

export function buildGroupTree(groups: ConcertoGroup[]): GroupNode[] {
  const idSet = new Set(groups.map((group) => group.id));
  const byParent = new Map<number | null, ConcertoGroup[]>();
  groups.forEach((group) => {
    const key = group.parentId && idSet.has(group.parentId) ? group.parentId : null;
    const list = byParent.get(key) ?? [];
    list.push(group);
    byParent.set(key, list);
  });

  const build = (parentId: number | null): GroupNode[] => {
    const nodes = (byParent.get(parentId) ?? []).sort((a, b) => a.name.localeCompare(b.name));
    return nodes.map((group) => ({
      group,
      children: build(group.id),
    }));
  };

  return build(null);
}

export function flattenGroupTree(nodes: GroupNode[], depth = 0): Array<{ group: ConcertoGroup; depth: number }> {
  return nodes.flatMap((node) => [
    { group: node.group, depth },
    ...flattenGroupTree(node.children, depth + 1),
  ]);
}

export function groupScreensByGroupId(screens: ConcertoScreen[]) {
  return screens.reduce((acc, screen) => {
    const list = acc.get(screen.groupId) ?? [];
    list.push(screen);
    acc.set(screen.groupId, list);
    return acc;
  }, new Map<number, ConcertoScreen[]>());
}
