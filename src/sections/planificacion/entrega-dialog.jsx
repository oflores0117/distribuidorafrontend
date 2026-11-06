import swal from 'sweetalert';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Chip,
  Link,
  Table,
  Alert,
  Stack,
  Radio,
  Button,
  Dialog,
  Divider,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  RadioGroup,
  Typography,
  FormControl,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';

import { apiPost } from 'src/api/client';

import { moneda } from '../pedidos/estados';
import CobroEntrega, { nombreMedio } from './cobro-entrega';
import { punto, distanciaMetros, obtenerUbicacion, DISTANCIA_SOSPECHOSA_M } from './ubicacion';
import {
  sumar,
  requiereMotivo,
  ETIQUETA_PARADA,
  RESULTADOS_VISITA,
  resultadoSugerido,
  RESULTADOS_ENTREGA,
} from './entregas';

const numero = (valor) => parseInt(valor, 10) || 0;

/**
 * Cuanto hay de ese producto arriba del camion. Si el backend no informa la
 * carga no bloqueamos nada; si la informa, un producto que no aparece es un
 * producto que no subio, y el backend va a rechazar que se entregue.
 */
const disponibleDe = (enCamion, detalle) => {
  if (!Array.isArray(enCamion)) return detalle.cantidad;
  const linea = enCamion.find((c) => c.idProducto === detalle.idProducto);
  return linea ? linea.cantidad : 0;
};

/** Donde se cerro la parada respecto del cliente, para la prueba de entrega. */
const describirUbicacion = (parada) => {
  const registro = punto(parada.entrega.latitude, parada.entrega.longitude);
  if (!registro) return null;

  const cliente = parada.cliente ? punto(parada.cliente.latitude, parada.cliente.longitude) : null;
  const metros = cliente ? Math.round(distanciaMetros(registro, cliente)) : null;

  return {
    enlace: `https://www.google.com/maps/search/?api=1&query=${registro.lat},${registro.lng}`,
    metros,
    lejos: metros !== null && metros > DISTANCIA_SOSPECHOSA_M,
  };
};

/**
 * Cierre de la parada: cuanto recibio realmente el cliente, producto por
 * producto, y como pago. Es la unica pantalla que puede marcar una parada como
 * entregada, porque es la que produce los movimientos de stock y define si el
 * pedido quedo completo, parcial o rechazado.
 *
 * Con `permitirCorreccion` una entrega ya registrada se puede corregir. Es una
 * tarea del administrador: hasta que exista login solo se ofrece desde la
 * planificacion, no desde el celular del repartidor.
 */
