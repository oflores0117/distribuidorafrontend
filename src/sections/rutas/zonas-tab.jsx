import swal from 'sweetalert';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Button,
  Divider,
  Tooltip,
  TextField,
  Typography,
  CardContent,
  CircularProgress,
} from '@mui/material';

import { apiPost } from 'src/api/client';

import Iconify from 'src/components/iconify';

import ZonaMapa from './zona-mapa';
import ZonaColor from './zona-color';
import ZonasLista from './zonas-lista';

const BORRADOR = 'googleMapPolyline';

const COLOR_INICIAL = '#1976d2';

const FORM_VACIO = { nombre: '', descripcion: '', color: COLOR_INICIAL };

export default function ZonasTab() {
  const [cargando, setCargando] = useState(true);
  const [zonas, setZonas] = useState([]);
  const [resumen, setResumen] = useState(null);

  const [modo, setModo] = useState('ver'); // ver | nueva | editar
  const [idEditada, setIdEditada] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [path, setPath] = useState([]);

  const [zonaVista, setZonaVista] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [totalDentro, setTotalDentro] = useState(null);

  const [guardando, setGuardando] = useState(false);
  const [recalculando, setRecalculando] = useState(false);
  const [hayBorrador, setHayBorrador] = useState(false);

  const editando = modo !== 'ver';

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await apiPost('obtener_zonas');
      setZonas(resp.zonas || []);
      setResumen(resp.resumen || null);
    } catch (err) {
      swal('No se pudieron cargar las zonas', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Un dibujo sin guardar queda como borrador; se recupera solo si se pide
  useEffect(() => {
    setHayBorrador(Boolean(localStorage.getItem(BORRADOR)));
  }, []);

  const guardarBorrador = (vertices) => {
    setPath(vertices);
    if (vertices.length > 0) {
      localStorage.setItem(BORRADOR, JSON.stringify(vertices));
    } else {
      localStorage.removeItem(BORRADOR);
    }
  };

  const limpiarTodo = () => {
    setModo('ver');
    setIdEditada(null);
    setForm(FORM_VACIO);
    setPath([]);
    setTotalDentro(null);
    localStorage.removeItem(BORRADOR);
    setHayBorrador(false);
  };

  const nuevaZona = () => {
    setModo('nueva');
    setIdEditada(null);
    setForm(FORM_VACIO);
    setPath([]);
    setClientes([]);
    setZonaVista(null);
    setTotalDentro(null);
  };

  const editarZona = (zona) => {
    setModo('editar');
    setIdEditada(zona.idZona);
    setForm({
      nombre: zona.nombre || '',
      descripcion: zona.descripcion || '',
      color: zona.color || COLOR_INICIAL,
    });
    setPath(zona.vertices || []);
    setZonaVista(zona.idZona);
    setClientes([]);
    setTotalDentro(null);

    if (!zona.valido) {
      swal(
        'Poligono sin coordenadas usables',
        'Esta zona se guardo con coordenadas corruptas. Marca el territorio de nuevo en el mapa.',
        'warning'
      );
    }
  };

  const recuperarBorrador = () => {
    try {
      const vertices = JSON.parse(localStorage.getItem(BORRADOR)) || [];
      setModo('nueva');
      setPath(vertices);
      setHayBorrador(false);
    } catch (err) {
      localStorage.removeItem(BORRADOR);
      setHayBorrador(false);
    }
  };

  const verClientes = async (zona) => {
    if (!zona.valido) {
      swal('Zona sin poligono valido', 'Edita la zona y marca el territorio de nuevo.', 'warning');
      return;
    }
    setZonaVista(zona.idZona);
    try {
      const resp = await apiPost('clientes_en_poligono', { idZona: zona.idZona });
      if (!resp.success) {
        swal('No se pudo consultar', resp.error || '', 'warning');
        return;
      }
      setClientes(resp.clientes || []);
      setTotalDentro(resp.total);
    } catch (err) {
      swal('Error', err.message, 'error');
    }
  };

  const previsualizar = async () => {
    if (path.length < 3) {
      swal('Faltan puntos', 'Marca al menos 3 puntos en el mapa', 'info');
      return;
    }
    try {
      const resp = await apiPost('clientes_en_poligono', { cordenadas: path });
      if (!resp.success) {
        swal('No se pudo consultar', resp.error || '', 'warning');
        return;
      }
      setClientes(resp.clientes || []);
      setTotalDentro(resp.total);
    } catch (err) {
      swal('Error', err.message, 'error');
    }
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      swal('Falta el nombre', 'Ponle un nombre a la zona', 'info');
      return;
    }
    if (path.length < 3) {
      swal('Faltan puntos', 'Un territorio necesita al menos 3 puntos', 'info');
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        color: form.color,
        cordenadas: path,
      };
      const resp =
        modo === 'editar'
          ? await apiPost('actualizar_zona', { ...datos, idZona: idEditada })
          : await apiPost('registrar_polygono', datos);

      if (!resp.success) {
        swal('No se guardo', resp.error || '', 'warning');
        return;
      }

      limpiarTodo();
      setClientes([]);
      await cargar();
      swal('Zona guardada', `${resp.clientes} cliente(s) quedaron dentro del territorio`, 'success');
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const recalcular = async (zona) => {
    setRecalculando(true);
    try {
      const resp = await apiPost(
        'recalcular_zona_clientes',
        zona ? { idZona: zona.idZona } : {}
      );
      if (!resp.success) {
        swal('No se pudo recalcular', resp.error || '', 'warning');
        return;
      }

      const lineas = resp.zonas.map((z) => `${z.nombre}: ${z.clientes} cliente(s)`);
      if (resp.zonasInvalidas.length > 0) {
        lineas.push(
          `Sin poligono valido (no se tocaron): ${resp.zonasInvalidas
            .map((z) => z.nombre)
            .join(', ')}`
        );
      }
      lineas.push(`Sin zona: ${resp.clientesSinZona}`);
      if (resp.enVariasZonas.length > 0) {
        lineas.push(`En mas de una zona: ${resp.enVariasZonas.length}`);
      }

      await cargar();
      swal('Recalculo terminado', lineas.join('\n'), 'success');
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setRecalculando(false);
    }
  };

  const darDeBaja = async (zona) => {
    const confirmado = await swal({
      title: `Dar de baja "${zona.nombre}"?`,
      text: 'Las rutas ya generadas no se tocan, pero la zona deja de usarse para planificar.',
      icon: 'warning',
      buttons: ['Cancelar', 'Dar de baja'],
      dangerMode: true,
    });
    if (!confirmado) return;

    const resp = await apiPost('eliminar_zona', { idZona: zona.idZona });
    if (!resp.success) {
      swal('No se pudo', resp.error || '', 'warning');
      return;
    }
    if (zonaVista === zona.idZona) {
      setZonaVista(null);
      setClientes([]);
      setTotalDentro(null);
    }
    cargar();
  };

  const zonaActual = zonas.find((z) => z.idZona === zonaVista);

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="flex-end" mb={3}>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Vuelve a calcular que clientes caen dentro de cada zona">
            <span>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:sync-fill" />}
                onClick={() => recalcular(null)}
                disabled={recalculando}
              >
                {recalculando ? 'Recalculando...' : 'Recalcular todas'}
              </Button>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={nuevaZona}
            disabled={editando}
          >
            Nueva zona
          </Button>
        </Stack>
      </Stack>

      {resumen && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
          <Chip label={`${resumen.clientes} clientes`} />
          <Chip color="success" label={`${resumen.clientesConZona} con zona`} />
          <Chip
            color={resumen.clientesSinZona > 0 ? 'warning' : 'default'}
            label={`${resumen.clientesSinZona} sin zona`}
          />
          {resumen.enVariasZonas > 0 && (
            <Chip color="error" label={`${resumen.enVariasZonas} en mas de una zona`} />
          )}
        </Stack>
      )}

      {hayBorrador && !editando && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={recuperarBorrador}>
                Recuperar
              </Button>
              <Button
                size="small"
                color="inherit"
                onClick={() => {
                  localStorage.removeItem(BORRADOR);
                  setHayBorrador(false);
                }}
              >
                Descartar
              </Button>
            </Stack>
          }
        >
          Quedo un poligono a medio dibujar de una sesion anterior.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="subtitle1">Zonas</Typography>
            </CardContent>
            {cargando ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ZonasLista
                zonas={zonas}
                zonaVista={zonaVista}
                onVer={verClientes}
                onEditar={editarZona}
                onRecalcular={recalcular}
                onDarDeBaja={darDeBaja}
              />
            )}
          </Card>

          {totalDentro !== null && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  {editando ? 'Vista previa del territorio' : zonaActual && zonaActual.nombre}
                </Typography>
                <Typography variant="h4">{totalDentro}</Typography>
                <Typography variant="body2" color="text.secondary">
                  cliente(s) dentro del poligono
                </Typography>
                {clientes.length < totalDentro && (
                  <Typography variant="caption" color="text.secondary">
                    {`En el mapa se marcan los primeros ${clientes.length}`}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {editando ? (
                <>
                  <Stack
                    direction={{ xs: 'column', lg: 'row' }}
                    spacing={2}
                    alignItems={{ lg: 'center' }}
                    sx={{ mb: 2 }}
                  >
                    <TextField
                      label="Nombre"
                      size="small"
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    />
                    <TextField
                      label="Descripcion"
                      size="small"
                      value={form.descripcion}
                      onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    />
                    <ZonaColor
                      color={form.color}
                      onChange={(color) => setForm({ ...form, color })}
                    />
                  </Stack>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    Toca el mapa para marcar los vertices. Con 3 o mas puntos puedes arrastrarlos
                    para ajustar el borde.
                  </Alert>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                    <Chip label={`${path.length} punto(s)`} />
                    <Button
                      size="small"
                      startIcon={<Iconify icon="eva:undo-fill" />}
                      onClick={() => guardarBorrador(path.slice(0, -1))}
                      disabled={path.length === 0}
                    >
                      Quitar ultimo
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Iconify icon="eva:trash-2-outline" />}
                      onClick={() => guardarBorrador([])}
                      disabled={path.length === 0}
                    >
                      Limpiar
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Iconify icon="eva:people-fill" />}
                      onClick={previsualizar}
                    >
                      Ver clientes dentro
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                      size="small"
                      onClick={() => {
                        limpiarTodo();
                        setClientes([]);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={guardar}
                      disabled={guardando}
                    >
                      {guardando ? 'Guardando...' : 'Guardar zona'}
                    </Button>
                  </Stack>
                </>
              ) : (
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle1">Mapa de territorios</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Toca una zona para ver sus clientes
                  </Typography>
                </Stack>
              )}

              <Divider sx={{ mb: 2 }} />

              <ZonaMapa
                zonas={zonas}
                path={path}
                setPath={guardarBorrador}
                editando={editando}
                color={form.color}
                clientes={clientes}
                zonaVista={zonaVista}
                onSeleccionarZona={verClientes}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
