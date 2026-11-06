import { Helmet } from 'react-helmet-async';

import { InventarioView } from 'src/sections/inventario/view';

// ----------------------------------------------------------------------

export default function InventarioPage() {
  return (
    <>
      <Helmet>
        <title> Inventario | Distribuidora </title>
      </Helmet>

      <InventarioView />
    </>
  );
}
