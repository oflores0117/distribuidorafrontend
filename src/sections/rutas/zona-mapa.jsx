import PropTypes from 'prop-types';
import { useRef, useCallback } from 'react';
import { Marker, Polygon, Polyline, GoogleMap, useJsApiLoader } from '@react-google-maps/api';

import { Box, CircularProgress } from '@mui/material';

const CENTRO_MAPA = { lat: -17.785971, lng: -63.1774265 };

const ICONO_CLIENTE = {
  path: 0, // google.maps.SymbolPath.CIRCLE
  scale: 4,
  fillOpacity: 0.9,
  strokeWeight: 1,
};

/**
 * Mapa de territorios: dibuja las zonas guardadas y, en modo edicion, el
 * poligono en curso con los vertices arrastrables.
 */
export default function ZonaMapa({
  zonas,
  path,
  setPath,
  editando,
  color,
  clientes,
  zonaVista,
  onSeleccionarZona,
}) {
  const poligonoRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  const agregarPunto = (evento) => {
    if (!editando) return;
    setPath([...path, { lat: evento.latLng.lat(), lng: evento.latLng.lng() }]);
  };

  // Al arrastrar un vertice hay que leerlos del poligono, no del estado
  const leerVertices = useCallback(() => {
    if (!poligonoRef.current) return;
    setPath(
      poligonoRef.current
        .getPath()
        .getArray()
        .map((punto) => ({ lat: punto.lat(), lng: punto.lng() }))
    );
  }, [setPath]);

  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const centro = path.length > 0 ? path[0] : CENTRO_MAPA;

  return (
    <Box sx={{ borderRadius: 1, overflow: 'hidden' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '560px' }}
        center={centro}
        zoom={13}
        onClick={agregarPunto}
        options={{ draggableCursor: editando ? 'crosshair' : undefined }}
      >
        {zonas
          .filter((zona) => zona.vertices && zona.vertices.length >= 3)
          .map((zona) => (
            <Polygon
              key={`zona-${zona.idZona}`}
              paths={zona.vertices}
              onClick={() => onSeleccionarZona(zona)}
              options={{
                fillColor: zona.color || '#000000',
                fillOpacity: zonaVista === zona.idZona ? 0.28 : 0.12,
                strokeColor: zona.color || '#000000',
                strokeWeight: zonaVista === zona.idZona ? 3 : 1.5,
                strokeOpacity: 0.9,
                clickable: !editando,
              }}
            />
          ))}

        {editando && path.length > 0 && path.length < 3 && (
          <Polyline path={path} options={{ strokeColor: color, strokeWeight: 2 }} />
        )}

        {editando && path.length >= 3 && (
          <Polygon
            paths={path}
            editable
            draggable
            onLoad={(poligono) => {
              poligonoRef.current = poligono;
            }}
            onUnmount={() => {
              poligonoRef.current = null;
            }}
            onMouseUp={leerVertices}
            onDragEnd={leerVertices}
            options={{
              fillColor: color,
              fillOpacity: 0.25,
              strokeColor: color,
              strokeWeight: 2,
            }}
          />
        )}

        {editando &&
          path.map((punto, indice) => (
            /* eslint-disable-next-line react/no-array-index-key */
            <Marker
              key={`v-${indice}`}
              position={punto}
              label={{ text: String(indice + 1), fontSize: '10px' }}
            />
          ))}

        {clientes.map((cliente) => (
          <Marker
            key={`cli-${cliente.id}`}
            position={{ lat: parseFloat(cliente.latitude), lng: parseFloat(cliente.longitude) }}
            title={`${cliente.nombre} ${cliente.apellido || ''}${
              cliente.frecuencia ? ` · ${cliente.frecuencia}` : ''
            }`}
            icon={{ ...ICONO_CLIENTE, fillColor: color, strokeColor: '#ffffff' }}
          />
        ))}
      </GoogleMap>
    </Box>
  );
}

ZonaMapa.propTypes = {
  zonas: PropTypes.array,
  path: PropTypes.array,
  setPath: PropTypes.func.isRequired,
  editando: PropTypes.bool,
  color: PropTypes.string,
  clientes: PropTypes.array,
  zonaVista: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onSeleccionarZona: PropTypes.func.isRequired,
};

ZonaMapa.defaultProps = {
  zonas: [],
  path: [],
  editando: false,
  color: '#1976d2',
  clientes: [],
  zonaVista: null,
};
