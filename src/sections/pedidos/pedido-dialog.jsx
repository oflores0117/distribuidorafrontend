import swal from 'sweetalert';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Grid,
  Chip,
  Table,
  Alert,
  Stack,
  Button,
  Dialog,
  Divider,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  Autocomplete,
  DialogActions,
  DialogContent,
  TableContainer,
  CircularProgress,
  createFilterOptions,
} from '@mui/material';

import { apiPost } from 'src/api/client';

import Iconify from 'src/components/iconify';

import { moneda, ETIQUETA_ESTADO } from './estados';

const hoy = () => new Date().toISOString().slice(0, 10);

const nombreCliente = (cliente) => `${cliente.nombre} ${cliente.apellido || ''}`.trim();

// Son casi 18 mil clientes: pintarlos todos traba el dialogo, asi que se muestran
// los primeros que coinciden. Tambien se busca por NIT y celular, que es como
// se distingue a dos clientes con el mismo nombre.
const filtrarClientes = createFilterOptions({
  limit: 50,
  stringify: (c) => `${nombreCliente(c)} ${c.tipo_negocio || ''} ${c.nit || ''} ${c.celular || ''}`,
});

const CABECERA_VACIA = {
  idCliente: '',
  idFuncionario: '',
  fecha: hoy(),
  fechaEntrega: '',
  observacion: '',
};

/**
 * Alta y edicion del pedido de preventa. Un pedido solo se puede tocar mientras
 * sigue pendiente; una vez que subio al camion se abre en modo lectura.
 */
