import PropTypes from 'prop-types';

import {
  Box,
  Card,
  Chip,
  Stack,
  Divider,
  CardHeader,
  Typography,
  LinearProgress,
} from '@mui/material';

import { RouterLink } from 'src/routes/components';

import { moneda } from '../pedidos/estados';

const ESTADO_RUTA = {
  planificada: { texto: 'planificada', color: 'default' },
  en_curso: { texto: 'en la calle', color: 'info' },
  cerrada: { texto: 'cerrada', color: 'success' },
};

/** Avance de cada ruta del dia: paradas cerradas, lo entregado y si se rindio. */
export default function RutasDelDia({ rutas }) {
  return (
    <Card sx={{ height: 1 }}>
      <CardHeader
        title="Rutas del dia"
        subheader={rutas.length === 0 ? 'No hay rutas para esta fecha' : null}
        action={
          <Chip
            size="small"
            variant="outlined"
            label="Planificar"
            component={RouterLink}
            href="/planificacion"
            clickable
          />
        }
      />

      <Stack divider={<Divider />} sx={{ px: 3, pb: 2 }}>
        {rutas.map((ruta) => {
          const avance =
            ruta.totalParadas > 0 ? (ruta.paradasCerradas / ruta.totalParadas) * 100 : 0;
          const estado = ESTADO_RUTA[ruta.estado] || { texto: ruta.estado, color: 'default' };

          return (
            <Box key={ruta.idRutaDia} sx={{ py: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                  {ruta.zona || `Ruta ${ruta.idRutaDia}`}
                  <Typography component="span" variant="body2" color="text.secondary">
                    {ruta.funcionario ? ` · ${ruta.funcionario}` : ' · sin repartidor'}
                  </Typography>
                </Typography>
                <Chip size="small" color={estado.color} label={estado.texto} />
                {ruta.faltante > 0 && (
                  <Chip size="small" color="error" label={`faltan ${ruta.faltante} u.`} />
                )}
                {ruta.cobrado > 0 && !ruta.rendida && (
                  <Chip size="small" color="warning" variant="outlined" label="sin rendir" />
                )}
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={avance}
                  color={avance === 100 ? 'success' : 'primary'}
                  sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 64 }}>
                  {`${ruta.paradasCerradas}/${ruta.totalParadas} paradas`}
                </Typography>
                <Typography variant="body2" sx={{ minWidth: 90, textAlign: 'right' }}>
                  {moneda(ruta.montoEntregado)}
                </Typography>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
}

RutasDelDia.propTypes = {
  rutas: PropTypes.array.isRequired,
};
