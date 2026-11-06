import swal from 'sweetalert';
import PropTypes from 'prop-types';
import { useJsApiLoader } from '@react-google-maps/api';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Table,
  Stack,
  Button,
  Switch,
  Divider,
  Tooltip,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  CardContent,
  TableContainer,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { apiPost } from 'src/api/client';

import Iconify from 'src/components/iconify';

import ParadaDialog from './parada-dialog';
import RecorridoMapa from './recorrido-mapa';
import EntregaDialog from './entrega-dialog';
import { ETIQUETA_PARADA } from './entregas';
import RendicionDialog from './rendicion-dialog';
import AgregarParadaDialog from './agregar-parada-dialog';
import CargaRutaDialog from '../inventario/carga-ruta-dialog';

const CENTRO_MAPA = { lat: -17.785971, lng: -63.1774265 };

// Limite de waypoints que la Directions API optimiza en una sola peticion
const MAX_WAYPOINTS_OPTIMIZABLES = 25;

const etiquetaParada = (parada) =>
  ETIQUETA_PARADA[parada.estado] || { texto: parada.estado, color: 'default' };

const esCoordenadaValida = (parada) =>
  parada.cliente &&
  !Number.isNaN(parseFloat(parada.cliente.latitude)) &&
  !Number.isNaN(parseFloat(parada.cliente.longitude));

