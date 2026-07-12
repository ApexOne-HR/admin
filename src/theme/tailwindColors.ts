import { appSurface, palette } from './palette';

export const tailwindColors = {
  brand: palette.brand,
  neutral: palette.neutral,
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  surface: appSurface,
} as const;
