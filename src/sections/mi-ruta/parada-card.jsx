import PropTypes from 'prop-types';

import {
  Box,
  Card,
  Chip,
  Stack,
  Button,
  Divider,
  Typography,
  CardContent,
} from '@mui/material';

import Iconify from 'src/components/iconify';

import { moneda } from '../pedidos/estados';
import { ETIQUETA_PARADA } from '../planificacion/entregas';

const nombreCliente = (parada) => {
  if (!parada.cliente) return `Cliente ${parada.idCliente}`;
  return `${parada.cliente.nombre} ${parada.cliente.apellido || ''}`.trim();
};

/** Link a Google Maps: por coordenada si la hay, si no por direccion escrita. */
const enlaceNavegacion = (cliente) => {
  if (!cliente) return null;

  const lat = parseFloat(cliente.latitude);
  const lng = parseFloat(cliente.longitude);
  if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  if (cliente.direccion) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      cliente.direccion
    )}`;
  }
  return null;
};

/**
 * Una parada vista desde el celular del repartidor. Todo lo que necesita para
 * la proxima casa: a quien, donde, que lleva y el boton para cerrarla.
 */
export default function ParadaCard({ parada, posicion, esSiguiente, onEntregar }) {
  const etiqueta = ETIQUETA_PARADA[parada.estado] || { texto: parada.estado, color: 'default' };
  const pendiente = parada.estado === 'pendiente';
  const navegacion = enlaceNavegacion(parada.cliente);
  const celular = parada.cliente ? parada.cliente.celular : null;

  return (
    <Card
      sx={{
        opacity: pendiente ? 1 : 0.72,
        border: (theme) => (esSiguiente ? `2px solid ${theme.palette.primary.main}` : 'none'),
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              typography: 'subtitle2',
              bgcolor: pendiente ? 'primary.main' : 'grey.400',
              color: 'common.white',
            }}
          >
            {posicion}
          </Box>

          <Stack sx={{ flexGrow: 1, minWidth: 0 }} spacing={0.5}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="subtitle1">{nombreCliente(parada)}</Typography>
              <Chip size="small" color={etiqueta.color} label={etiqueta.texto} />
              {esSiguiente && <Chip size="small" variant="outlined" label="siguiente" />}
            </Stack>

            {parada.cliente && parada.cliente.tipo_negocio && (
              <Typography variant="caption" color="text.secondary">
                {parada.cliente.tipo_negocio}
              </Typography>
            )}

            {parada.cliente && parada.cliente.direccion && (
              <Typography variant="body2" color="text.secondary">
                {parada.cliente.direccion}
              </Typography>
            )}

            {parada.pedido ? (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {`${parada.pedido.codigo} · ${parada.pedido.items} item(s) · `}
                <strong>{moneda(parada.pedido.total)}</strong>
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Sin pedido, solo visita
              </Typography>
            )}

            {parada.motivo && (
              <Typography variant="caption" color="error.main">
                {parada.motivo}
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>

      <Divider />

      <Stack direction="row" spacing={1} sx={{ p: 1.5 }}>
        <Button
          size="small"
          color="inherit"
          disabled={!navegacion}
          href={navegacion || undefined}
          target="_blank"
          rel="noopener"
          startIcon={<Iconify icon="eva:navigation-2-outline" />}
        >
          Ir
        </Button>

        <Button
          size="small"
          color="inherit"
          disabled={!celular}
          href={celular ? `tel:${celular}` : undefined}
          startIcon={<Iconify icon="eva:phone-outline" />}
        >
          Llamar
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          size="small"
          variant={pendiente ? 'contained' : 'outlined'}
          color={pendiente ? 'primary' : 'inherit'}
          onClick={() => onEntregar(parada)}
          startIcon={<Iconify icon="eva:checkmark-circle-2-outline" />}
        >
          {pendiente ? 'Entregar' : 'Ver'}
        </Button>
      </Stack>
    </Card>
  );
}

ParadaCard.propTypes = {
  parada: PropTypes.object.isRequired,
  posicion: PropTypes.number.isRequired,
  esSiguiente: PropTypes.bool,
  onEntregar: PropTypes.func.isRequired,
};
