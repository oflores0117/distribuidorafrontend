import { useState } from 'react';

import { Tab, Tabs, Stack, Container, Typography } from '@mui/material';

import RutaDetalle from '../ruta-detalle';
import RutasDiaTab from '../rutas-dia-tab';
import PlantillasTab from '../plantillas-tab';

export default function PlanificacionView() {
  const [tab, setTab] = useState('rutas');
  const [idRutaDia, setIdRutaDia] = useState(null);

  return (
    <Container maxWidth="xl">
      <Stack mb={3}>
        <Typography variant="h4">Planificacion de rutas</Typography>
        <Typography variant="body2" color="text.secondary">
          Define que zona visita cada repartidor y genera el recorrido del dia.
        </Typography>
      </Stack>

      {idRutaDia ? (
        <RutaDetalle idRutaDia={idRutaDia} onVolver={() => setIdRutaDia(null)} />
      ) : (
        <>
          <Tabs value={tab} onChange={(e, valor) => setTab(valor)} sx={{ mb: 3 }}>
            <Tab value="rutas" label="Rutas del dia" />
            <Tab value="plantillas" label="Plantillas" />
          </Tabs>

          {tab === 'rutas' && <RutasDiaTab onVerDetalle={setIdRutaDia} />}
          {tab === 'plantillas' && <PlantillasTab />}
        </>
      )}
    </Container>
  );
}
