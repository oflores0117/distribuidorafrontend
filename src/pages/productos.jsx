import { Helmet } from 'react-helmet-async';

import { ProductosView } from 'src/sections/productos/view';

// ----------------------------------------------------------------------

export default function ProductosPage() {
  return (
    <>
      <Helmet>
        <title> Productos | Minimal UI </title>
      </Helmet>

      <ProductosView />
    </>
  );
}
