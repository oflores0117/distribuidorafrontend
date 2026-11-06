import { Helmet } from 'react-helmet-async';

import { RutasView } from 'src/sections/rutas/view';

// ----------------------------------------------------------------------

export default function RutasPage() {
  return (
    <>
      <Helmet>
        <title> Rutas | Minimal UI </title>
      </Helmet>

      <RutasView />
    </>
  );
}
