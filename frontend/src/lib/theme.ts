/**
 * SIM-01 / COM-01 / SCN-01 / PRO-01
 * Design tokens and theme definitions for Simeplify / EcoTwin.
 * Source of truth: docs/design.md
 * Style: Natural Organic. Warm, earthy, calm.
 */

export const colors = {
  // Core palette
  cream: '#faf6f1',
  paper: '#ffffff',
  brown: '#5c4033',
  'sage-400': '#8b9d77',
  'tan-400': '#d4a373',
  'stone-800': '#292524',
  'stone-600': '#57534e',
  'stone-400': '#a8a29e',
  'stone-300': '#d6d3d1',
  'stone-200': '#e7e5e4',
  'stone-100': '#f5f5f4',

  // Sage ramp (green, light -> dark)
  sage: {
    50: '#f1f4ee',
    100: '#e0e6d9',
    200: '#c5d0b9',
    300: '#a8b896',
    400: '#8b9d77',
    500: '#6f8260',
    600: '#566549',
  },

  // Tan ramp (warm, light -> dark)
  tan: {
    100: '#f6e8d8',
    300: '#e6c39b',
    400: '#d4a373',
    600: '#a97a4a',
  },

  // Stone ramp
  stone: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    600: '#57534e',
    800: '#292524',
  },

  // Status colors (earthy, never neon)
  status: {
    success: {
      bg: '#e0e6d9', // sage-100
      text: '#566549', // sage-600
      icon: '#566549',
    },
    warning: {
      bg: '#fffbeb', // amber-50
      text: '#92600e',
      icon: '#92600e',
    },
    error: {
      bg: '#fbece8',
      text: '#a8442f', // terracotta
      icon: '#a8442f',
    },
    info: {
      bg: '#f5f5f4', // stone-100
      text: '#57534e', // stone-600
      icon: '#57534e',
    },
  },

  // Bins
  bin: {
    paper: '#d4a373', // tan-400
    plastic: '#a8b896', // sage-300
    glassMetal: '#5c4033', // brown
    general: '#566549', // sage-600
  },

  // Utility data colors
  utility: {
    water: '#6f8260', // sage-500
    electricity: '#d4a373', // tan-400
  },

  // Floor plan room surface fills
  floorPlan: {
    livingRoom: '#E6C08E', // warm wood planks
    kitchen: '#EFEAD8', // cream tile
    bedroom: '#B6C4A6', // sage carpet
    bathroom: '#D6D3CD', // warm grey
    corridor: '#E6C08E', // wood
    walls: '#5c4033', // brown
  },
} as const;

export const typography = {
  fonts: {
    heading: 'Lora_600SemiBold',
    headingMedium: 'Lora_500Medium',
    headingRegular: 'Lora_400Regular',
    body: 'SourceSans3_400Regular',
    bodyMedium: 'SourceSans3_500Medium',
    bodySemiBold: 'SourceSans3_600SemiBold',
    bodyBold: 'SourceSans3_700Bold',
  },
  sizes: {
    hero: 40,
    h1: 28,
    h2: 22,
    h3: 18,
    body: 15,
    small: 13,
    xs: 12,
  },
  lineHeights: {
    hero: 48,
    h1: 34,
    h2: 28,
    h3: 24,
    body: 22.5, // 1.5 ratio
    small: 18,
    xs: 16,
  },
} as const;

export const radii = {
  card: 32, // rounded-[2rem]
  miniCard: 20, // rounded-[1.25rem]
  image: 24,
  button: 9999, // rounded-full
  input: 9999, // rounded-full
  badge: 9999, // rounded-full
  pill: 9999, // rounded-full
  blob: {
    borderTopLeftRadius: 48,
    borderTopRightRadius: 32,
    borderBottomRightRadius: 56,
    borderBottomLeftRadius: 36,
  },
} as const;

export const spacing = {
  screenHorizontal: 24, // px-6
  screenBottomScroll: 112, // pb-28
  sectionGap: 32, // gap-8
  cardPadding: 24, // p-6
  itemGap: 16, // gap-4
  smallGap: 8, // gap-2
  minTouchTarget: 48,
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  sm: {
    shadowColor: '#5c4033',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: '#5c4033',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
} as const;

export const motion = {
  duration: {
    fast: 300,
    normal: 500,
    slow: 700,
  },
  easing: 'ease-in-out',
} as const;
