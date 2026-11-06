import swal from 'sweetalert';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';
import { Marker, GoogleMap, useJsApiLoader } from '@react-google-maps/api';

import {
  Box,
  Card,
  Chip,
  Grid,
  List,
  Alert,
  Stack,
  Button,
  Dialog,
  Divider,
  Checkbox,
  ListItem,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  ListItemText,
  DialogActions,
  DialogContent,
  ListItemButton,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';

import { apiPost } from 'src/api/client';

import Iconify from 'src/components/iconify';

const CENTRO_MAPA = { lat: -17.785971, lng: -63.1774265 };

const ICONO_NUEVO = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';

const tieneCoordenada = (cliente) =>
  cliente &&
  !Number.isNaN(parseFloat(cliente.latitude)) &&
  !Number.isNaN(parseFloat(cliente.longitude));

const puntoDe = (cliente) => ({
  lat: parseFloat(cliente.latitude),
  lng: parseFloat(cliente.longitude),
});

const nombreDe = (cliente) => `${cliente.nombre} ${cliente.apellido || ''}`.trim();

export default function AgregarParadaDialog({
  idRutaDia,
  paradas,
  abierto,
  onCerrar,
  onGuardado,
}) {
  const [cargando, setCargando] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [fueraDeZona, setFueraDeZona] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [texto, setTexto] = useState('');
  const [total, setTotal] = useState(0);
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  // La lista se arma en la base (casi 18 mil clientes), asi que la busqueda se manda al backend
  useEffect(() => {
    const id = setTimeout(() => setTexto(filtro.trim()), 400);
    return () => clearTimeout(id);
  }, [filtro]);

  const buscar = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await apiPost('obtener_clientes_disponibles', {
        idRutaDia,
        todos: fueraDeZona,
        buscar: texto,
      });
      setClientes(resp.clientes || []);
      setTotal(resp.total || 0);
      setAviso(
        resp.zonaSinDisponibles
          ? 'La zona de esta ruta no tiene clientes disponibles, se muestran todos los clientes.'
          : ''
      );
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, [idRutaDia, fueraDeZona, texto]);

  useEffect(() => {
    if (!abierto) return;
    buscar();
  }, [abierto, buscar]);

  useEffect(() => {
    if (abierto) setSeleccionados([]);
  }, [abierto]);

  const agregar = (cliente) => {
    setSeleccionados((prev) =>
      prev.some((c) => c.id === cliente.id) ? prev : [...prev, cliente]
    );
  };

  const quitar = (id) => {
    setSeleccionados((prev) => prev.filter((c) => c.id !== id));
  };

  const guardar = async () => {
    if (seleccionados.length === 0) {
      swal('Sin seleccion', 'Elige al menos un cliente', 'warning');
      return;
    }
    setGuardando(true);
    try {
      // Se agregan de a uno para respetar el correlativo de orden del backend
      const fallidos = [];
      /* eslint-disable no-await-in-loop */
      for (let i = 0; i < seleccionados.length; i += 1) {
        const resp = await apiPost('agregar_parada', {
          idRutaDia,
          idCliente: seleccionados[i].id,
        });
        if (!resp.success) fallidos.push(seleccionados[i]);
      }
      /* eslint-enable no-await-in-loop */

      if (fallidos.length > 0) {
        swal(
          'Algunas no se agregaron',
          `${fallidos.length} de ${seleccionados.length} fallaron`,
          'warning'
        );
      }
      onGuardado();
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // El backend ya excluye las paradas guardadas; falta descartar lo elegido en esta pasada
  const disponibles = clientes.filter((c) => !seleccionados.some((s) => s.id === c.id));

  // Panel derecho: lo que ya esta en la ruta mas lo que se va a agregar
  const enRuta = paradas
    .filter((p) => p.cliente)
    .map((p) => ({ ...p.cliente, idRutaParada: p.idRutaParada, guardada: true }));
  const enLaRuta = [...enRuta, ...seleccionados.map((c) => ({ ...c, guardada: false }))];
  const ubicados = enLaRuta.filter(tieneCoordenada);
  const sinUbicacion = enLaRuta.length - ubicados.length;

  const ajustarMapa = (mapa) => {
    if (ubicados.length === 0) return;
    const limites = new window.google.maps.LatLngBounds();
    ubicados.forEach((c) => limites.extend(puntoDe(c)));
    mapa.fitBounds(limites);
  };

  return (
    <Dialog open={abierto} onClose={onCerrar} fullWidth maxWidth="lg">
      <DialogTitle>Agregar paradas</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Clientes sin agregar
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Buscar por nombre, celular o negocio"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                size="small"
                fullWidth
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={fueraDeZona}
                    onChange={(e) => setFueraDeZona(e.target.checked)}
                  />
                }
                label="Mostrar clientes fuera de la zona"
              />

              {aviso && <Alert severity="info">{aviso}</Alert>}

              {!cargando && total > clientes.length && (
                <Alert severity="warning">
                  {`Se muestran ${clientes.length} de ${total} clientes. Usa la busqueda para encontrar el que necesitas.`}
                </Alert>
              )}

              <Divider />

              {cargando ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List dense sx={{ height: 300, overflow: 'auto', py: 0 }}>
                  {disponibles.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 3 }}
                      align="center"
                    >
                      No hay clientes disponibles para agregar.
                    </Typography>
                  )}
                  {disponibles.map((cliente) => (
                    <ListItem
                      key={cliente.id}
                      disablePadding
                      secondaryAction={
                        <IconButton edge="end" size="small" onClick={() => agregar(cliente)}>
                          <Iconify icon="eva:arrow-forward-fill" />
                        </IconButton>
                      }
                    >
                      <ListItemButton onClick={() => agregar(cliente)}>
                        <ListItemText
                          primary={nombreDe(cliente)}
                          secondary={
                            tieneCoordenada(cliente)
                              ? cliente.celular || 'sin celular'
                              : `${cliente.celular || 'sin celular'} · sin ubicacion`
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {`Clientes en la ruta (${enLaRuta.length})`}
            </Typography>

            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {seleccionados.length > 0
                  ? `${seleccionados.length} por agregar, ${enRuta.length} ya guardada(s)`
                  : `${enRuta.length} parada(s) guardada(s)`}
              </Typography>

              <Divider />

              <List dense sx={{ height: 300, overflow: 'auto', py: 0 }}>
                {enLaRuta.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }} align="center">
                    Esta ruta todavia no tiene paradas.
                  </Typography>
                )}
                {enLaRuta.map((cliente) => (
                  <ListItem
                    key={`${cliente.guardada ? 'p' : 'n'}-${cliente.id}`}
                    secondaryAction={
                      cliente.guardada ? (
                        <Chip size="small" label="en ruta" />
                      ) : (
                        <IconButton edge="end" size="small" onClick={() => quitar(cliente.id)}>
                          <Iconify icon="eva:close-fill" />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemText
                      primary={nombreDe(cliente)}
                      secondary={
                        tieneCoordenada(cliente)
                          ? cliente.celular || 'sin celular'
                          : `${cliente.celular || 'sin celular'} · sin ubicacion`
                      }
                      primaryTypographyProps={{
                        color: cliente.guardada ? 'text.primary' : 'success.dark',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle2">Ubicacion de los clientes de la ruta</Typography>
                <Stack direction="row" spacing={1}>
                  <Chip size="small" label={`${enRuta.length} en ruta`} />
                  <Chip
                    size="small"
                    color="success"
                    label={`${seleccionados.length} por agregar`}
                  />
                </Stack>
              </Stack>

              {sinUbicacion > 0 && (
                <Alert severity="info" sx={{ mb: 1 }}>
                  {`${sinUbicacion} cliente(s) no aparecen en el mapa porque no tienen coordenadas.`}
                </Alert>
              )}

              {isLoaded ? (
                <Box sx={{ borderRadius: 1, overflow: 'hidden' }}>
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '300px' }}
                    center={ubicados.length > 0 ? puntoDe(ubicados[0]) : CENTRO_MAPA}
                    zoom={12}
                    onLoad={ajustarMapa}
                  >
                    {ubicados.map((cliente) => (
                      <Marker
                        key={`m-${cliente.guardada ? 'p' : 'n'}-${cliente.id}`}
                        position={puntoDe(cliente)}
                        title={`${nombreDe(cliente)}${cliente.guardada ? '' : ' (por agregar)'}`}
                        icon={cliente.guardada ? undefined : ICONO_NUEVO}
                      />
                    ))}
                  </GoogleMap>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                  <CircularProgress />
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCerrar}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={guardando}>
          {guardando ? 'Agregando...' : `Agregar (${seleccionados.length})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AgregarParadaDialog.propTypes = {
  idRutaDia: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  paradas: PropTypes.array,
  abierto: PropTypes.bool.isRequired,
  onCerrar: PropTypes.func.isRequired,
  onGuardado: PropTypes.func.isRequired,
};

AgregarParadaDialog.defaultProps = {
  paradas: [],
};
