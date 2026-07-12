import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { appSurface, palette } from './palette';

const baseTheme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: palette.brand[600],
      light: palette.brand[400],
      dark: palette.brand[800],
      contrastText: '#ffffff',
    },
    secondary: {
      main: palette.neutral[700],
      light: palette.neutral[500],
      dark: palette.neutral[900],
      contrastText: '#ffffff',
    },
    success: {
      main: palette.success[500],
      dark: palette.success[700],
    },
    warning: {
      main: palette.warning[500],
      dark: palette.warning[700],
    },
    error: {
      main: palette.danger[500],
      dark: palette.danger[700],
    },
    background: {
      default: appSurface.background,
      paper: appSurface.paper,
    },
    text: {
      primary: palette.neutral[950],
      secondary: palette.neutral[600],
    },
    divider: appSurface.border,
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '1.375rem',
      fontWeight: 500,
      letterSpacing: '-0.025em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.125rem',
      fontWeight: 500,
      letterSpacing: '-0.02em',
      lineHeight: 1.25,
    },
    h3: {
      fontSize: '1rem',
      fontWeight: 500,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          minHeight: '100%',
          scrollBehavior: 'smooth',
        },
        body: {
          minHeight: '100%',
          backgroundColor: appSurface.background,
        },
        '#root': {
          minHeight: '100svh',
        },
        '*': {
          boxSizing: 'border-box',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 38,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${appSurface.border}`,
          boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: 'xl',
      },
      styleOverrides: {
        root: {
          paddingLeft: 16,
          paddingRight: 16,
          '@media (min-width: 640px)': {
            paddingLeft: 24,
            paddingRight: 24,
          },
          '@media (min-width: 1024px)': {
            paddingLeft: 32,
            paddingRight: 32,
          },
        },
      },
    },
  },
});

export const muiTheme = responsiveFontSizes(baseTheme, {
  breakpoints: ['sm', 'md', 'lg'],
  factor: 2,
});
