import { useState } from 'react';

import { Tab, Tabs, Stack, Container, Typography } from '@mui/material';

import CargaTab from '../carga-tab';
import ZonasTab from '../zonas-tab';

export default function RutasView() {
  const [tab, setTab] = useState('territorios');

  return (
    <Container maxWidth="xl">
      <Stack mb={3}>
        <Typography variant="h4">Zonas de reparto</Typography>
        <Typography variant="body2" color="text.secondary">
          Marca los territorios en el mapa y revisa como queda repartida la carga de la semana.
        </Typography>
      </Stack>

      <Tabs value={tab} onChange={(e, valor) => setTab(valor)} sx={{ mb: 3 }}>
        <Tab value="territorios" label="Territorios" />
        <Tab value="carga" label="Carga y cobertura" />
      </Tabs>

      {tab === 'territorios' && <ZonasTab />}
      {tab === 'carga' && <CargaTab />}
    </Container>
  );
}
