/**
 * Font configuration and mapping for Simeplify / EcoTwin.
 * Source of truth: docs/design.md Unit 3.
 * Fonts allowed: Lora (headings & numbers), Source Sans 3 (body).
 * No other fonts (Inter, Roboto, Geist, Fraunces are forbidden).
 */

export const fontNames = {
  // Headings & numbers
  headingSemiBold: 'Lora_600SemiBold',
  headingMedium: 'Lora_500Medium',
  headingRegular: 'Lora_400Regular',

  // Body
  bodyRegular: 'SourceSans3_400Regular',
  bodyMedium: 'SourceSans3_500Medium',
  bodySemiBold: 'SourceSans3_600SemiBold',
  bodyBold: 'SourceSans3_700Bold',
} as const;

export type FontName = keyof typeof fontNames;
