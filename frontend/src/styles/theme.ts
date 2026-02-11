import { extendTheme } from '@chakra-ui/react';

export const theme = extendTheme({
  fonts: {
    heading: '"Space Grotesk", sans-serif',
    body: '"Space Grotesk", sans-serif'
  },
  styles: {
    global: {
      body: {
        bgGradient: 'linear(to-br, #0f172a, #1f2937)',
        color: 'gray.100'
      }
    }
  },
  colors: {
    brand: {
      50: '#e2f9f1',
      100: '#b9eedb',
      200: '#8de2c3',
      300: '#5fd6ab',
      400: '#36cc96',
      500: '#1ab17d',
      600: '#138a62',
      700: '#0c6548',
      800: '#05402e',
      900: '#002016'
    }
  }
});
