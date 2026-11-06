import { Helmet } from 'react-helmet-async';

import { ProveedoresView } from 'src/sections/proveedores/view';

// ----------------------------------------------------------------------

export default function ProveedoresPage() {
  return (
    <>
      <Helmet>
        <title> Proveedores | Minimal UI </title>
      </Helmet>

      <ProveedoresView />
    </>
  );
}
