import { Helmet } from 'react-helmet-async';

import { CategoriasView } from 'src/sections/categorias/view';

// ----------------------------------------------------------------------

export default function CategoriasPage() {
  return (
    <>
      <Helmet>
        <title> Categorías | Minimal UI </title>
      </Helmet>

      <CategoriasView />
    </>
  );
}