export default function EntregaDialog({
  idRutaParada,
  abierto,
  onCerrar,
  onGuardado,
  permitirCorreccion,
}) {
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [parada, setParada] = useState(null);
  const [lineas, setLineas] = useState([]);
  const [resultado, setResultado] = useState('entregado');
  const [motivo, setMotivo] = useState('');
  const [observacion, setObservacion] = useState('');
  const [cobro, setCobro] = useState({ medio: 'efectivo', referencia: '' });
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [motivoCorreccion, setMotivoCorreccion] = useState('');
  // Cuando el repartidor elige el resultado a mano dejamos de sugerirlo
  const [forzado, setForzado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await apiPost('obtener_entrega_parada', { idRutaParada });
      if (!resp.success) {
        swal('Error', resp.error || 'No se encontro la parada', 'error');
        onCerrar();
        return;
      }

      const datos = resp.parada;
      const yaRegistrada = Boolean(datos.entrega);
      const enCamion = datos.cargaDisponible;
      const detalles = datos.pedido ? datos.pedido.detalles || [] : [];

      setParada(datos);
      setLineas(
        detalles.map((detalle) => {
          const arriba = disponibleDe(enCamion, detalle);

          return {
            idProducto: detalle.idProducto,
            nombre: detalle.nombre,
            codigo: detalle.codigo,
            cantidadPedida: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            enCamion: arriba,
            // Se propone entregar todo lo que se pueda: lo normal es que se
            // entregue completo y el repartidor solo corrija la excepcion
            entregada: String(
              yaRegistrada ? detalle.cantidadEntregada || 0 : Math.min(detalle.cantidad, arriba)
            ),
            devuelta: String(yaRegistrada ? detalle.cantidadDevuelta || 0 : 0),
          };
        })
      );

      const cobroPrevio = yaRegistrada ? datos.entrega.cobro : null;

      setResultado(yaRegistrada ? datos.estado : 'entregado');
      setForzado(yaRegistrada);
      setMotivo(datos.motivo || '');
      setObservacion(datos.observacion || '');
      setCobro({
        medio: cobroPrevio ? cobroPrevio.medio : 'efectivo',
        referencia: (cobroPrevio && cobroPrevio.referencia) || '',
      });
      setCorrigiendo(false);
      setMotivoCorreccion('');
    } catch (err) {
      swal('Error', err.message, 'error');
      onCerrar();
    } finally {
      setCargando(false);
    }
  }, [idRutaParada, onCerrar]);

  useEffect(() => {
    if (abierto) cargar();
  }, [abierto, cargar]);

  const registrada = Boolean(parada && parada.entrega);
  const conPedido = Boolean(parada && parada.pedido);

  useEffect(() => {
    if (forzado || !conPedido) return;
    setResultado(resultadoSugerido(lineas));
  }, [lineas, forzado, conPedido]);

  const cambiarLinea = (idProducto, campo, valor) =>
    setLineas((prev) =>
      prev.map((linea) => (linea.idProducto === idProducto ? { ...linea, [campo]: valor } : linea))
    );

  const entregarTodo = () =>
    setLineas((prev) =>
      prev.map((linea) => ({
        ...linea,
        entregada: String(Math.min(linea.cantidadPedida, linea.enCamion)),
        devuelta: '0',
      }))
    );

  const noEntregarNada = () =>
    setLineas((prev) => prev.map((linea) => ({ ...linea, entregada: '0', devuelta: '0' })));

  const elegirResultado = (valor) => {
    setForzado(true);
    setResultado(valor);
    // Atajo: marcar rechazo o ausencia vacia las cantidades de una vez
    if (valor === 'rechazado' || valor === 'ausente') noEntregarNada();
    if (valor === 'entregado' && conPedido) entregarTodo();
  };

  const unidadesPedidas = sumar(lineas, 'cantidadPedida');
  const unidadesEntregadas = sumar(lineas, 'entregada');
  const unidadesDevueltas = sumar(lineas, 'devuelta');

  const montoEntregado = lineas.reduce(
    (total, linea) => total + numero(linea.entregada) * (parseFloat(linea.precioUnitario) || 0),
    0
  );

  const validar = () => {
    if (requiereMotivo(resultado) && !motivo.trim()) {
      swal('Falta el motivo', 'Explica por que la entrega no salio completa', 'warning');
      return false;
    }

    const excedidas = lineas.filter(
      (linea) => numero(linea.entregada) + numero(linea.devuelta) > linea.cantidadPedida
    );
    if (excedidas.length > 0) {
      swal(
        'Cantidades fuera del pedido',
        `Entre entregado y devuelto se pasa de lo pedido en: ${excedidas
          .map((l) => l.nombre)
          .join(', ')}.`,
        'warning'
      );
      return false;
    }

    const sinStock = lineas.filter((linea) => numero(linea.entregada) > linea.enCamion);
    if (sinStock.length > 0) {
      swal(
        'No hay tanto en el camion',
        sinStock
          .map((l) => `${l.nombre}: entrega ${numero(l.entregada)}, en el camion ${l.enCamion}`)
          .join('; '),
        'warning'
      );
      return false;
    }

    // El resultado y las cantidades tienen que contar la misma historia, si no
    // el reporte de cumplimiento de ruta queda mintiendo
    if (resultado === 'entregado' && conPedido && unidadesEntregadas < unidadesPedidas) {
      swal(
        'La entrega no esta completa',
        `Faltan ${unidadesPedidas - unidadesEntregadas} unidad(es). Corrige las cantidades o ` +
          'marca la parada como entrega parcial.',
        'warning'
      );
      return false;
    }
    if ((resultado === 'rechazado' || resultado === 'ausente') && unidadesEntregadas > 0) {
      swal(
        'Hay unidades entregadas',
        'Si el cliente recibio algo la parada es una entrega parcial, no un rechazo.',
        'warning'
      );
      return false;
    }

    return true;
  };

  const cuerpoEntrega = () => ({
    idRutaParada,
    resultado,
    motivo,
    observacion,
    items: lineas.map((linea) => ({
      idProducto: linea.idProducto,
      cantidadEntregada: numero(linea.entregada),
      cantidadDevuelta: numero(linea.devuelta),
    })),
    cobro: montoEntregado > 0 ? cobro : null,
  });

  const textoCobro =
    montoEntregado > 0 ? ` Cobro: ${moneda(montoEntregado)} en ${nombreMedio(cobro.medio)}.` : '';

  const registrar = async () => {
    const confirmado = await swal({
      title: 'Registrar la entrega?',
      text: conPedido
        ? `Se descargan ${unidadesEntregadas} unidad(es) del camion y el pedido queda cerrado.${textoCobro}`
        : 'Se cierra la parada sin movimiento de stock.',
      icon: 'warning',
      buttons: ['Revisar', 'Registrar'],
    });
    if (!confirmado) return;

    setGuardando(true);
    try {
      // Si el celular no da la ubicacion la entrega se registra igual
      const posicion = await obtenerUbicacion();
      const resp = await apiPost('registrar_entrega_parada', {
        ...cuerpoEntrega(),
        ...(posicion || {}),
      });

      if (!resp.success) {
        swal('No se registro', resp.error || '', 'warning');
        return;
      }

      const avisos = [`La parada quedo como ${resp.estadoParada || resultado}.`];
      if (!posicion) avisos.push('No se pudo tomar la ubicacion del celular.');
      swal('Entrega registrada', avisos.join(' '), 'success');
      onGuardado();
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const corregir = async () => {
    if (!motivoCorreccion.trim()) {
      swal('Falta el motivo', 'Explica por que se corrige la entrega: queda en el historial', 'warning');
      return;
    }

    const confirmado = await swal({
      title: 'Corregir la entrega?',
      text: parada.rutaRetornada
        ? 'El camion ya volvio: la diferencia de unidades ajusta el faltante de la ruta.'
        : 'La diferencia de unidades vuelve al camion o sale de el.',
      icon: 'warning',
      buttons: ['Revisar', 'Corregir'],
    });
    if (!confirmado) return;

    setGuardando(true);
    try {
      const resp = await apiPost('corregir_entrega_parada', {
        ...cuerpoEntrega(),
        motivoCorreccion,
      });

      if (!resp.success) {
        swal('No se corrigio', resp.error || '', 'warning');
        return;
      }

      const avisos = [`La parada quedo como ${resp.estadoParada}.`];
      if (resp.estadoPedido) avisos.push(`El pedido quedo ${resp.estadoPedido}.`);
      if (resp.rutaRendida) {
        avisos.push('La ruta ya estaba rendida: revisa la diferencia de efectivo en la rendicion.');
      }
      swal('Entrega corregida', avisos.join(' '), 'success');
      onGuardado();
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const guardar = () => {
    if (!validar()) return;
    if (corrigiendo) corregir();
    else registrar();
  };

  const nombreCliente = () => {
    if (!parada) return '';
    if (!parada.cliente) return `Cliente ${parada.idCliente}`;
    return `${parada.cliente.nombre} ${parada.cliente.apellido || ''}`.trim();
  };

  const opciones = conPedido ? RESULTADOS_ENTREGA : RESULTADOS_VISITA;
  const etiqueta = parada ? ETIQUETA_PARADA[parada.estado] : null;
  // La entrega se registra una sola vez y solo con la ruta en la calle; despues
  // solo se puede corregir, y en cualquier momento
  const puedeRegistrar = Boolean(parada) && !registrada && parada.rutaEstado === 'en_curso';
  const puedeCorregir = Boolean(permitirCorreccion) && registrada && !corrigiendo;
  const editable = puedeRegistrar || corrigiendo;
  const ubicacion = registrada ? describirUbicacion(parada) : null;
  const correcciones = registrada ? parada.entrega.correcciones || [] : [];
  const cobroRegistrado = registrada ? parada.entrega.cobro : null;

  return (
    <Dialog open={abierto} onClose={onCerrar} fullWidth maxWidth="md">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <span>{parada ? nombreCliente() : 'Entrega'}</span>
          {etiqueta && <Chip size="small" color={etiqueta.color} label={etiqueta.texto} />}
          {parada && parada.pedido && (
            <Chip size="small" variant="outlined" label={parada.pedido.codigo} />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {cargando && (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {!cargando && parada && (
          <Stack spacing={2}>
            {registrada && !corrigiendo && (
              <Alert severity="success">
                {`Entrega registrada${
                  parada.entrega.registradaEn ? ` el ${parada.entrega.registradaEn}` : ''
                }.`}
                {cobroRegistrado &&
                  ` Cobrado ${moneda(cobroRegistrado.monto)} en ${nombreMedio(cobroRegistrado.medio)}${
                    cobroRegistrado.referencia ? ` (comprobante ${cobroRegistrado.referencia})` : ''
                  }.`}
              </Alert>
            )}

            {registrada && !corrigiendo && (
              <Typography variant="body2" color={ubicacion && ubicacion.lejos ? 'error' : 'text.secondary'}>
                {ubicacion ? (
                  <>
                    {ubicacion.metros !== null
                      ? `Registrada a ${ubicacion.metros} m del cliente. `
                      : 'El cliente no tiene coordenadas para comparar. '}
                    <Link href={ubicacion.enlace} target="_blank" rel="noopener">
                      Ver en el mapa
                    </Link>
                  </>
                ) : (
                  'La entrega se registro sin ubicacion del celular.'
                )}
              </Typography>
            )}

            {corrigiendo && (
              <Alert severity="warning">
                Estas corrigiendo una entrega ya registrada. Lo de antes queda en el historial.
                {parada.rutaRetornada &&
                  ' El camion ya volvio: lo que cambie en las cantidades ajusta el faltante de la ruta.'}
              </Alert>
            )}

            {!registrada && parada.rutaEstado !== 'en_curso' && (
              <Alert severity="warning">
                La ruta esta {parada.rutaEstado}. Inicia la ruta para poder registrar entregas.
              </Alert>
            )}

            {!conPedido && (
              <Alert severity="info">
                Esta parada no tiene pedido enganchado, es una visita de relevamiento. Solo se
                registra si el cliente estaba.
              </Alert>
            )}

            <FormControl>
              <RadioGroup value={resultado} onChange={(e) => elegirResultado(e.target.value)}>
                {opciones.map((opcion) => (
                  <FormControlLabel
                    key={opcion.valor}
                    value={opcion.valor}
                    disabled={!editable}
                    control={<Radio size="small" />}
                    label={
                      <Stack>
                        <Typography variant="body2">{opcion.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {opcion.ayuda}
                        </Typography>
                      </Stack>
                    }
                  />
                ))}
              </RadioGroup>
            </FormControl>

            {conPedido && (
              <>
                <Divider />

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                    Que recibio el cliente
                  </Typography>
                  {editable && (
                    <>
                      <Button size="small" color="inherit" onClick={entregarTodo}>
                        Entregar todo
                      </Button>
                      <Button size="small" color="inherit" onClick={noEntregarNada}>
                        Nada
                      </Button>
                    </>
                  )}
                </Stack>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell align="right">Pedido</TableCell>
                        <TableCell align="right">En camion</TableCell>
                        <TableCell align="right" sx={{ width: 110 }}>
                          Entrega
                        </TableCell>
                        <TableCell align="right" sx={{ width: 110 }}>
                          Devuelve
                        </TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lineas.map((linea) => {
                        const falta = linea.cantidadPedida - numero(linea.entregada);

                        return (
                          <TableRow key={linea.idProducto}>
                            <TableCell>
                              <Typography variant="body2">{linea.nombre}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {linea.codigo}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{linea.cantidadPedida}</TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                color={
                                  linea.enCamion < linea.cantidadPedida ? 'error.main' : 'inherit'
                                }
                              >
                                {linea.enCamion}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {editable ? (
                                <TextField
                                  size="small"
                                  value={linea.entregada}
                                  onChange={(e) =>
                                    cambiarLinea(linea.idProducto, 'entregada', e.target.value)
                                  }
                                  inputProps={{
                                    inputMode: 'numeric',
                                    style: { textAlign: 'right' },
                                  }}
                                  error={falta < 0 || numero(linea.entregada) > linea.enCamion}
                                />
                              ) : (
                                linea.entregada
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {editable ? (
                                <TextField
                                  size="small"
                                  value={linea.devuelta}
                                  onChange={(e) =>
                                    cambiarLinea(linea.idProducto, 'devuelta', e.target.value)
                                  }
                                  inputProps={{
                                    inputMode: 'numeric',
                                    style: { textAlign: 'right' },
                                  }}
                                />
                              ) : (
                                linea.devuelta
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {moneda(
                                numero(linea.entregada) * (parseFloat(linea.precioUnitario) || 0)
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {lineas.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <Alert severity="warning" sx={{ my: 1 }}>
                              El pedido no tiene lineas.
                            </Alert>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="caption" color="text.secondary">
                  Devuelve es la mercaderia que el cliente rechaza en el momento y vuelve al
                  deposito. Lo que simplemente no se entrego queda como saldo del pedido.
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="flex-end"
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Chip
                    size="small"
                    label={`${unidadesEntregadas} de ${unidadesPedidas} unidad(es)`}
                    color={unidadesEntregadas < unidadesPedidas ? 'secondary' : 'success'}
                  />
                  {unidadesDevueltas > 0 && (
                    <Chip size="small" color="warning" label={`${unidadesDevueltas} devuelta(s)`} />
                  )}
                  <Typography variant="h6">{moneda(montoEntregado)}</Typography>
                </Stack>

                {editable && montoEntregado > 0 && (
                  <>
                    <Divider />
                    <CobroEntrega
                      monto={montoEntregado}
                      medio={cobro.medio}
                      referencia={cobro.referencia}
                      onCambiar={setCobro}
                    />
                  </>
                )}
              </>
            )}

            {requiereMotivo(resultado) && (
              <TextField
                fullWidth
                size="small"
                label="Motivo"
                disabled={!editable}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                helperText="Queda en el historial del cliente y en el reporte de la ruta"
              />
            )}

            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Observacion"
              disabled={!editable}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />

            {corrigiendo && (
              <TextField
                fullWidth
                size="small"
                required
                label="Por que se corrige"
                value={motivoCorreccion}
                onChange={(e) => setMotivoCorreccion(e.target.value)}
                helperText="Por ejemplo: el repartidor cargo mal las cantidades, el cliente pago por QR"
              />
            )}

            {correcciones.length > 0 && (
              <>
                <Divider />
                <Typography variant="subtitle2">Correcciones</Typography>
                {correcciones.map((correccion) => (
                  <Box key={correccion.idEntregaCorreccion}>
                    <Typography variant="body2">
                      {`${correccion.fecha} · ${correccion.estadoAnterior} → ${correccion.estadoNuevo}`}
                      {correccion.montoAnterior !== correccion.montoNuevo &&
                        ` · ${moneda(correccion.montoAnterior)} → ${moneda(correccion.montoNuevo)}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {correccion.motivo}
                    </Typography>
                  </Box>
                ))}
              </>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        {corrigiendo ? (
          <Button onClick={cargar} disabled={guardando}>
            Descartar correccion
          </Button>
        ) : (
          <Button onClick={onCerrar}>{editable ? 'Cancelar' : 'Cerrar'}</Button>
        )}
        {puedeCorregir && (
          <Button color="warning" variant="outlined" onClick={() => setCorrigiendo(true)}>
            Corregir entrega
          </Button>
        )}
        {editable && (
          <Button variant="contained" onClick={guardar} disabled={guardando || cargando}>
            {guardando && 'Guardando...'}
            {!guardando && (corrigiendo ? 'Guardar correccion' : 'Registrar entrega')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

EntregaDialog.propTypes = {
  idRutaParada: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  abierto: PropTypes.bool.isRequired,
  onCerrar: PropTypes.func.isRequired,
  onGuardado: PropTypes.func.isRequired,
  permitirCorreccion: PropTypes.bool,
};
