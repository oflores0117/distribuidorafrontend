import swal from 'sweetalert';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Chip,
  Table,
  Alert,
  Stack,
  Button,
  Dialog,
  Divider,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { apiPost } from 'src/api/client';

import { moneda } from '../pedidos/estados';
import { ETIQUETA_PARADA } from './entregas';
import { MEDIOS_PAGO, nombreMedio } from './cobro-entrega';

// Diferencias de centavos por redondeo no son un descuadre
const cuadra = (diferencia) => Math.abs(diferencia) < 0.01;

/**
 * Rendicion de la ruta: lo cobrado parada por parada y el efectivo que entrega
 * el repartidor al volver. Transferencias y QR no pasan por sus manos, asi que
 * solo el efectivo se cuenta.
 */
export default function RendicionDialog({ idRutaDia, abierto, onCerrar, onGuardado }) {
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [datos, setDatos] = useState(null);
  const [efectivo, setEfectivo] = useState('');
  const [observacion, setObservacion] = useState('');

  const buscar = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await apiPost('obtener_cobros_ruta', { idRutaDia });
      if (!resp.success) {
        swal('Error', resp.error || 'No se encontro la ruta', 'error');
        return;
      }
      setDatos(resp);
      // Se propone lo esperado: el deposito solo corrige si el conteo no da
      setEfectivo(String(resp.efectivoEsperado));
      setObservacion('');
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, [idRutaDia]);

  useEffect(() => {
    if (abierto) buscar();
  }, [abierto, buscar]);

  const rendida = Boolean(datos && datos.rendicion);
  const esperado = datos ? datos.efectivoEsperado : 0;
  const diferencia = rendida
    ? datos.rendicion.diferencia
    : (parseFloat(efectivo) || 0) - esperado;

  const registrar = async () => {
    if (efectivo === '' || Number.isNaN(parseFloat(efectivo)) || parseFloat(efectivo) < 0) {
      swal('Falta el monto', 'Indica cuanto efectivo entrego el repartidor', 'warning');
      return;
    }
    if (!cuadra(diferencia) && !observacion.trim()) {
      swal('No cuadra', 'Explica la diferencia en la observacion', 'warning');
      return;
    }

    const confirmado = await swal({
      title: 'Registrar la rendicion?',
      text: cuadra(diferencia)
        ? `El efectivo cuadra: ${moneda(esperado)}.`
        : `Diferencia de ${moneda(diferencia)} contra lo cobrado. No se puede repetir.`,
      icon: 'warning',
      buttons: ['Revisar', 'Registrar'],
    });
    if (!confirmado) return;

    setGuardando(true);
    try {
      const resp = await apiPost('registrar_rendicion_ruta', {
        idRutaDia,
        efectivoRendido: parseFloat(efectivo),
        observacion,
      });
      if (!resp.success) {
        swal('No se registro', resp.error || '', 'warning');
        return;
      }
      swal('Rendicion registrada', '', 'success');
      buscar();
      onGuardado();
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const paradas = datos ? datos.paradas.filter((parada) => parada.estado !== 'pendiente') : [];

  return (
    <Dialog open={abierto} onClose={onCerrar} fullWidth maxWidth="md">
      <DialogTitle>Cobros y rendicion</DialogTitle>
      <DialogContent dividers>
        {cargando && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {!cargando && datos && (
          <Stack spacing={2}>
            {datos.pendientes > 0 && !rendida && (
              <Alert severity="info">
                {`Quedan ${datos.pendientes} parada(s) sin cerrar. La rendicion se registra cuando `}
                todas esten cerradas.
              </Alert>
            )}

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`Entregado ${moneda(datos.totales.entregado)}`} />
              {MEDIOS_PAGO.map((medio) => (
                <Chip
                  key={medio.valor}
                  variant="outlined"
                  label={`${medio.nombre} ${moneda(datos.totales.porMedio[medio.valor] || 0)}`}
                />
              ))}
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Medio</TableCell>
                    <TableCell align="right">Cobrado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paradas.map((parada) => {
                    const etiqueta = ETIQUETA_PARADA[parada.estado] || {
                      texto: parada.estado,
                      color: 'default',
                    };
                    return (
                      <TableRow key={parada.idRutaParada}>
                        <TableCell>{parada.orden}</TableCell>
                        <TableCell>{parada.cliente}</TableCell>
                        <TableCell>
                          <Chip size="small" color={etiqueta.color} label={etiqueta.texto} />
                        </TableCell>
                        <TableCell>
                          {parada.cobro ? nombreMedio(parada.cobro.medio) : '-'}
                          {parada.cobro && parada.cobro.referencia && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {parada.cobro.referencia}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {parada.cobro ? moneda(parada.cobro.monto) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {paradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        Todavia no hay paradas cerradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider />

            <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap>
              <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                {`Efectivo esperado: ${moneda(esperado)}`}
              </Typography>
              {rendida ? (
                <Typography variant="subtitle1">
                  {`Rendido: ${moneda(datos.rendicion.efectivoRendido)}`}
                </Typography>
              ) : (
                <TextField
                  size="small"
                  label="Efectivo entregado"
                  value={efectivo}
                  onChange={(e) => setEfectivo(e.target.value)}
                  inputProps={{ inputMode: 'decimal', style: { textAlign: 'right' } }}
                  sx={{ width: 180 }}
                />
              )}
              <Chip
                color={cuadra(diferencia) ? 'success' : 'error'}
                label={cuadra(diferencia) ? 'cuadra' : `diferencia ${moneda(diferencia)}`}
              />
            </Stack>

            {rendida ? (
              <Alert severity={cuadra(diferencia) ? 'success' : 'warning'}>
                {`Rendicion registrada el ${datos.rendicion.rendidoEn}.`}
                {datos.rendicion.observacion && ` ${datos.rendicion.observacion}`}
                {!cuadra(diferencia) &&
                  ' La diferencia se recalcula con los cobros actuales: si se corrigio una entrega despues de rendir, aparece aca.'}
              </Alert>
            ) : (
              <TextField
                fullWidth
                size="small"
                label="Observacion"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                helperText={cuadra(diferencia) ? '' : 'Obligatoria si el efectivo no cuadra'}
              />
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCerrar}>Cerrar</Button>
        {datos && !rendida && (
          <Button
            variant="contained"
            onClick={registrar}
            disabled={guardando || datos.pendientes > 0}
          >
            {guardando ? 'Registrando...' : 'Registrar rendicion'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

RendicionDialog.propTypes = {
  idRutaDia: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  abierto: PropTypes.bool.isRequired,
  onCerrar: PropTypes.func.isRequired,
  onGuardado: PropTypes.func.isRequired,
};
