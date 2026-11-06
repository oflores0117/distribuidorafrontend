import { Helmet } from 'react-helmet-async';

import { PlanificacionView } from 'src/sections/planificacion/view';

// ----------------------------------------------------------------------

export default function PlanificacionPage() {
  return (
    <>
      <Helmet>
        <title> Planificacion de rutas </title>
      </Helmet>

      <PlanificacionView />
    </>
  );
}
