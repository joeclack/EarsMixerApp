// Opaque console finishes, separate from the system materials used by controls.
const graphite = {
  surface: '#122029', edge: '#30434D', shadow: '#00000088',
  gradient: ['#0B151B', '#14242D'] as const,
  rim: '#536B75', slot: '#061014', indicator: '#48D8C4',
};
const silver = {
  surface: '#FFFFFF', edge: '#BCCCD5', shadow: '#24414E12',
  gradient: ['#FFFFFF', '#FAFCFD'] as const,
  rim: '#FFFFFF', slot: '#BBCBD0', indicator: '#007D71',
};
export const hardwarePalette = (dark: boolean) => dark ? graphite : silver;
