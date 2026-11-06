import swal from 'sweetalert';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  List,
  Table,
  Alert,
  Stack,
  Tooltip,
  ListItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  CardContent,
  ListItemText,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { apiPost } from 'src/api/client';

import Iconify from 'src/components/iconify';

const DIAS = [
  { valor: 1, corto: 'Lun' },
  { valor: 2, corto: 'Mar' },
  { valor: 3, corto: 'Mie' },
  { valor: 4, corto: 'Jue' },
  { valor: 5, corto: 'Vie' },
  { valor: 6, corto: 'Sab' },
  { valor: 7, corto: 'Dom' },
];

// Mas de esto en un dia no lo hace un repartidor: se pinta como sobrecarga
const CLIENTES_POR_DIA_SUGERIDO = 40;

export default function CargaTab() {
  const [cargando, setCargando] = useState(true);
  const [zonas, setZonas] = useState([]);
  const [totales, setTotales] = useState(null);
  const [duplicados, setDuplicados] = useState([]);

  const [filtro, setFiltro] = useState('');
  const [texto, setTexto] = useState('');
  const [sinZona, setSinZona] = useState(null);
  const [cargandoSinZona, setCargandoSinZona] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await apiPost('obtener_carga_zonas');
      setZonas(resp.zonas || []);
      setTotales(resp.totales || null);
      setDuplicados(resp.duplicados || []);
    } catch (err) {
      swal('No se pudo cargar el tablero', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    const id = setTimeout(() => setTexto(filtro.trim()), 400);
    return () => clearTimeout(id);
  }, [filtro]);

  const buscarSinZona = useCallback(async () => {
    setCargandoSinZona(true);
    try {
      const resp = await apiPost('obtener_clientes_sin_zona', { buscar: texto, limite: 50 });
      setSinZona(resp);
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setCargandoSinZona(false);
    }
  }, [texto]);

  useEffect(() => {
    buscarSinZona();
  }, [buscarSinZona]);

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const colorCarga = (cantidad, tienePlantilla) => {
    if (cantidad === 0) return 'text.disabled';
    if (!tienePlantilla) return 'error.main';
    if (cantidad > CLIENTES_POR_DIA_SUGERIDO) return 'warning.dark';
    return 'text.primary';
  };

  return (
    <Stack spacing={3}>
      {totales && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={`${totales.clientes} clientes`} />
          <Chip color="success" label={`${totales.clientesConZona} con zona`} />
          <Chip
            color={totales.clientesSinZona > 0 ? 'warning' : 'default'}
            label={`${totales.clientesSinZona} sin zona`}
          />
          {totales.sinCoordenadas > 0 && (
            <Chip color="warning" label={`${totales.sinCoordenadas} sin ubicacion`} />
          )}
          {totales.enVariasZonas > 0 && (
            <Chip color="error" label={`${totales.enVariasZonas} en mas de una zona`} />
          )}
        </Stack>
      )}

      <Card>
        <CardContent sx={{ pb: 0 }}>
          <Typography variant="subtitle1">Carga por dia</Typography>
          <Typography variant="body2" color="text.secondary">
            Clientes a visitar cada dia segun su frecuencia. En rojo los dias con clientes y sin
            plantilla que los reparta; en naranja los que pasan de {CLIENTES_POR_DIA_SUGERIDO}.
          </Typography>
        </CardContent>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Zona</TableCell>
                <TableCell align="right">Clientes</TableCell>
                {DIAS.map((dia) => (
                  <TableCell key={dia.valor} align="right">
                    {dia.corto}
                  </TableCell>
                ))}
                <TableCell align="right">Sin frecuencia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {zonas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10}>
                    <Alert severity="info" sx={{ m: 1 }}>
                      No hay zonas activas. Dibuja una en la pestana de territorios.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
              {zonas.map((zona) => (
                <TableRow key={zona.idZona} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          flexShrink: 0,
                          bgcolor: zona.color || '#000',
                        }}
                      />
                      <Typography variant="body2">{zona.nombre}</Typography>
                      {!zona.valido && (
                        <Tooltip title="El poligono no tiene coordenadas usables">
                          <Iconify icon="eva:alert-triangle-fill" sx={{ color: 'error.main' }} />
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{zona.clientes}</TableCell>
                  {DIAS.map((dia) => {
                    const cantidad = zona.porDia[dia.valor] || 0;
                    const plantillas = zona.plantillasPorDia[dia.valor] || 0;
                    return (
                      <TableCell key={dia.valor} align="right">
                        <Tooltip
                          title={
                            plantillas > 0
                              ? `${plantillas} plantilla(s) para ese dia`
                              : 'Sin plantilla para ese dia'
                          }
                        >
                          <Typography variant="body2" sx={{ color: colorCarga(cantidad, plantillas > 0) }}>
                            {cantidad || '-'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    );
                  })}
                  <TableCell align="right">{zona.sinFrecuencia || '-'}</TableCell>
                </TableRow>
              ))}
              {zonas.length > 0 && totales && (
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle2">Total</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2">{totales.clientesConZona}</Typography>
                  </TableCell>
                  {DIAS.map((dia) => (
                    <TableCell key={dia.valor} align="right">
                      <Typography variant="subtitle2">{totales.porDia[dia.valor] || '-'}</Typography>
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ sm: 'center' }}
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography variant="subtitle1">Clientes sin zona</Typography>
                  <Typography variant="body2" color="text.secondary">
                    No entran en ninguna ruta hasta que un territorio los cubra.
                  </Typography>
                </Box>
                <TextField
                  size="small"
                  label="Buscar"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                />
              </Stack>

              {sinZona && sinZona.sinCoordenadas > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {`${sinZona.sinCoordenadas} de ellos no tienen ubicacion cargada: ningun poligono
                  los va a alcanzar hasta que se les marque la ubicacion en el modulo de clientes.`}
                </Alert>
              )}

              {cargandoSinZona && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={28} />
                </Box>
              )}

              {!cargandoSinZona && sinZona && (
                <>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {`${sinZona.total} cliente(s)`}
                    {sinZona.total > sinZona.clientes.length
                      ? ` · se listan los primeros ${sinZona.clientes.length}`
                      : ''}
                  </Typography>
                  <List dense sx={{ maxHeight: 280, overflow: 'auto' }}>
                    {sinZona.clientes.map((cliente) => (
                      <ListItem key={cliente.id} disableGutters>
                        <ListItemText
                          primary={`${cliente.nombre} ${cliente.apellido || ''}`}
                          secondary={[
                            cliente.celular || 'sin celular',
                            cliente.frecuencia || 'sin frecuencia',
                            cliente.latitude && cliente.longitude ? null : 'sin ubicacion',
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1">En mas de una zona</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Se visitarian dos veces si las plantillas caen el mismo dia.
              </Typography>

              {duplicados.length === 0 ? (
                <Alert severity="success">Ningun cliente esta repetido entre zonas.</Alert>
              ) : (
                <List dense sx={{ maxHeight: 280, overflow: 'auto' }}>
                  {duplicados.map((cliente) => (
                    <ListItem key={cliente.id} disableGutters>
                      <ListItemText
                        primary={cliente.nombre}
                        secondary={cliente.zonas.join(' · ')}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
