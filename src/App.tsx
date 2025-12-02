import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import Layout from './components/Layout';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Basic check to see if PWA is active
    if ('serviceWorker' in navigator) {
      console.log('Service Worker supported');
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout />
    </ThemeProvider>
  );
}

export default App;
