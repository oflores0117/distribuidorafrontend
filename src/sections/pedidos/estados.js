import numeral from 'numeral';

// Estados por los que pasa un pedido de preventa. El backend usa las mismas
// claves; el modulo de rutas es quien dispara casi todas las transiciones.
export const ESTADOS_PEDIDO = ['pendiente', 'en_ruta', 'entregado', 'parcial', 'anulado'];

export const ETIQUETA_ESTADO = {
  pendiente: { texto: 'pendiente', color: 'warning' },
  en_ruta: { texto: 'en ruta', color: 'info' },
  entregado: { texto: 'entregado', color: 'success' },
  // El cliente recibio menos de lo que pidio: la entrega ya se cerro pero
  // quedo un saldo de mercaderia sin entregar
  parcial: { texto: 'parcial', color: 'secondary' },
  anulado: { texto: 'anulado', color: 'error' },
};

// Sin simbolo de moneda: la columna ya dice de que se trata y el sistema
// todavia no define en que moneda opera
export const moneda = (valor) => numeral(Number(valor) || 0).format('0,0.00');
