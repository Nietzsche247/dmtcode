export const OBSERVATION_PACK_KITS = ['protocol', 'solo', 'dual', 'triad', 'circle'] as const;

export function observationPackPath(kit: string | null): string {
  const variant = OBSERVATION_PACK_KITS.some(value => value === kit) ? kit : 'generic';
  return `/downloads/observation-pack/DMT_Code_Observation_Pack_${variant}.pdf`;
}