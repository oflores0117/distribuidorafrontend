import { Helmet } from 'react-helmet-async';

import { MiRutaView } from 'src/sections/mi-ruta/view';

// ----------------------------------------------------------------------

export default function MiRutaPage() {
  return (
    <>
      <Helmet>
        <title> Mi ruta </title>
      </Helmet>

      <MiRutaView />
    </>
  );
}
