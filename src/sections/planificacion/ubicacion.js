// Prueba de entrega: donde estaba el repartidor al cerrar la parada.

// Mas que esto y el repartidor queda esperando con el cliente adelante
const ESPERA_MAXIMA_MS = 8000;

/**
 * Posicion actual del dispositivo, o null si no se puede (sin permiso, sin
 * GPS, escritorio sin ubicacion, o se paso de la espera). Nunca rechaza: la
 * ubicacion respalda la entrega, no la bloquea.
 */
export const obtenerUbicacion = () =>
  new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) =>
        resolve({
          latitude: posicion.coords.latitude,
          longitude: posicion.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: ESPERA_MAXIMA_MS, maximumAge: 60000 }
    );
  });

const RADIO_TIERRA_M = 6371000;
const radianes = (grados) => (grados * Math.PI) / 180;

/** Distancia en metros entre dos puntos {lat, lng} (haversine). */
export const distanciaMetros = (a, b) => {
  const dLat = radianes(b.lat - a.lat);
  const dLng = radianes(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radianes(a.lat)) * Math.cos(radianes(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(h));
};

/** Punto {lat, lng} desde dos valores que pueden venir como texto, o null. */
export const punto = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
};

// Mas lejos que esto del cliente, la entrega se marca para revisar
export const DISTANCIA_SOSPECHOSA_M = 300;
