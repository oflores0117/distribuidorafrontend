import { useState } from 'react';

import { Tab, Tabs, Stack, Container, Typography } from '@mui/material';

import ExistenciasTab from '../existencias-tab';
import MovimientosTab from '../movimientos-tab';

export default function InventarioView() {
  const [tab, setTab] = useState('existencias');

  return (
    <Container maxWidth="xl">
      <Stack mb={3}>
        <Typography variant="h4">Inventario</Typography>
        <Typography variant="body2" color="text.secondary">
          Existencias del deposito, lo que va arriba de los camiones y el historial de cada
          movimiento.
        </Typography>
      </Stack>

      <Tabs value={tab} onChange={(e, valor) => setTab(valor)} sx={{ mb: 3 }}>
        <Tab value="existencias" label="Existencias" />
        <Tab value="movimientos" label="Movimientos" />
      </Tabs>

      {tab === 'existencias' && <ExistenciasTab />}
      {tab === 'movimientos' && <MovimientosTab />}
    </Container>
  );
}
