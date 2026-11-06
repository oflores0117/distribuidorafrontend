import swal from 'sweetalert';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import {
  Stack,
  Alert,
  Button,
  Dialog,
  Select,
  MenuItem,
  TextField,
  InputLabel,
  Typography,
  FormControl,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { apiPost } from 'src/api/client';

const TIPOS = [
  { valor: 'ingreso', etiqueta: 'Ingreso de mercaderia', ayuda: 'Suma al deposito' },
  { valor: 'merma', etiqueta: 'Merma', ayuda: 'Resta del deposito, exige motivo' },
  { valor: 'ajuste', etiqueta: 'Ajuste de inventario', ayuda: 'Diferencia contra el conteo fisico' },
];

export default function MovimientoDialog({ producto, abierto, onCerrar, onGuardado }) {
  const [tipo, setTipo] = useState('ingreso');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (abierto) {
      setTipo('ingreso');
      setCantidad('');
      setMotivo('');
    }
  }, [abierto]);

  if (!producto) return null;

  const numero = parseInt(cantidad, 10);
  const valida = !Number.isNaN(numero) && numero !== 0;

  // El ajuste se manda firmado; en el resto el signo lo pone el backend
  const efecto = tipo === 'merma' ? -Math.abs(numero) : numero;
  const resultante = valida ? producto.stockActual + efecto : producto.stockActual;

  const guardar = async () => {
    if (!valida) {
      swal('Cantidad invalida', 'Indica una cantidad distinta de cero', 'info');
      return;
    }
    setGuardando(true);
    try {
      const resp = await apiPost('registrar_movimiento_stock', {
        idProducto: producto.idProducto,
        tipo,
        cantidad: numero,
        motivo,
      });
      if (!resp.success) {
        swal('No se registro', resp.error || '', 'warning');
        return;
      }
      onGuardado();
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const ayuda = TIPOS.find((t) => t.valor === tipo);

  return (
    <Dialog open={abierto} onClose={onCerrar} fullWidth maxWidth="xs">
      <DialogTitle>{producto.nombre}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {`En deposito: ${producto.stockActual} · minimo: ${producto.stockMinimo}`}
          </Typography>

          <FormControl size="small" fullWidth>
            <InputLabel id="tipo-movimiento">Movimiento</InputLabel>
            <Select
              labelId="tipo-movimiento"
              label="Movimiento"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              {TIPOS.map((opcion) => (
                <MenuItem key={opcion.valor} value={opcion.valor}>
                  {opcion.etiqueta}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label={tipo === 'ajuste' ? 'Diferencia (usa - para restar)' : 'Cantidad'}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            inputProps={{ inputMode: 'numeric' }}
            helperText={ayuda ? ayuda.ayuda : ''}
          />

          <TextField
            size="small"
            label={tipo === 'merma' ? 'Motivo (obligatorio)' : 'Motivo'}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />

          {valida && (
            <Alert severity={resultante < 0 ? 'error' : 'info'}>
              {resultante < 0
                ? 'El deposito no puede quedar en negativo'
                : `El deposito queda en ${resultante}`}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCerrar}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={guardar}
          disabled={guardando || !valida || resultante < 0}
        >
          {guardando ? 'Guardando...' : 'Registrar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

MovimientoDialog.propTypes = {
  producto: PropTypes.object,
  abierto: PropTypes.bool.isRequired,
  onCerrar: PropTypes.func.isRequired,
  onGuardado: PropTypes.func.isRequired,
};

MovimientoDialog.defaultProps = {
  producto: null,
};
