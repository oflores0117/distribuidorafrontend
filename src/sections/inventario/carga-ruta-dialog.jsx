import swal from 'sweetalert';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Chip,
  Table,
  Alert,
  Stack,
  Button,
  Dialog,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { apiPost } from 'src/api/client';

import { esperadoEnCamion } from '../planificacion/entregas';

const numero = (valor) => parseInt(valor, 10) || 0;

/**
 * Carga y retorno del camion de una ruta. Mientras la ruta no vuelve se puede
 * corregir la carga.
 *
 * El retorno ya no define lo entregado: eso sale de las entregas que el
 * repartidor registra parada por parada. Aca solo se concilia que lo que baja
 * del camion coincida con lo que deberia quedar arriba, y la diferencia que
 * aparezca es un faltante real que hay que explicar.
 */
export default function CargaRutaDialog({ idRutaDia, abierto, onCerrar, onGuardado }) {
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [items, setItems] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cerrada, setCerrada] = useState(false);
  const [cantidades, setCantidades] = useState({});
  const [retornos, setRetornos] = useState({});

  const buscar = useCallback(async () => {
    setCargando(true);
    try {
      const [carga, existencias] = await Promise.all([
        apiPost('obtener_carga_ruta', { idRutaDia }),
        apiPost('obtener_existencias'),
      ]);

      const lineas = carga.items || [];
      setItems(lineas);
      setCerrada(Boolean(carga.cerrada));
      setProductos(existencias.productos || []);

      const iniciales = {};
      const vuelta = {};
      lineas.forEach((linea) => {
        iniciales[linea.idProducto] = String(linea.cargado);
        // Se propone lo que deberia estar arriba segun las entregas: el
        // deposito solo corrige donde el conteo fisico no coincida
        vuelta[linea.idProducto] = String(esperadoEnCamion(linea));
      });
      setCantidades(iniciales);
      setRetornos(vuelta);
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, [idRutaDia]);

  useEffect(() => {
    if (abierto) buscar();
  }, [abierto, buscar]);

  const hayCarga = items.length > 0;

  // Negativo: bajo menos de lo que deberia quedar arriba, o sea falta mercaderia
  const diferenciaDe = (linea) => numero(retornos[linea.idProducto]) - esperadoEnCamion(linea);

  const conFaltante = cerrada ? [] : items.filter((linea) => diferenciaDe(linea) < 0);
  // Vuelve mas de lo que deberia quedar arriba: alguna entrega esta mal
  // registrada, y asi el backend no deja cerrar la ruta
  const conSobrante = cerrada ? [] : items.filter((linea) => diferenciaDe(linea) > 0);

  const detalleDe = (lineas) =>
    lineas.map((linea) => `${linea.nombre} (${Math.abs(diferenciaDe(linea))})`).join(', ');

  /**
   * Llena las cantidades con la suma de los pedidos que cuelgan de las paradas.
   * Es una sugerencia: no guarda nada hasta que el deposito confirme.
   */
  const sugerirDesdePedidos = async () => {
    setGuardando(true);
    try {
      const resp = await apiPost('sugerir_carga_ruta', { idRutaDia });
      if (!resp.success) {
        swal('No se pudo calcular', resp.error || '', 'warning');
        return;
      }
      if (resp.items.length === 0) {
        swal(
          'Sin pedidos',
          'Ninguna parada de esta ruta tiene un pedido enganchado todavia.',
          'info'
        );
        return;
      }

      const sugeridas = { ...cantidades };
      const faltantes = [];
      resp.items.forEach((item) => {
        sugeridas[item.idProducto] = String(item.cantidad);
        if (item.cantidad > item.stockActual) {
          faltantes.push(`${item.nombre}: piden ${item.cantidad}, hay ${item.stockActual}`);
        }
      });
      setCantidades(sugeridas);

      const aviso = [`${resp.items.length} producto(s) de ${resp.pedidos} pedido(s).`];
      if (resp.paradasSinPedido > 0) {
        aviso.push(`${resp.paradasSinPedido} parada(s) van sin pedido.`);
      }
      if (faltantes.length > 0) {
        aviso.push(`No alcanza el stock para: ${faltantes.join('; ')}.`);
      }

      swal('Carga sugerida', aviso.join(' '), faltantes.length > 0 ? 'warning' : 'success');
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const guardarCarga = async () => {
    const lista = productos
      .map((producto) => ({
        idProducto: producto.idProducto,
        cantidad: parseInt(cantidades[producto.idProducto], 10) || 0,
      }))
      .filter((linea) => linea.cantidad > 0);

    if (lista.length === 0) {
      swal('Sin productos', 'Indica cuanto se lleva el camion', 'info');
      return;
    }

    setGuardando(true);
    try {
      const resp = await apiPost('guardar_carga_ruta', { idRutaDia, items: lista });
      if (!resp.success) {
        swal('No se guardo', resp.error || '', 'warning');
        return;
      }
      swal('Carga guardada', 'El stock salio del deposito', 'success');
      buscar();
      onGuardado();
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const registrarRetorno = async () => {
    const lista = items.map((linea) => ({
      idProducto: linea.idProducto,
      cantidad: parseInt(retornos[linea.idProducto], 10) || 0,
    }));

    const confirmado = await swal({
      title: 'Registrar el retorno?',
      text:
        conFaltante.length > 0
          ? 'Lo que vuelve entra al deposito. Lo que falta queda registrado como faltante de ' +
            'la ruta. No se puede repetir.'
          : 'Lo que vuelve entra al deposito y la ruta queda cerrada. No se puede repetir.',
      icon: 'warning',
      buttons: ['Cancelar', 'Registrar'],
    });
    if (!confirmado) return;

    setGuardando(true);
    try {
      const resp = await apiPost('registrar_retorno_ruta', { idRutaDia, items: lista });
      if (!resp.success) {
        swal('No se registro', resp.error || '', 'warning');
        return;
      }
      const vueltas = lista.reduce((total, linea) => total + linea.cantidad, 0);
      const detalle = [`Volvieron ${vueltas} unidad(es) al deposito`];
      if (resp.faltante > 0) detalle.push(`${resp.faltante} quedaron como faltante`);
      swal('Retorno registrado', `${detalle.join('. ')}.`, 'success');
      buscar();
      onGuardado();
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={abierto} onClose={onCerrar} fullWidth maxWidth="md">
      <DialogTitle>Carga del camion</DialogTitle>
      <DialogContent>
        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {cerrada && (
              <Alert severity="success">
                El retorno de esta ruta ya se registro. Abajo queda el detalle de lo entregado.
              </Alert>
            )}

            {!cerrada && hayCarga && (
              <Alert severity="info">
                La carga ya salio del deposito. El retorno viene propuesto con lo que deberia
                quedar arriba segun las entregas registradas: corrige solo donde el conteo fisico
                no coincida.
              </Alert>
            )}

            {conSobrante.length > 0 && (
              <Alert severity="error">
                {`Vuelven mas unidades de las que deberian quedar arriba: ${detalleDe(
                  conSobrante
                )}. `}
                Revisa las entregas registradas: el retorno no se puede cerrar asi.
              </Alert>
            )}

            {conFaltante.length > 0 && (
              <Alert severity="warning">
                {`Faltan unidades de: ${detalleDe(conFaltante)}. `}
                Al registrar el retorno quedan como faltante de la ruta.
              </Alert>
            )}

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">En deposito</TableCell>
                    <TableCell align="right">Carga</TableCell>
                    {(cerrada || hayCarga) && <TableCell align="right">Entregado</TableCell>}
                    {(cerrada || hayCarga) && <TableCell align="right">Retorno</TableCell>}
                    {hayCarga && !cerrada && <TableCell align="right">Diferencia</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(cerrada ? items : productos).map((fila) => {
                    const {idProducto} = fila;
                    const linea = items.find((i) => i.idProducto === idProducto);
                    const producto = productos.find((p) => p.idProducto === idProducto);

                    return (
                      <TableRow key={idProducto}>
                        <TableCell>{fila.nombre}</TableCell>
                        <TableCell align="right">
                          {producto ? producto.stockActual : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {cerrada ? (
                            linea.cargado
                          ) : (
                            <TextField
                              size="small"
                              value={cantidades[idProducto] || ''}
                              onChange={(e) =>
                                setCantidades({ ...cantidades, [idProducto]: e.target.value })
                              }
                              inputProps={{ inputMode: 'numeric', style: { textAlign: 'right' } }}
                              sx={{ width: 90 }}
                            />
                          )}
                        </TableCell>
                        {(cerrada || hayCarga) && (
                          <TableCell align="right">
                            {linea ? (
                              <Chip size="small" color="primary" label={linea.entregado || 0} />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        )}
                        {(cerrada || hayCarga) && (
                          <TableCell align="right">
                            {cerrada ? (
                              linea.retornado
                            ) : (
                              linea && (
                                <TextField
                                  size="small"
                                  value={retornos[idProducto] || ''}
                                  onChange={(e) =>
                                    setRetornos({ ...retornos, [idProducto]: e.target.value })
                                  }
                                  inputProps={{
                                    inputMode: 'numeric',
                                    style: { textAlign: 'right' },
                                  }}
                                  sx={{ width: 90 }}
                                  placeholder="0"
                                />
                              )
                            )}
                          </TableCell>
                        )}
                        {hayCarga && !cerrada && (
                          <TableCell align="right">
                            {linea && diferenciaDe(linea) !== 0 && (
                              <Chip
                                size="small"
                                color={diferenciaDe(linea) < 0 ? 'error' : 'warning'}
                                label={
                                  diferenciaDe(linea) < 0
                                    ? `faltan ${Math.abs(diferenciaDe(linea))}`
                                    : `sobran ${diferenciaDe(linea)}`
                                }
                              />
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {!cerrada && productos.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No hay productos cargados en el sistema.
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCerrar}>Cerrar</Button>
        {!cerrada && (
          <Button color="inherit" onClick={sugerirDesdePedidos} disabled={guardando}>
            Sugerir desde pedidos
          </Button>
        )}
        {!cerrada && (
          <Button variant="outlined" onClick={guardarCarga} disabled={guardando}>
            {hayCarga ? 'Actualizar carga' : 'Guardar carga'}
          </Button>
        )}
        {!cerrada && hayCarga && (
          <Button variant="contained" onClick={registrarRetorno} disabled={guardando}>
            Registrar retorno
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

CargaRutaDialog.propTypes = {
  idRutaDia: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  abierto: PropTypes.bool.isRequired,
  onCerrar: PropTypes.func.isRequired,
  onGuardado: PropTypes.func.isRequired,
};
