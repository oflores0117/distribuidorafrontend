import swal from 'sweetalert';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Menu,
  Table,
  Alert,
  Stack,
  Button,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Container,
  Typography,
  IconButton,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { apiPost } from 'src/api/client';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

import PedidoDialog from '../pedido-dialog';
import { moneda, ESTADOS_PEDIDO, ETIQUETA_ESTADO } from '../estados';

const FILTROS_VACIOS = { estado: '', texto: '', desde: '', hasta: '' };

export default function PedidosView() {
  const [cargando, setCargando] = useState(true);
  const [pedidos, setPedidos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [total, setTotal] = useState(0);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [dialogo, setDialogo] = useState(null); // { idPedido } | { idPedido: null }
  const [menu, setMenu] = useState(null);

  const buscar = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await apiPost('obtener_pedidos', {
        estado: filtros.estado || undefined,
        texto: filtros.texto || undefined,
        desde: filtros.desde || undefined,
        hasta: filtros.hasta || undefined,
      });
      setPedidos(resp.pedidos || []);
      setResumen(resp.resumen || null);
      setTotal(resp.total || 0);
    } catch (err) {
      swal('No se pudieron cargar los pedidos', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  const cambiarFiltro = (campo, valor) => setFiltros((prev) => ({ ...prev, [campo]: valor }));

  const anular = async (pedido) => {
    const motivo = await swal({
      title: `Anular ${pedido.codigo}?`,
      text: 'El pedido deja de contar y se suelta de la parada donde este.',
      icon: 'warning',
      content: 'input',
      buttons: ['Cancelar', 'Anular'],
    });

    // swal devuelve null al cancelar y '' si aceptaron con el campo vacio
    if (motivo === null) return;
    if (!String(motivo).trim()) {
      swal('Falta el motivo', 'Escribe por que se anula el pedido', 'warning');
      return;
    }

    try {
      const resp = await apiPost('anular_pedido', { idPedido: pedido.idPedido, motivo });
      if (!resp.success) {
        swal('No se anulo', resp.error || '', 'warning');
        return;
      }
      swal('Pedido anulado', '', 'success');
      buscar();
    } catch (err) {
      swal('Error', err.message, 'error');
    }
  };

  const cerrarMenu = () => setMenu(null);

  return (
    <Container maxWidth="xl">
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3}>
        <Stack>
          <Typography variant="h4">Pedidos</Typography>
          <Typography variant="body2" color="text.secondary">
            Lo que el vendedor toma antes de que salga el camion. El stock recien se mueve cuando
            la ruta carga.
          </Typography>
        </Stack>

        <Button
          variant="contained"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={() => setDialogo({ idPedido: null })}
        >
          Nuevo pedido
        </Button>
      </Stack>

      {resumen && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
          {ESTADOS_PEDIDO.map((estado) => (
            <Chip
              key={estado}
              label={`${resumen[estado]} ${ETIQUETA_ESTADO[estado].texto}`}
              color={resumen[estado] > 0 ? ETIQUETA_ESTADO[estado].color : 'default'}
              variant={filtros.estado === estado ? 'filled' : 'outlined'}
              onClick={() => cambiarFiltro('estado', filtros.estado === estado ? '' : estado)}
            />
          ))}
        </Stack>
      )}

      <Card>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2 }}
          alignItems={{ md: 'center' }}
        >
          <TextField
            size="small"
            label="Buscar"
            placeholder="Codigo o cliente"
            value={filtros.texto}
            onChange={(e) => cambiarFiltro('texto', e.target.value)}
            sx={{ width: { xs: 1, md: 280 } }}
            InputProps={{
              startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, opacity: 0.6 }} />,
            }}
          />
          <TextField
            size="small"
            type="date"
            label="Desde"
            value={filtros.desde}
            onChange={(e) => cambiarFiltro('desde', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            type="date"
            label="Hasta"
            value={filtros.hasta}
            onChange={(e) => cambiarFiltro('hasta', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button color="inherit" onClick={() => setFiltros(FILTROS_VACIOS)}>
            Limpiar
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {pedidos.length} de {total}
          </Typography>
        </Stack>

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Codigo</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Entregar el</TableCell>
                  <TableCell>Vendedor</TableCell>
                  <TableCell align="right">Items</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {cargando && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress size={28} sx={{ my: 3 }} />
                    </TableCell>
                  </TableRow>
                )}

                {!cargando &&
                  pedidos.map((pedido) => {
                    const etiqueta = ETIQUETA_ESTADO[pedido.estado] || {
                      texto: pedido.estado,
                      color: 'default',
                    };

                    return (
                      <TableRow key={pedido.idPedido} hover>
                        <TableCell>{pedido.codigo}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{pedido.cliente}</Typography>
                          {pedido.negocio && (
                            <Typography variant="caption" color="text.secondary">
                              {pedido.negocio}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{pedido.fecha}</TableCell>
                        <TableCell>{pedido.fechaEntrega || '-'}</TableCell>
                        <TableCell>{pedido.vendedor || '-'}</TableCell>
                        <TableCell align="right">{pedido.items}</TableCell>
                        <TableCell align="right">{moneda(pedido.total)}</TableCell>
                        <TableCell>
                          <Chip size="small" color={etiqueta.color} label={etiqueta.texto} />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={(e) => setMenu({ ancla: e.currentTarget, pedido })}>
                            <Iconify icon="eva:more-vertical-fill" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                {!cargando && pedidos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Alert severity="info" sx={{ m: 2 }}>
                        No hay pedidos con esos filtros.
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </Card>

      <Menu anchorEl={menu ? menu.ancla : null} open={Boolean(menu)} onClose={cerrarMenu}>
        <MenuItem
          onClick={() => {
            setDialogo({ idPedido: menu.pedido.idPedido });
            cerrarMenu();
          }}
        >
          <Iconify icon="eva:eye-outline" sx={{ mr: 2 }} />
          {menu && menu.pedido.estado === 'pendiente' ? 'Ver / editar' : 'Ver'}
        </MenuItem>

        {menu && menu.pedido.estado !== 'entregado' && menu.pedido.estado !== 'anulado' && (
          <MenuItem
            sx={{ color: 'error.main' }}
            onClick={() => {
              anular(menu.pedido);
              cerrarMenu();
            }}
          >
            <Iconify icon="eva:slash-outline" sx={{ mr: 2 }} />
            Anular
          </MenuItem>
        )}
      </Menu>

      {dialogo && (
        <PedidoDialog
          abierto
          idPedido={dialogo.idPedido}
          onCerrar={() => setDialogo(null)}
          onGuardado={() => {
            setDialogo(null);
            buscar();
          }}
        />
      )}
    </Container>
  );
}