export default function PedidoDialog({ idPedido, abierto, onCerrar, onGuardado }) {
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cabecera, setCabecera] = useState(CABECERA_VACIA);
  const [lineas, setLineas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [pedido, setPedido] = useState(null);
  const [porAgregar, setPorAgregar] = useState(null);

  const editable = !idPedido || (pedido && pedido.editable);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [resClientes, resProductos, resFuncionarios] = await Promise.all([
        apiPost('obtener_todos_clientes'),
        apiPost('obtener_productos'),
        apiPost('obtener_funcionarios'),
      ]);

      setClientes(resClientes.clientes || []);
      setProductos((resProductos.productos || []).filter((p) => p.estado !== 0));
      setFuncionarios(resFuncionarios.funcionario || []);

      if (idPedido) {
        const resp = await apiPost('obtener_pedido', { idPedido });
        if (!resp.success) {
          swal('Error', resp.error || 'No se encontro el pedido', 'error');
          onCerrar();
          return;
        }
        setPedido(resp.pedido);
        setCabecera({
          idCliente: resp.pedido.idCliente,
          idFuncionario: resp.pedido.idFuncionario || '',
          fecha: resp.pedido.fecha,
          fechaEntrega: resp.pedido.fechaEntrega || '',
          observacion: resp.pedido.observacion || '',
        });
        setLineas(
          resp.pedido.detalles.map((d) => ({
            idProducto: d.idProducto,
            nombre: d.nombre,
            codigo: d.codigo,
            stockActual: d.stockActual,
            cantidad: String(d.cantidad),
            precioUnitario: String(d.precioUnitario),
          }))
        );
      } else {
        setPedido(null);
        setCabecera(CABECERA_VACIA);
        setLineas([]);
      }
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, [idPedido, onCerrar]);

  useEffect(() => {
    if (abierto) cargar();
  }, [abierto, cargar]);

  const cambiar = (campo, valor) => setCabecera((prev) => ({ ...prev, [campo]: valor }));

  const agregarProducto = (producto) => {
    if (!producto) return;

    if (lineas.some((l) => l.idProducto === producto.idProducto)) {
      swal('Ya esta en el pedido', 'Cambia la cantidad en la linea que ya cargaste', 'info');
      return;
    }

    setLineas((prev) => [
      ...prev,
      {
        idProducto: producto.idProducto,
        nombre: producto.nombre,
        codigo: producto.codigo,
        stockActual: producto.stockActual,
        cantidad: '1',
        precioUnitario: String(producto.precioVenta ?? 0),
      },
    ]);
    setPorAgregar(null);
  };

  const cambiarLinea = (idProducto, campo, valor) =>
    setLineas((prev) =>
      prev.map((l) => (l.idProducto === idProducto ? { ...l, [campo]: valor } : l))
    );

  const quitarLinea = (idProducto) =>
    setLineas((prev) => prev.filter((l) => l.idProducto !== idProducto));

  const subtotalDe = (linea) =>
    (parseInt(linea.cantidad, 10) || 0) * (parseFloat(linea.precioUnitario) || 0);

  const total = lineas.reduce((suma, linea) => suma + subtotalDe(linea), 0);

  const guardar = async () => {
    if (!cabecera.idCliente) {
      swal('Falta el cliente', 'Elige a quien se le toma el pedido', 'warning');
      return;
    }
    if (lineas.length === 0) {
      swal('Pedido vacio', 'Agrega al menos un producto', 'warning');
      return;
    }

    const items = lineas.map((linea) => ({
      idProducto: linea.idProducto,
      cantidad: parseInt(linea.cantidad, 10) || 0,
      precioUnitario: parseFloat(linea.precioUnitario) || 0,
    }));

    if (items.some((item) => item.cantidad <= 0)) {
      swal('Cantidad no valida', 'Todas las lineas necesitan una cantidad mayor a cero', 'warning');
      return;
    }

    setGuardando(true);
    try {
      const resp = await apiPost('registrar_pedido', {
        idPedido: idPedido || undefined,
        idCliente: cabecera.idCliente,
        idFuncionario: cabecera.idFuncionario || undefined,
        fecha: cabecera.fecha,
        fechaEntrega: cabecera.fechaEntrega || undefined,
        observacion: cabecera.observacion,
        items,
      });

      if (!resp.success) {
        swal('No se guardo', resp.error || '', 'warning');
        return;
      }

      swal('Pedido guardado', `Quedo como ${resp.codigo}`, 'success');
      onGuardado();
    } catch (err) {
      swal('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const clienteElegido = clientes.find((c) => c.id === cabecera.idCliente) || null;
  const disponibles = productos.filter((p) => !lineas.some((l) => l.idProducto === p.idProducto));
  const etiqueta = pedido ? ETIQUETA_ESTADO[pedido.estado] : null;

  return (
    <Dialog open={abierto} onClose={onCerrar} fullWidth maxWidth="md">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <span>{idPedido ? `Pedido ${pedido ? pedido.codigo : ''}` : 'Nuevo pedido'}</span>
          {etiqueta && <Chip size="small" color={etiqueta.color} label={etiqueta.texto} />}
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {cargando && (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {!cargando && (
          <>
            {!editable && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Este pedido ya no es editable porque esta {pedido.estado.replace('_', ' ')}.
                {pedido.ruta &&
                  ` Va en la ruta del ${pedido.ruta.fecha}, parada ${pedido.ruta.orden}.`}
              </Alert>
            )}

            {pedido && pedido.estado === 'anulado' && pedido.motivoAnulacion && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Anulado: {pedido.motivoAnulacion}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  disabled={!editable}
                  options={clientes}
                  value={clienteElegido}
                  getOptionLabel={(c) =>
                    `${nombreCliente(c)}${c.tipo_negocio ? ` - ${c.tipo_negocio}` : ''}`
                  }
                  isOptionEqualToValue={(opcion, valor) => opcion.id === valor.id}
                  filterOptions={filtrarClientes}
                  onChange={(e, valor) => cambiar('idCliente', valor ? valor.id : '')}
                  // Hay nombres repetidos: la key por defecto es el texto y React choca
                  renderOption={(props, c) => (
                    <li {...props} key={c.id}>
                      <Stack sx={{ width: 1 }}>
                        <span>{nombreCliente(c)}</span>
                        <Typography variant="caption" color="text.secondary">
                          {[c.tipo_negocio, c.nit && `NIT ${c.nit}`, c.celular]
                            .filter(Boolean)
                            .join(' · ')}
                        </Typography>
                      </Stack>
                    </li>
                  )}
                  renderInput={(params) => <TextField {...params} label="Cliente" size="small" />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  disabled={!editable}
                  options={funcionarios}
                  value={
                    funcionarios.find((f) => f.idFuncionario === cabecera.idFuncionario) || null
                  }
                  getOptionLabel={(f) => `${f.nombre} ${f.apellido || ''}`.trim()}
                  isOptionEqualToValue={(opcion, valor) =>
                    opcion.idFuncionario === valor.idFuncionario
                  }
                  onChange={(e, valor) =>
                    cambiar('idFuncionario', valor ? valor.idFuncionario : '')
                  }
                  renderInput={(params) => <TextField {...params} label="Vendedor" size="small" />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Fecha del pedido"
                  disabled={!editable}
                  value={cabecera.fecha || ''}
                  onChange={(e) => cambiar('fecha', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Entregar el"
                  disabled={!editable}
                  value={cabecera.fechaEntrega || ''}
                  onChange={(e) => cambiar('fechaEntrega', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="Con esta fecha se arma la ruta del dia"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Observacion"
                  disabled={!editable}
                  value={cabecera.observacion || ''}
                  onChange={(e) => cambiar('observacion', e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {editable && (
              <Autocomplete
                options={disponibles}
                value={porAgregar}
                getOptionLabel={(p) => `${p.codigo ? `${p.codigo} - ` : ''}${p.nombre}`}
                isOptionEqualToValue={(opcion, valor) => opcion.idProducto === valor.idProducto}
                onChange={(e, valor) => agregarProducto(valor)}
                renderOption={(props, p) => (
                  <li {...props} key={p.idProducto}>
                    <Stack direction="row" justifyContent="space-between" sx={{ width: 1 }}>
                      <span>{p.nombre}</span>
                      <Typography variant="caption" color="text.secondary">
                        {moneda(p.precioVenta)} · stock {p.stockActual}
                      </Typography>
                    </Stack>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Agregar producto" size="small" />
                )}
                sx={{ mb: 2 }}
              />
            )}

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right" sx={{ width: 110 }}>
                      Cantidad
                    </TableCell>
                    <TableCell align="right" sx={{ width: 130 }}>
                      Precio
                    </TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    {editable && <TableCell sx={{ width: 48 }} />}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lineas.map((linea) => (
                    <TableRow key={linea.idProducto}>
                      <TableCell>
                        <Typography variant="body2">{linea.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {linea.codigo}
                          {linea.stockActual !== null &&
                            linea.stockActual !== undefined &&
                            ` · stock ${linea.stockActual}`}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {editable ? (
                          <TextField
                            size="small"
                            type="number"
                            value={linea.cantidad}
                            onChange={(e) =>
                              cambiarLinea(linea.idProducto, 'cantidad', e.target.value)
                            }
                            inputProps={{ min: 1, style: { textAlign: 'right' } }}
                          />
                        ) : (
                          linea.cantidad
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {editable ? (
                          <TextField
                            size="small"
                            type="number"
                            value={linea.precioUnitario}
                            onChange={(e) =>
                              cambiarLinea(linea.idProducto, 'precioUnitario', e.target.value)
                            }
                            inputProps={{ min: 0, step: '0.01', style: { textAlign: 'right' } }}
                          />
                        ) : (
                          moneda(linea.precioUnitario)
                        )}
                      </TableCell>
                      <TableCell align="right">{moneda(subtotalDe(linea))}</TableCell>
                      {editable && (
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => quitarLinea(linea.idProducto)}
                          >
                            <Iconify icon="eva:trash-2-outline" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}

                  {lineas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={editable ? 5 : 4}>
                        <Alert severity="info" sx={{ my: 1 }}>
                          El pedido todavia no tiene productos.
                        </Alert>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
              <Typography variant="h6">Total {moneda(total)}</Typography>
            </Stack>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCerrar}>{editable ? 'Cancelar' : 'Cerrar'}</Button>
        {editable && (
          <Button variant="contained" onClick={guardar} disabled={guardando || cargando}>
            {guardando ? 'Guardando...' : 'Guardar pedido'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

PedidoDialog.propTypes = {
  idPedido: PropTypes.number,
  abierto: PropTypes.bool,
  onCerrar: PropTypes.func,
  onGuardado: PropTypes.func,
};
