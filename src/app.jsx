/* eslint-disable perfectionist/sort-imports */
//// import Router from 'src/routes/sections';
import Router from "./routes/sections"
import { useScrollToTop } from "./hooks/use-scroll-to-top";
import ThemeProvider from './theme';

// ----------------------------------------------------------------------

export default function App() {
  
  useScrollToTop();

  return (
    <ThemeProvider>
      <Router/>
    </ThemeProvider>
  );
}
