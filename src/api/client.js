import axios from 'axios';

// Base configurable por entorno. Ver .env.example
const BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost/distribuidorabackend/public/';

const http = axios.create({ baseURL: BASE_URL });

/**
 * POST al backend siguiendo la convencion actual (todo por POST + version_api).
 * A diferencia de useAxiosPost, soporta varias llamadas concurrentes y
 * propaga el error en vez de tragarselo con un console.log.
 */
export async function apiPost(endpoint, data = {}) {
  const { data: resp } = await http.post(endpoint, { ...data, version_api: 1 });
  return resp;
}

export default http;
