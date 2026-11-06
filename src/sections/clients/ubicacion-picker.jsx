import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import { Marker, GoogleMap, useJsApiLoader } from '@react-google-maps/api';

import { Box, Grid, Alert, Stack, Button, TextField, Typography, CircularProgress } from '@mui/material';

import Iconify from 'src/components/iconify';

const CENTRO_MAPA = { lat: -17.785971, lng: -63.1774265 };

const esNumero = (valor) =>
  valor !== null && valor !== undefined && String(valor).trim() !== '' && !Number.isNaN(parseFloat(valor));

/**
 * Selector de ubicacion: se puede tocar el mapa, arrastrar el marcador,
 * escribir las coordenadas a mano o tomar la ubicacion actual del navegador.
 */
export default function UbicacionPicker({ latitude, longitude, onChange }) {
  const [error, setError] = useState('');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  const tieneCoordenada = esNumero(latitude) && esNumero(longitude);
  const punto = tieneCoordenada
    ? { lat: parseFloat(latitude), lng: parseFloat(longitude) }
    : null;

  // 6 decimales ~ 10cm de precision; mas solo agrega ruido
  const fijar = useCallback(
    (lat, lng) => {
      setError('');
      onChange(lat.toFixed(6), lng.toFixed(6));
    },
    [onChange]
  );

  const handleMapClick = (event) => {
    fijar(event.latLng.lat(), event.latLng.lng());
  };

  const usarUbicacionActual = () => {
    if (!navigator.geolocation) {
      setError('Este navegador no permite obtener la ubicacion actual.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fijar(pos.coords.latitude, pos.coords.longitude),
      () => setError('No se pudo obtener la ubicacion actual. Revisa los permisos del navegador.')
    );
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography variant="subtitle2">Ubicacion</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<Iconify icon="eva:navigation-2-fill" />}
            onClick={usarUbicacionActual}
          >
            Mi ubicacion
          </Button>
          {tieneCoordenada && (
            <Button
              size="small"
              color="error"
              startIcon={<Iconify icon="eva:close-circle-fill" />}
              onClick={() => onChange('', '')}
            >
              Quitar
            </Button>
          )}
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            sx={{ width: '100%' }}
            label="Latitud"
            variant="outlined"
            size="small"
            value={latitude ?? ''}
            onChange={(e) => onChange(e.target.value, longitude ?? '')}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            sx={{ width: '100%' }}
            label="Longitud"
            variant="outlined"
            size="small"
            value={longitude ?? ''}
            onChange={(e) => onChange(latitude ?? '', e.target.value)}
          />
        </Grid>
      </Grid>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!tieneCoordenada && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Toca el mapa para marcar la ubicacion del cliente.
        </Alert>
      )}

      {!isLoaded ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ borderRadius: 1, overflow: 'hidden' }}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '320px' }}
            center={punto || CENTRO_MAPA}
            zoom={punto ? 16 : 12}
            onClick={handleMapClick}
          >
            {punto && (
              <Marker
                position={punto}
                draggable
                onDragEnd={(event) => fijar(event.latLng.lat(), event.latLng.lng())}
              />
            )}
          </GoogleMap>
        </Box>
      )}
    </Box>
  );
}

UbicacionPicker.propTypes = {
  latitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  longitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
};
