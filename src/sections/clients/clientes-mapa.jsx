import swal from 'sweetalert';
import { useState, useEffect, useCallback } from 'react';
import { Marker, Polygon, GoogleMap, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

import {
  Box,
  Card,
  Chip,
  Stack,
  Alert,
  Select,
  MenuItem,
  TextField,
  InputLabel,
  Typography,
  FormControl,
  CircularProgress,
} from '@mui/material';

import { apiPost } from 'src/api/client';

import Iconify from 'src/components/iconify';

const CENTRO_MAPA = { lat: -17.785971, lng: -63.1774265 };

const SIN_ZONA = 'sin_zona';

const tieneCoordenada = (cliente) =>
  cliente.latitude !== null &&
  cliente.longitude !== null &&
  !Number.isNaN(parseFloat(cliente.latitude)) &&
  !Number.isNaN(parseFloat(cliente.longitude));

const puntoDe = (cliente) => ({
  lat: parseFloat(cliente.latitude),
  lng: parseFloat(cliente.longitude),
});

export default function ClientesMapa() {
  const [cargando, setCargando] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [zonaSel, setZonaSel] = useState('todas');
  const [filtro, setFiltro] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  const buscar = useCallback(async () => {
    setCargando(true);
    try {
      // obtener_clientes esta limitado a 20 registros; el mapa necesita todos
      const resp = await apiPost('obtener_todos_clientes');
      setClientes(resp.clientes || []);
      setZonas(resp.polygonos || []);
    } catch (err) {
      swal('No se pudieron cargar los clientes', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    buscar();
  }, [buscar]);

  if (cargando || !isLoaded) {
    return (
      <Card sx={{ p: 5, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  // Un cliente puede estar en varias zonas; para el filtro basta con saber a cuales
  const zonasPorCliente = {};
  zonas.forEach((zona) => {
    (zona.clientes || []).forEach((cli) => {
      if (!zonasPorCliente[cli.id]) zonasPorCliente[cli.id] = [];
      zonasPorCliente[cli.id].push(zona);
    });
  });

  const texto = filtro.trim().toLowerCase();

  const coincideBusqueda = (cliente) =>
    !texto ||
    `${cliente.nombre} ${cliente.apellido || ''} ${cliente.celular || ''} ${
      cliente.tipo_negocio || ''
    }`
      .toLowerCase()
      .includes(texto);

  const coincideZona = (cliente) => {
    if (zonaSel === 'todas') return true;
    const suyas = zonasPorCliente[cliente.id] || [];
    if (zonaSel === SIN_ZONA) return suyas.length === 0;
    return suyas.some((z) => String(z.idZona) === String(zonaSel));
  };

  const filtrados = clientes.filter((c) => coincideBusqueda(c) && coincideZona(c));
  const ubicados = filtrados.filter(tieneCoordenada);
  const sinUbicacion = filtrados.length - ubicados.length;

  const zonasVisibles =
    zonaSel === 'todas' || zonaSel === SIN_ZONA
      ? zonas
      : zonas.filter((z) => String(z.idZona) === String(zonaSel));

  const centro = ubicados.length > 0 ? puntoDe(ubicados[0]) : CENTRO_MAPA;

  return (
    <Card sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'center' }}
        mb={2}
      >
        <TextField
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar por nombre, celular o negocio..."
          size="small"
          sx={{ width: { xs: '100%', sm: 320 } }}
          InputProps={{
            startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, opacity: 0.6 }} />,
          }}
        />

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Zona</InputLabel>
          <Select label="Zona" value={zonaSel} onChange={(e) => setZonaSel(e.target.value)}>
            <MenuItem value="todas">Todas las zonas</MenuItem>
            {zonas.map((z) => (
              <MenuItem key={z.idZona} value={z.idZona}>
                {z.nombre}
              </MenuItem>
            ))}
            <MenuItem value={SIN_ZONA}>Sin zona asignada</MenuItem>
          </Select>
        </FormControl>

        <Chip size="small" label={`${ubicados.length} en el mapa`} />
      </Stack>

      {sinUbicacion > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {`${sinUbicacion} cliente(s) no aparecen porque no tienen coordenadas cargadas.`}
        </Alert>
      )}

      <Box sx={{ borderRadius: 1, overflow: 'hidden' }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '600px' }}
          center={centro}
          zoom={12}
          onClick={() => setSeleccionado(null)}
        >
          {zonasVisibles.map((zona) => {
            let vertices = [];
            try {
              vertices = JSON.parse(zona.cordenadas);
            } catch (err) {
              // Zona con coordenadas corruptas: se omite en vez de romper el mapa
              vertices = [];
            }
            if (vertices.length === 0) return null;
            return (
              <Polygon
                key={`zona-${zona.idZona}`}
                paths={vertices}
                options={{
                  fillColor: zona.color || '#000000',
                  fillOpacity: 0.12,
                  strokeColor: zona.color || '#000000',
                  strokeWeight: 2,
                }}
              />
            );
          })}

          {ubicados.map((cliente) => (
            <Marker
              key={`cliente-${cliente.id}`}
              position={puntoDe(cliente)}
              title={`${cliente.nombre} ${cliente.apellido || ''}`}
              onClick={() => setSeleccionado(cliente)}
            />
          ))}

          {seleccionado && tieneCoordenada(seleccionado) && (
            <InfoWindow
              position={puntoDe(seleccionado)}
              onCloseClick={() => setSeleccionado(null)}
            >
              <Box sx={{ minWidth: 180 }}>
                <Typography variant="subtitle2">
                  {`${seleccionado.nombre} ${seleccionado.apellido || ''}`}
                </Typography>
                {seleccionado.celular && (
                  <Typography variant="body2">{seleccionado.celular}</Typography>
                )}
                {seleccionado.tipo_negocio && (
                  <Typography variant="body2" color="text.secondary">
                    {seleccionado.tipo_negocio}
                  </Typography>
                )}
                {seleccionado.frecuencia && (
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    {`Visita: ${seleccionado.frecuencia}`}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" display="block">
                  {(zonasPorCliente[seleccionado.id] || []).map((z) => z.nombre).join(', ') ||
                    'Sin zona asignada'}
                </Typography>
              </Box>
            </InfoWindow>
          )}
        </GoogleMap>
      </Box>
    </Card>
  );
}
