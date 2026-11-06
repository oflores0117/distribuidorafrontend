// Vocabulario del cierre de entrega. La parada dejo de ser un estado suelto que
// el planificador movia a mano: ahora es el acto de entregar (o no) los
// productos del pedido enganchado, y de ahi salen los movimientos de stock.

export const ESTADOS_PARADA = ['pendiente', 'entregado', 'parcial', 'rechazado', 'ausente'];

export const ETIQUETA_PARADA = {
  pendiente: { texto: 'pendiente', color: 'default' },
  entregado: { texto: 'entregado', color: 'success' },
  parcial: { texto: 'entrega parcial', color: 'secondary' },
  rechazado: { texto: 'rechazado', color: 'error' },
  ausente: { texto: 'ausente', color: 'warning' },
};

// Lo que el repartidor declara al cerrar una parada con pedido
export const RESULTADOS_ENTREGA = [
  { valor: 'entregado', nombre: 'Entrego todo', ayuda: 'El cliente recibio el pedido completo' },
  {
    valor: 'parcial',
    nombre: 'Entrego una parte',
    ayuda: 'Falto mercaderia o el cliente acepto menos de lo que pidio',
  },
  { valor: 'rechazado', nombre: 'El cliente rechazo', ayuda: 'Estaba, pero no recibio nada' },
  { valor: 'ausente', nombre: 'No estaba', ayuda: 'Local cerrado o nadie que pueda recibir' },
];

// Las paradas de relevamiento no tienen nada que entregar, solo si se visito
export const RESULTADOS_VISITA = [
  { valor: 'entregado', nombre: 'Visita hecha', ayuda: 'Paso por el cliente aunque no habia pedido' },
  { valor: 'ausente', nombre: 'No estaba', ayuda: 'Local cerrado o nadie que pueda recibir' },
];

// En todo lo que no sea una entrega completa hay que explicar que paso
export const requiereMotivo = (resultado) => resultado !== 'entregado';

const numero = (valor) => parseInt(valor, 10) || 0;

/** Suma de unidades de un campo de las lineas, para los contadores del dialogo. */
export const sumar = (lineas, campo) => lineas.reduce((total, linea) => total + numero(linea[campo]), 0);

/**
 * Deduce el resultado mirando las cantidades. Evita que el repartidor tenga que
 * clasificar la parada a mano cuando las lineas ya lo dicen todo; igual puede
 * cambiarlo (por ejemplo: entrego todo, pero el cliente ademas devolvio algo).
 */
export const resultadoSugerido = (lineas) => {
  if (lineas.length === 0) return 'entregado';

  const pedido = sumar(lineas, 'cantidadPedida');
  const entregado = sumar(lineas, 'entregada');

  if (entregado === 0) return 'rechazado';
  if (entregado >= pedido) return 'entregado';
  return 'parcial';
};

/**
 * Lo que deberia quedar arriba del camion al volver: todo lo que subio menos
 * lo que se quedo en los clientes.
 *
 * Lo devuelto no se resta: la mercaderia que el cliente rechaza sigue arriba
 * del camion y vuelve al deposito. El campo `devuelto` es el desglose del
 * motivo (rechazo del cliente) dentro de lo que no se entrego, no una salida
 * aparte.
 */
export const esperadoEnCamion = (linea) => {
  if (linea.esperado !== undefined && linea.esperado !== null) return linea.esperado;
  return numero(linea.cargado) - numero(linea.entregado);
};
