import swal from 'sweetalert';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import {
  Chip,
  Alert,
  Stack,
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
  FormHelperText,
} from '@mui/material';

import { apiPost } from 'src/api/client';

import { moneda } from '../pedidos/estados';
import { ETIQUETA_PARADA } from './entregas';

/**
 * Datos de planificacion de la parada: donde va en el recorrido y que pedido
 * lleva. El resultado de la entrega NO se toca aca: eso lo registra
 * entrega-dialog, que es lo unico que mueve stock.
 */
export default function ParadaDialog({ parada, totalParadas, abierto, onCerrar, onGuardado }) {
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);

  useEffect(() => {
    if (!parada) {
      setForm(null);
      return;
    }
    setForm({
      orden: parada.orden,
      observacion: parada.observacion || '',
      idPedido: parada.idPedido || '',
    });
  }, [parada]);

  // Pedidos del cliente que todavia esperan ruta, mas el que ya tiene la parada
  const buscarPedidos = useCallback(async () => {
    if (!parada || !parada.idCliente) return;

    setCargandoPedidos(true);
    try {
      const resp = await apiPost('obtener_pedidos_cliente', {
        idCliente: parada.idCliente,
        idPedidoActual: parada.idPedido || undefined,
      });
      setPedidos(resp.pedidos || []);
    } catch (err) {
      // Que no se caiga el dialogo: la parada se puede editar igual sin pedido
      setPedidos([]);
    } finally {
      setCargandoPedidos(false);
    }
  }, [parada]);

  useEffect(() => {
    if (abierto) buscarPedidos();
  }, [abierto, buscarPedidos]);

  const cambiar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const guardar = async () => {
    setGuardando(true);
    try {
      const resp = await apiPost('actualizar_parada', {
        idRutaParada: parada.idRutaParada,
        orden: Number(form.orden),
        // Se reenvian sin tocar: el resultado de la entrega es de entrega-dialog
        estado: parada.estado,
        motivo: parada.motivo || '',
        observacion: form.observacion,
        idPedido: form.idPedido,
      });
      if (!resp.success) {
        swal('Error', resp.error || 'No se pudo guardar la parada', 'error');
        return;
      }
      onGuardado();
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  if (!form || !parada) return null;

  const nombreCliente = parada.cliente
    ? `${parada.cliente.nombre} ${parada.cliente.apellido || ''}`
    : `Cliente ${parada.idCliente}`;

  const etiqueta = ETIQUETA_PARADA[parada.estado] || { texto: parada.estado, color: 'default' };
  const cerrada = parada.estado !== 'pendiente';

  return (
    <Dialog open={abierto} onClose={onCerrar} fullWidth maxWidth="sm">
      <DialogTitle>Editar parada</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="subtitle2">{nombreCliente}</Typography>

          <TextField
            label="Posicion en el recorrido"
            type="number"
            value={form.orden}
            onChange={(e) => cambiar('orden', e.target.value)}
            helperText={`Entre 1 y ${totalParadas}. Las demas paradas se recorren solas.`}
            inputProps={{ min: 1, max: totalParadas }}
            fullWidth
          />

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Estado de la entrega:
            </Typography>
            <Chip size="small" color={etiqueta.color} label={etiqueta.texto} />
          </Stack>

          {cerrada && (
            <Alert severity="info">
              La entrega de esta parada ya se registro, asi que el pedido queda fijo. Solo se
              pueden cambiar la posicion y la observacion.
            </Alert>
          )}

          <FormControl fullWidth disabled={cargandoPedidos || cerrada}>
            <InputLabel>Pedido</InputLabel>
            <Select
              label="Pedido"
              value={form.idPedido}
              onChange={(e) => cambiar('idPedido', e.target.value)}
            >
              <MenuItem value="">
                <em>Sin pedido (visita de relevamiento)</em>
              </MenuItem>
              {pedidos.map((pedido) => (
                <MenuItem key={pedido.idPedido} value={pedido.idPedido}>
                  {pedido.codigo} - {pedido.items} item(s) - {moneda(pedido.total)}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {cargandoPedidos
                ? 'Buscando pedidos del cliente...'
                : 'Solo aparecen los pedidos pendientes de este cliente'}
            </FormHelperText>
          </FormControl>

          <TextField
            label="Observacion"
            value={form.observacion}
            onChange={(e) => cambiar('observacion', e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCerrar}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ParadaDialog.propTypes = {
  parada: PropTypes.object,
  totalParadas: PropTypes.number.isRequired,
  abierto: PropTypes.bool.isRequired,
  onCerrar: PropTypes.func.isRequired,
  onGuardado: PropTypes.func.isRequired,
};
