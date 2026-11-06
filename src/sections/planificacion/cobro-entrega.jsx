import PropTypes from 'prop-types';

import { Stack, TextField, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';

import { moneda } from '../pedidos/estados';

// La distribuidora vende solo al contado: el monto es lo entregado y lo unico
// que se elige es como pago el cliente. El backend usa las mismas claves.
export const MEDIOS_PAGO = [
  { valor: 'efectivo', nombre: 'Efectivo' },
  { valor: 'transferencia', nombre: 'Transferencia' },
  { valor: 'qr', nombre: 'QR' },
];

export const nombreMedio = (valor) =>
  (MEDIOS_PAGO.find((medio) => medio.valor === valor) || { nombre: valor }).nombre;

/**
 * Cobro de la parada. El efectivo es lo que el repartidor rinde al volver;
 * transferencia y QR llevan el numero de comprobante para conciliar.
 */
export default function CobroEntrega({ monto, medio, referencia, onCambiar, deshabilitado }) {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          Cobro al contado
        </Typography>
        <Typography variant="h6">{moneda(monto)}</Typography>
      </Stack>

      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        color="primary"
        value={medio}
        disabled={deshabilitado}
        onChange={(_, valor) => valor && onCambiar({ medio: valor, referencia })}
      >
        {MEDIOS_PAGO.map((opcion) => (
          <ToggleButton key={opcion.valor} value={opcion.valor}>
            {opcion.nombre}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {medio !== 'efectivo' && (
        <TextField
          size="small"
          fullWidth
          label="Numero de comprobante"
          disabled={deshabilitado}
          value={referencia}
          onChange={(e) => onCambiar({ medio, referencia: e.target.value })}
          helperText="Opcional, pero sirve para encontrar el pago en el banco"
        />
      )}
    </Stack>
  );
}

CobroEntrega.propTypes = {
  monto: PropTypes.number.isRequired,
  medio: PropTypes.string.isRequired,
  referencia: PropTypes.string,
  onCambiar: PropTypes.func.isRequired,
  deshabilitado: PropTypes.bool,
};
