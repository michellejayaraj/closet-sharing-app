// ─── Clueless Closet — Design Tokens ────────────────────────────────────────
// Single source of truth for colors, spacing, typography, and radii.
// Import what you need: import { colors, spacing } from '../lib/theme'

export const colors = {
  background:  '#F7F7F5', // calm gray-white
  surface:     '#FFFFFF', // cards, modals
  surfaceSoft: '#F1F1EE', // placeholder tiles, subtle fills
  text:        '#171717', // primary headings and body
  muted:       '#777777', // subtitles, labels
  border:      '#E3E3DF', // dividers and input borders

  pop:     '#E85D75', // raspberry pink — CTA buttons, active states
  popSoft: '#F8C8D2', // soft pink accents
  popPale: '#FDECEF', // pale pink washes

  luxury: '#111111', // editorial black
}

// Base-8 scale (in points/px)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
}

// Use these fontSize/fontWeight pairs directly in StyleSheet.create
export const typography = {
  appName:        { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  screenTitle:    { fontSize: 22, fontWeight: '600', letterSpacing: -0.3 },
  sectionHeading: { fontSize: 17, fontWeight: '600' },
  cardLabel:      { fontSize: 13, fontWeight: '500' },
  body:           { fontSize: 14, fontWeight: '400' },
  caption:        { fontSize: 11, fontWeight: '400' },
  buttonLabel:    { fontSize: 14, fontWeight: '500', letterSpacing: 0.5, lineHeight: 21 },
  buttonLabelSm:  { fontSize: 12, fontWeight: '500', letterSpacing: 0.4, lineHeight: 18 },
}

export const radii = {
  sm:   8,
  md:   12,
  lg:   16,
  full: 9999,
}
