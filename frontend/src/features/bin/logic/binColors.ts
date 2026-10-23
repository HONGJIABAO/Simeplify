export type BinVisualCategory = 'paper' | 'plastic' | 'glass' | 'general';

/** Malaysian sorting-bin palette used by the guide and scan-result cards. */
export const BIN_CATEGORY_COLORS = {
  paper: '#8BA4B5',
  plasticMetal: '#D89C76',
  glass: '#96745F',
  general: '#6B7F67',
} as const;

export const BIN_ICON_TEXT_COLOR = '#333333';

/** Resolve an AI result to the visual stream without changing persisted bin types. */
export function resolveBinVisualCategory(
  type: string,
  material = '',
  itemName = '',
): BinVisualCategory {
  if (type === 'paper') return 'paper';
  if (type === 'plastic') return 'plastic';
  if (type === 'metal' || type === 'plastic_metal') return 'plastic';
  if (type === 'glass') return 'glass';
  if (type === 'general') return 'general';

  const itemText = itemName.toLowerCase();
  const materialText = material.toLowerCase();
  const glassPattern = /\bglass\b/;
  const metalPattern = /\bmetal\b|alumin|\btin\b|\bcan\b|\bsteel\b/;

  if (glassPattern.test(itemText)) return 'glass';
  if (metalPattern.test(itemText)) return 'plastic';
  if (glassPattern.test(materialText)) return 'glass';
  if (metalPattern.test(materialText)) return 'plastic';
  return type === 'glass_metal' ? 'glass' : 'general';
}
