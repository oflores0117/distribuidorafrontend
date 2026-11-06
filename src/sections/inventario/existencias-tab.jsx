import swal from 'sweetalert';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Table,
  Alert,
  Stack,
  Button,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  CardContent,
  TableContainer,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';

import { apiPost } from 'src/api/client';

import Iconify from 'src/components/iconify';

import MovimientoDialog from './movimiento-dialog';

const ETIQUETA_ALERTA = {
  sin_stock: { texto: 'sin stock', color: 'error' },
  bajo_minimo: { texto: 'bajo minimo', color: 'warning' },
};

export default function ExistenciasTab() {
  const [cargando, setCargando] = useState(true);
  const [productos, setProductos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await apiPost('obtener_existencias');
      setProductos(resp.productos || []);
      setResumen(resp.resumen || null);
    } catch (err) {
      swal('No se pudieron cargar las existencias', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const texto = filtro.trim().toLowerCase();
  const visibles = productos.filter((producto) => {
    if (soloAlertas && producto.alerta === 'ok') return false;
    if (!texto) return true;
    return `${producto.nombre} ${producto.codigo || ''} ${producto.categoria || ''}`
      .toLowerCase()
      .includes(texto);
  });

  return (
    <>
      {resumen && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
          <Chip label={`${resumen.total} producto(s)`} />
          <Chip
            color={resumen.bajoMinimo > 0 ? 'warning' : 'default'}
            label={`${resumen.bajoMinimo} bajo minimo`}
          />
          <Chip
            color={resumen.sinStock > 0 ? 'error' : 'default'}
            label={`${resumen.sinStock} sin stock`}
          />
        </Stack>
      )}

      <Card>
        <CardContent sx={{ pb: 1 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
          >
            <TextField
              size="small"
              placeholder="Buscar producto, codigo o categoria..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              sx={{ width: { xs: '100%', sm: 320 } }}
              InputProps={{
                startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, opacity: 0.6 }} />,
              }}
            />
            <FormControlLabel
              control={
                <Box
                  component="input"
                  type="checkbox"
                  checked={soloAlertas}
                  onChange={(e) => setSoloAlertas(e.target.checked)}
                  sx={{ mr: 1 }}
                />
              }
              label={<Typography variant="body2">Solo con alerta</Typography>}
            />
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
                  <TableCell>Producto</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell align="right">En deposito</TableCell>
                  <TableCell align="right">En ruta</TableCell>
                  <TableCell align="right">Minimo</TableCell>
                  <TableCell>&nbsp;</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Alert severity="info" sx={{ m: 1 }}>
                        No hay productos que mostrar.
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}
                {visibles.map((producto) => {
                  const etiqueta = ETIQUETA_ALERTA[producto.alerta];
                  return (
                    <TableRow key={producto.idProducto} hover>
                      <TableCell>
                        <Typography variant="body2">{producto.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {producto.codigo}
                        </Typography>
                      </TableCell>
                      <TableCell>{producto.categoria || '-'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                          <Typography variant="body2">{producto.stockActual}</Typography>
                          {etiqueta && (
                            <Chip size="small" color={etiqueta.color} label={etiqueta.texto} />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{producto.enRuta || '-'}</TableCell>
                      <TableCell align="right">{producto.stockMinimo}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => setSeleccionado(producto)}>
                          Movimiento
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <MovimientoDialog
        producto={seleccionado}
        abierto={Boolean(seleccionado)}
        onCerrar={() => setSeleccionado(null)}
        onGuardado={() => {
          setSeleccionado(null);
          cargar();
        }}
      />
    </>
  );
}