export default function RutaDetalle({ idRutaDia, onVolver }) {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [ruta, setRuta] = useState(null);
  const [paradas, setParadas] = useState([]);
  const [hayCambios, setHayCambios] = useState(false);
  const [paradaEditada, setParadaEditada] = useState(null);
  const [paradaEntrega, setParadaEntrega] = useState(null);
  const [agregando, setAgregando] = useState(false);
  const [verCarga, setVerCarga] = useState(false);
  const [verRendicion, setVerRendicion] = useState(false);
  const [volverAlDeposito, setVolverAlDeposito] = useState(true);
  const [optimizando, setOptimizando] = useState(false);
  const [arrastrando, setArrastrando] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  const buscar = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await apiPost('obtener_ruta_dia', { idRutaDia });
      if (!resp.success) {
        swal('Error', resp.error || 'No se encontro la ruta', 'error');
        return;
      }
      setRuta(resp.ruta);
      setParadas(resp.ruta.paradas || []);
      setHayCambios(false);
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, [idRutaDia]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  // Reordenar en memoria; se persiste al pulsar "Guardar orden"
  const mover = (indice, direccion) => {
    const destino = indice + direccion;
    if (destino < 0 || destino >= paradas.length) return;

    const copia = [...paradas];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    setParadas(copia);
    setHayCambios(true);
  };

  // Arrastrar filas: alternativa comoda a los botones para recorridos largos
  const soltarSobre = (indiceDestino) => {
    if (arrastrando === null || arrastrando === indiceDestino) {
      setArrastrando(null);
      return;
    }
    const copia = [...paradas];
    const [movida] = copia.splice(arrastrando, 1);
    copia.splice(indiceDestino, 0, movida);
    setParadas(copia);
    setHayCambios(true);
    setArrastrando(null);
  };

  /**
   * Deja que Google resuelva el mejor orden de visita (problema del viajante).
   * Solo reordena en memoria: el planificador revisa y luego guarda.
   */
  const optimizarRecorrido = async () => {
    const conCoordenada = paradas.filter(esCoordenadaValida);
    if (conCoordenada.length < 2) {
      swal('Nada que optimizar', 'Se necesitan al menos 2 paradas con coordenadas', 'info');
      return;
    }
    if (conCoordenada.length > MAX_WAYPOINTS_OPTIMIZABLES) {
      swal(
        'Demasiadas paradas',
        `Google optimiza hasta ${MAX_WAYPOINTS_OPTIMIZABLES} paradas por recorrido. ` +
          'Divide la zona en dos rutas o acomoda el orden a mano.',
        'warning'
      );
      return;
    }

    setOptimizando(true);
    try {
      const servicio = new window.google.maps.DirectionsService();
      const resultado = await servicio.route({
        origin: CENTRO_MAPA,
        destination: volverAlDeposito
          ? CENTRO_MAPA
          : {
              lat: parseFloat(conCoordenada[conCoordenada.length - 1].cliente.latitude),
              lng: parseFloat(conCoordenada[conCoordenada.length - 1].cliente.longitude),
            },
        waypoints: (volverAlDeposito ? conCoordenada : conCoordenada.slice(0, -1)).map((p) => ({
          location: {
            lat: parseFloat(p.cliente.latitude),
            lng: parseFloat(p.cliente.longitude),
          },
          stopover: true,
        })),
        optimizeWaypoints: true,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });

      const orden = resultado.routes[0].waypoint_order || [];
      const base = volverAlDeposito ? conCoordenada : conCoordenada.slice(0, -1);
      const reordenadas = orden.map((i) => base[i]);

      // La ultima parada fija (si no se vuelve al deposito) y las que no tienen
      // coordenadas no entran en el calculo, pero deben seguir en la ruta
      if (!volverAlDeposito) reordenadas.push(conCoordenada[conCoordenada.length - 1]);
      const sinCoordenada = paradas.filter((p) => !esCoordenadaValida(p));

      setParadas([...reordenadas, ...sinCoordenada]);
      setHayCambios(true);
      swal('Recorrido optimizado', 'Revisa el orden y pulsa "Guardar orden"', 'success');
    } catch (err) {
      swal('No se pudo optimizar', 'Revisa la API key y la cuota de Directions', 'error');
    } finally {
      setOptimizando(false);
    }
  };

  const guardarOrden = async () => {
    setGuardando(true);
    try {
      const resp = await apiPost('actualizar_orden_paradas', {
        idRutaDia,
        paradas: paradas.map((p, i) => ({ idRutaParada: p.idRutaParada, orden: i + 1 })),
      });
      if (!resp.success) {
        swal('Error', resp.error || 'No se pudo guardar el orden', 'error');
        return;
      }
      setHayCambios(false);
      swal('Orden guardado', '', 'success');
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Editar o agregar recarga la ruta, asi que un reordenamiento sin guardar se perderia
  const confirmarDescartarOrden = async () => {
    if (!hayCambios) return true;
    const seguir = await swal({
      title: 'Tienes un orden sin guardar',
      text: 'Si continuas se descartara. Guarda el orden primero si quieres conservarlo.',
      icon: 'warning',
      buttons: ['Cancelar', 'Continuar'],
    });
    return Boolean(seguir);
  };

  const abrirEdicion = async (parada) => {
    if (await confirmarDescartarOrden()) setParadaEditada(parada);
  };

  const abrirAgregar = async () => {
    if (await confirmarDescartarOrden()) setAgregando(true);
  };

  const quitarParada = async (parada) => {
    const confirmado = await swal({
      title: 'Quitar esta parada de la ruta?',
      icon: 'warning',
      buttons: true,
      dangerMode: true,
    });
    if (!confirmado) return;

    const resp = await apiPost('eliminar_parada', { idRutaParada: parada.idRutaParada });
    if (resp.success) {
      buscar();
    } else {
      swal('No se pudo quitar', resp.error || '', 'warning');
    }
  };

  const cambiarEstadoRuta = async (estado) => {
    const resp = await apiPost('cambiar_estado_ruta_dia', { idRutaDia, estado });
    if (resp.success) buscar();
  };

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!ruta) return null;

  // El mapa solo puede trazar las paradas geolocalizadas
  const paradasConCoordenada = paradas.filter(esCoordenadaValida);

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={onVolver}>
            <Iconify icon="eva:arrow-back-fill" />
          </IconButton>
          <Box>
            <Typography variant="h5">
              {ruta.zona ? ruta.zona.nombre : 'Ruta'} — {ruta.fecha}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {ruta.funcionario
                ? `${ruta.funcionario.nombre} ${ruta.funcionario.apellido || ''}`
                : 'Sin repartidor asignado'}
              {ruta.vehiculo ? ` · ${ruta.vehiculo.placa}` : ''}
            </Typography>
          </Box>
          <Chip label={ruta.estado} size="small" />
        </Stack>

        <Stack direction="row" spacing={1}>
          {ruta.estado === 'planificada' && (
            <Button variant="outlined" onClick={() => cambiarEstadoRuta('en_curso')}>
              Iniciar ruta
            </Button>
          )}
          {ruta.estado === 'en_curso' && (
            <Button variant="outlined" color="success" onClick={() => cambiarEstadoRuta('cerrada')}>
              Cerrar ruta
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={abrirAgregar}
          >
            Agregar paradas
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:cube-outline" />}
            onClick={() => setVerCarga(true)}
          >
            Carga del camion
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:credit-card-outline" />}
            onClick={() => setVerRendicion(true)}
          >
            Cobros
          </Button>
          <Tooltip title="Google calcula el orden de visita mas corto">
            <span>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<Iconify icon="eva:flash-fill" />}
                onClick={optimizarRecorrido}
                disabled={optimizando || !isLoaded}
              >
                {optimizando ? 'Optimizando...' : 'Optimizar recorrido'}
              </Button>
            </span>
          </Tooltip>
          <Button variant="contained" onClick={guardarOrden} disabled={!hayCambios || guardando}>
            {guardando ? 'Guardando...' : 'Guardar orden'}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={60}>#</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Celular</TableCell>
                    <TableCell>Pedido</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Orden</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        Esta ruta no tiene paradas.
                      </TableCell>
                    </TableRow>
                  )}
                  {paradas.map((parada, indice) => (
                    <TableRow
                      key={parada.idRutaParada}
                      hover
                      draggable
                      onDragStart={() => setArrastrando(indice)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => soltarSobre(indice)}
                      sx={{
                        cursor: 'grab',
                        opacity: arrastrando === indice ? 0.4 : 1,
                      }}
                    >
                      <TableCell>{indice + 1}</TableCell>
                      <TableCell>
                        {parada.cliente
                          ? `${parada.cliente.nombre} ${parada.cliente.apellido || ''}`
                          : `Cliente ${parada.idCliente}`}
                        {!esCoordenadaValida(parada) && (
                          <Typography variant="caption" color="error" display="block">
                            sin coordenadas
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{parada.cliente ? parada.cliente.celular : '-'}</TableCell>
                      <TableCell>
                        {parada.pedido ? (
                          <Typography variant="caption">{parada.pedido.codigo}</Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            visita
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={etiquetaParada(parada).texto}
                          color={etiquetaParada(parada).color}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip
                          title={
                            parada.estado === 'pendiente'
                              ? 'Registrar lo que recibio el cliente'
                              : 'Ver la entrega registrada'
                          }
                        >
                          <IconButton
                            size="small"
                            color={parada.estado === 'pendiente' ? 'primary' : 'default'}
                            onClick={() => setParadaEntrega(parada)}
                          >
                            <Iconify icon="eva:checkmark-circle-2-outline" />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          disabled={indice === 0}
                          onClick={() => mover(indice, -1)}
                        >
                          <Iconify icon="eva:arrow-upward-fill" />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={indice === paradas.length - 1}
                          onClick={() => mover(indice, 1)}
                        >
                          <Iconify icon="eva:arrow-downward-fill" />
                        </IconButton>
                        <IconButton size="small" onClick={() => abrirEdicion(parada)}>
                          <Iconify icon="eva:edit-fill" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={parada.estado !== 'pendiente'}
                          onClick={() => quitarParada(parada)}
                        >
                          <Iconify icon="eva:close-fill" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
              >
                <Typography variant="subtitle1">Recorrido</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={volverAlDeposito}
                      onChange={(e) => setVolverAlDeposito(e.target.checked)}
                    />
                  }
                  label={<Typography variant="body2">Regresar al deposito</Typography>}
                />
              </Stack>
              <Divider sx={{ mb: 2 }} />
              {isLoaded ? (
                <RecorridoMapa
                  deposito={CENTRO_MAPA}
                  paradas={paradasConCoordenada}
                  volverAlDeposito={volverAlDeposito}
                />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                  <CircularProgress />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ParadaDialog
        parada={paradaEditada}
        totalParadas={paradas.length}
        abierto={Boolean(paradaEditada)}
        onCerrar={() => setParadaEditada(null)}
        onGuardado={() => {
          setParadaEditada(null);
          buscar();
        }}
      />

      <EntregaDialog
        idRutaParada={paradaEntrega ? paradaEntrega.idRutaParada : null}
        abierto={Boolean(paradaEntrega)}
        permitirCorreccion
        onCerrar={() => setParadaEntrega(null)}
        onGuardado={() => {
          setParadaEntrega(null);
          buscar();
        }}
      />

      <CargaRutaDialog
        idRutaDia={idRutaDia}
        abierto={verCarga}
        onCerrar={() => setVerCarga(false)}
        onGuardado={buscar}
      />

      <RendicionDialog
        idRutaDia={idRutaDia}
        abierto={verRendicion}
        onCerrar={() => setVerRendicion(false)}
        onGuardado={buscar}
      />

      <AgregarParadaDialog
        idRutaDia={idRutaDia}
        paradas={paradas}
        abierto={agregando}
        onCerrar={() => setAgregando(false)}
        onGuardado={() => {
          setAgregando(false);
          buscar();
        }}
      />
    </>
  );
}

RutaDetalle.propTypes = {
  idRutaDia: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onVolver: PropTypes.func.isRequired,
};
