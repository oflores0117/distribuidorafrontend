import { Helmet } from 'react-helmet-async';

import { PedidosView } from 'src/sections/pedidos/view';

// ----------------------------------------------------------------------

export default function PedidosPage() {
  return (
    <>
      <Helmet>
        <title> Pedidos | Distribuidora </title>
      </Helmet>

      <PedidosView />
    </>
  );
}
