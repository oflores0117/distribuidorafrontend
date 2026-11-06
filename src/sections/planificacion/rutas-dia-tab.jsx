import swal from 'sweetalert';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Table,
  Stack,
  Button,
  Select,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  InputLabel,
  FormControl,
  LinearProgress,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { apiPost } from 'src/api/client';

import Iconify from 'src/components/iconify';

const COLOR_ESTADO = {
  planificada: 'default',
  en_curso: 'warning',
  cerrada: 'success',
  cancelada: 'error',
};

const hoy = () => new Date().toISOString().slice(0, 10);

export default function RutasDiaTab({ onVerDetalle }) {
  const [cargando, setCargando] = useState(true);
  const [rutas, setRutas] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [fecha, setFecha] = useState(hoy());
  const [plantillaSel, setPlantillaSel] = useState('');
  const [generando, setGenerando] = useState(false);

  const buscar = useCallback(async (fechaBuscada) => {
    setCargando(true);
    try {
      const resp = await apiPost('obtener_rutas_dia', { fecha: fechaBuscada });
      setRutas(resp.rutas || []);
    } catch (err) {
      swal('No se pudieron cargar las rutas', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    buscar(fecha);
  }, [buscar, fecha]);

  useEffect(() => {
    apiPost('obtener_ruta_plantillas')
      .then((resp) => setPlantillas(resp.plantillas || []))
      .catch(() => setPlantillas([]));
  }, []);

  const generar = async () => {
    if (!plantillaSel) {
      swal('Elige una plantilla', 'Selecciona la plantilla a generar', 'warning');
      return;
    }
    setGenerando(true);
    try {
      const resp = await apiPost('generar_ruta_dia', {
        idRutaPlantilla: plantillaSel,
        fecha,
      });
      if (!resp.success) {
        swal('No se genero', resp.error || 'Error desconocido', 'warning');
        return;
      }
      // Se explica el recorte: la plantilla es de un dia y no todos los clientes se visitan ese dia
      const detalle = [`Se crearon ${resp.paradas} paradas de ${resp.clientesZona} clientes de la zona`];
      if (resp.omitidosPorFrecuencia > 0) {
        detalle.push(`${resp.omitidosPorFrecuencia} no se visitan ese dia`);
      }
      if (resp.sinFrecuencia > 0) {
        detalle.push(`${resp.sinFrecuencia} sin frecuencia declarada, se incluyeron`);
      }
      swal('Ruta generada', `${detalle.join('. ')}.`, 'success');
      buscar(fecha);
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setGenerando(false);
    }
  };

  // Cuenta todo lo resuelto, no solo lo entregado: una parada rechazada o con
  // el cliente ausente tambien esta hecha
  const avance = (ruta) => {
    const total = Number(ruta.totalParadas) || 0;
    if (total === 0) return 0;
    const cerradas = Number(ruta.paradasCerradas ?? ruta.paradasEntregadas) || 0;
    return (cerradas / total) * 100;
  };

  return (
    <>
      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />

          <FormControl sx={{ minWidth: 260 }}>
            <InputLabel>Plantilla a generar</InputLabel>
            <Select
              label="Plantilla a generar"
              value={plantillaSel}
              onChange={(e) => setPlantillaSel(e.target.value)}
            >
              {plantillas.map((p) => (
                <MenuItem key={p.idRutaPlantilla} value={p.idRutaPlantilla}>
                  {p.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={generar}
            disabled={generando}
            startIcon={<Iconify icon="eva:navigation-2-fill" />}
          >
            {generando ? 'Generando...' : 'Generar ruta'}
          </Button>
        </Stack>
      </Card>

      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Zona</TableCell>
                  <TableCell>Repartidor</TableCell>
                  <TableCell>Vehiculo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Avance</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rutas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      No hay rutas generadas para esta fecha.
                    </TableCell>
                  </TableRow>
                )}
                {rutas.map((ruta) => (
                  <TableRow key={ruta.idRutaDia} hover>
                    <TableCell>{ruta.zona ? ruta.zona.nombre : '-'}</TableCell>
                    <TableCell>
                      {ruta.funcionario
                        ? `${ruta.funcionario.nombre} ${ruta.funcionario.apellido || ''}`
                        : '-'}
                    </TableCell>
                    <TableCell>{ruta.vehiculo ? ruta.vehiculo.placa : '-'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={ruta.estado}
                        color={COLOR_ESTADO[ruta.estado] || 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <LinearProgress
                        variant="determinate"
                        value={avance(ruta)}
                        sx={{ height: 8, borderRadius: 1, mb: 0.5 }}
                      />
                      {`${ruta.paradasEntregadas || 0} / ${ruta.totalParadas || 0} entregadas`}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => onVerDetalle(ruta.idRutaDia)}>
                        Ver paradas
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </>
  );
}

RutasDiaTab.propTypes = {
  onVerDetalle: PropTypes.func.isRequired,
};
