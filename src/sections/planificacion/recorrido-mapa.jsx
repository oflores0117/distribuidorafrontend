import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';
import { Marker, GoogleMap, DirectionsRenderer } from '@react-google-maps/api';

import { Box, Chip, Stack, Alert, Typography, CircularProgress } from '@mui/material';

// La Directions API acepta 25 puntos por peticion (origen + 23 intermedios + destino),
// por eso el recorrido se parte en tramos encadenados.
const MAX_PUNTOS_TRAMO = 25;

const COLOR_TRAMO = '#1976d2';

const formatearDuracion = (segundos) => {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.round((segundos % 3600) / 60);
  return horas > 0 ? `${horas} h ${minutos} min` : `${minutos} min`;
};

/**
 * Parte la lista de puntos en tramos solapados: el ultimo punto de un tramo
 * es el primero del siguiente, para que el trazado quede continuo.
 */
const partirEnTramos = (puntos) => {
  if (puntos.length <= MAX_PUNTOS_TRAMO) return [puntos];

  const tramos = [];
  let inicio = 0;
  while (inicio < puntos.length - 1) {
    const fin = Math.min(inicio + MAX_PUNTOS_TRAMO - 1, puntos.length - 1);
    tramos.push(puntos.slice(inicio, fin + 1));
    inicio = fin;
  }
  return tramos;
};

export default function RecorridoMapa({ deposito, paradas, volverAlDeposito, onRutaCalculada }) {
  const [tramos, setTramos] = useState([]);
  const [calculando, setCalculando] = useState(false);
  const [error, setError] = useState(null);
  const [resumen, setResumen] = useState(null);

  const puntosParada = paradas.map((p) => ({
    lat: parseFloat(p.cliente.latitude),
    lng: parseFloat(p.cliente.longitude),
  }));

  // Se serializa para que el efecto solo reaccione a cambios reales del recorrido
  const firmaRecorrido = JSON.stringify([puntosParada, volverAlDeposito, deposito]);

  const calcular = useCallback(async () => {
    if (puntosParada.length === 0) {
      setTramos([]);
      setResumen(null);
      return;
    }

    setCalculando(true);
    setError(null);

    const secuencia = [deposito, ...puntosParada];
    if (volverAlDeposito) secuencia.push(deposito);

    const servicio = new window.google.maps.DirectionsService();

    try {
      const resultados = [];
      let metros = 0;
      let segundos = 0;

      // Los tramos se piden en serie: encadenados, no son independientes
      /* eslint-disable no-await-in-loop */
      const listaTramos = partirEnTramos(secuencia);
      for (let i = 0; i < listaTramos.length; i += 1) {
        const tramo = listaTramos[i];
        const resultado = await servicio.route({
          origin: tramo[0],
          destination: tramo[tramo.length - 1],
          waypoints: tramo.slice(1, -1).map((punto) => ({ location: punto, stopover: true })),
          // El orden lo decide el planificador; aqui solo se traza
          optimizeWaypoints: false,
          travelMode: window.google.maps.TravelMode.DRIVING,
        });

        resultados.push(resultado);
        const {legs} = resultado.routes[0];
        for (let j = 0; j < legs.length; j += 1) {
          metros += legs[j].distance ? legs[j].distance.value : 0;
          segundos += legs[j].duration ? legs[j].duration.value : 0;
        }
      }
      /* eslint-enable no-await-in-loop */

      setTramos(resultados);
      const nuevoResumen = { km: metros / 1000, duracion: segundos };
      setResumen(nuevoResumen);
      if (onRutaCalculada) onRutaCalculada(nuevoResumen);
    } catch (err) {
      // Sin cuota o sin camino posible: se avisa en vez de dejar el mapa vacio
      setError(
        err && err.code === 'ZERO_RESULTS'
          ? 'No hay un camino por carretera entre estas paradas.'
          : 'No se pudo trazar el recorrido. Revisa la API key y la cuota de Directions.'
      );
      setTramos([]);
      setResumen(null);
    } finally {
      setCalculando(false);
    }
    // firmaRecorrido cubre puntosParada/deposito/volverAlDeposito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmaRecorrido, onRutaCalculada]);

  useEffect(() => {
    calcular();
  }, [calcular]);

  const centro = puntosParada.length > 0 ? puntosParada[0] : deposito;

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center" mb={2} flexWrap="wrap" useFlexGap>
        {calculando && <CircularProgress size={18} />}
        {resumen && (
          <>
            <Chip size="small" label={`${resumen.km.toFixed(1)} km`} />
            <Chip size="small" label={formatearDuracion(resumen.duracion)} />
            <Typography variant="caption" color="text.secondary">
              tiempo de manejo, sin contar la atencion en cada parada
            </Typography>
          </>
        )}
      </Stack>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ position: 'relative' }}>
        <GoogleMap mapContainerStyle={{ width: '100%', height: '480px' }} center={centro} zoom={13}>
          <Marker position={deposito} label="D" title="Deposito" />

          {puntosParada.map((punto, i) => (
            <Marker
              // El indice es el numero de parada dentro del recorrido
              key={`parada-${i + 1}`}
              position={punto}
              label={`${i + 1}`}
              title={
                paradas[i].cliente
                  ? `${paradas[i].cliente.nombre} ${paradas[i].cliente.apellido || ''}`
                  : ''
              }
            />
          ))}

          {tramos.map((tramo, i) => (
            <DirectionsRenderer
              key={`tramo-${i + 1}`}
              directions={tramo}
              options={{
                // Los marcadores numerados propios ya indican el orden
                suppressMarkers: true,
                preserveViewport: true,
                polylineOptions: { strokeColor: COLOR_TRAMO, strokeWeight: 4, strokeOpacity: 0.8 },
              }}
            />
          ))}
        </GoogleMap>
      </Box>
    </>
  );
}

RecorridoMapa.propTypes = {
  deposito: PropTypes.shape({ lat: PropTypes.number, lng: PropTypes.number }).isRequired,
  paradas: PropTypes.array.isRequired,
  volverAlDeposito: PropTypes.bool,
  onRutaCalculada: PropTypes.func,
};
