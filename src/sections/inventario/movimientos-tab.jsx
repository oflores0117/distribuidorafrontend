import swal from 'sweetalert';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Table,
  Alert,
  Stack,
  Select,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  InputLabel,
  Typography,
  FormControl,
  CardContent,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { apiPost } from 'src/api/client';

const TIPOS = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'ingreso', etiqueta: 'Ingreso' },
  { valor: 'ajuste', etiqueta: 'Ajuste' },
  { valor: 'merma', etiqueta: 'Merma' },
  { valor: 'carga_ruta', etiqueta: 'Carga de camion' },
  { valor: 'retorno_ruta', etiqueta: 'Retorno de camion' },
  { valor: 'entrega', etiqueta: 'Entregado en ruta' },
  { valor: 'faltante_ruta', etiqueta: 'Faltante de ruta' },
];

const COLOR_TIPO = {
  ingreso: 'success',
  retorno_ruta: 'success',
  merma: 'error',
  carga_ruta: 'info',
  entrega: 'primary',
  ajuste: 'warning',
  faltante_ruta: 'error',
};

/**
 * 'cantidad' es el efecto sobre el deposito y vale cero en lo que pasa en la
 * calle (la mercaderia ya habia salido al cargar el camion); 'unidades' es la
 * que se movio de verdad. Se muestran distinto para no leer un 0 enganoso.
 */
const movimientoDe = (mov) => {
  const cantidad = Number(mov.cantidad) || 0;
  if (cantidad !== 0) return cantidad > 0 ? `+${cantidad}` : String(cantidad);
  return mov.unidades ? `${mov.unidades}` : '0';
};

export default function MovimientosTab() {
  const [cargando, setCargando] = useState(true);
  const [movimientos, setMovimientos] = useState([]);
  const [total, setTotal] = useState(0);
  const [tipo, setTipo] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await apiPost('obtener_movimientos_stock', {
        tipo,
        desde,
        hasta,
        limite: 200,
      });
      setMovimientos(resp.movimientos || []);
      setTotal(resp.total || 0);
    } catch (err) {
      swal('No se pudo cargar el historial', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, [tipo, desde, hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <Card>
      <CardContent sx={{ pb: 1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="tipo-filtro">Tipo</InputLabel>
            <Select
              labelId="tipo-filtro"
              label="Tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              {TIPOS.map((opcion) => (
                <MenuItem key={opcion.valor || 'todos'} value={opcion.valor}>
                  {opcion.etiqueta}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            type="date"
            label="Desde"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            type="date"
            label="Hasta"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {`${total} movimiento(s)`}
          </Typography>
        </Stack>
      </CardContent>

      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Producto</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Unidades</TableCell>
                <TableCell align="right">Deposito</TableCell>
                <TableCell>Ruta</TableCell>
                <TableCell>Motivo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimientos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Alert severity="info" sx={{ m: 1 }}>
                      Todavia no hay movimientos registrados.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
              {movimientos.map((mov) => (
                <TableRow key={mov.idMovimientoStock} hover>
                  <TableCell>{mov.created_at}</TableCell>
                  <TableCell>{mov.producto ? mov.producto.nombre : mov.idProducto}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={COLOR_TIPO[mov.tipo] || 'default'}
                      label={mov.tipo.replace('_', ' ')}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={Number(mov.cantidad) === 0 ? 'text.secondary' : 'text.primary'}
                    >
                      {movimientoDe(mov)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{mov.stockResultante}</TableCell>
                  <TableCell>{mov.idRutaDia || '-'}</TableCell>
                  <TableCell>{mov.motivo || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}
