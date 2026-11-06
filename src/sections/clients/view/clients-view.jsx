import { useRef, useState, useEffect } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import {
  Grid,
  Table,
  Alert,
  Dialog,
  Select,
  Popover,
  TableRow,
  Checkbox,
  MenuItem,
  TextField,
  TableHead,
  TableBody,
  TableCell,
  IconButton,
  InputLabel,
  FormControl,
  DialogTitle,
  ListItemText,
  ToggleButton,
  OutlinedInput,
  DialogContent,
  DialogActions,
  TableContainer,
  TablePagination,
  CircularProgress,
  DialogContentText,
  ToggleButtonGroup,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

import ClientesMapa from '../clientes-mapa';
import UbicacionPicker from '../ubicacion-picker';
import { useAxiosPost } from '../../../hooks/useAxiosPost';

export default function ClientsView() {
  const postClientes = useAxiosPost();
  const postClientesRef = useRef(postClientes);
  postClientesRef.current = postClientes;

  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const [cliente, setCliente] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [clienteEliminar, setClienteEliminar] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [vista, setVista] = useState('lista');

  const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

  const buscarClientes = async () => {
    setLoading(true);
    postClientesRef.current('obtener_clientes', 'asd', async (resp) => {
      const { clientes } = resp;
      setResult(clientes);
      setLoading(false);
    });
  };

  useEffect(() => {
    buscarClientes();
  }, [reload, setResult]);

  const handleInput = (campo, value) => {
    setCliente((prev) => ({ ...prev, [campo]: value }));
  };

  const handleUbicacion = (latitude, longitude) => {
    setCliente((prev) => ({ ...prev, latitude, longitude }));
  };

  const handleChangeDays = (event) => {
    const {
      target: { value },
    } = event;
    setCliente((prev) => ({
      ...prev,
      frecuencia: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const openModalAction = () => {
    setCliente({});
    setOpenModal(true);
  };

  const closeModalAction = () => {
    setOpenModal(false);
  };

  const editClient = (row) => {
    setCliente({
      ...row,
      frecuencia: row.frecuencia ? String(row.frecuencia).split(',').map((d) => d.trim()) : [],
      latitude: row.latitude ?? '',
      longitude: row.longitude ?? '',
    });
    setOpenModal(true);
  };

  const registrarCliente = () => {
    postClientes('registrar_cliente', cliente, async (resp) => {
      const { success } = resp;
      if (success) {
        setOpenModal(false);
        setReload((r) => r + 1);
      }
    });
  };

  const eliminarCliente = () => {
    postClientes('eliminar_cliente', clienteEliminar, async (resp) => {
      const { success } = resp;
      if (success) {
        setOpenConfirm(false);
        setReload((r) => r + 1);
      }
    });
  };

  const handleOpenMenu = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelected(row);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelected(null);
  };

  const confirmEliminar = (row) => {
    setClienteEliminar(row);
    setOpenConfirm(true);
  };

  const handleFilterByName = (event) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const dataFiltered = result.filter(
    (row) =>
      !filterName ||
      String(row.nombre || '').toLowerCase().includes(filterName.toLowerCase()) ||
      String(row.apellido || '').toLowerCase().includes(filterName.toLowerCase()) ||
      String(row.cedula || '').toLowerCase().includes(filterName.toLowerCase())
  );

  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">Clientes</Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <ToggleButtonGroup
            size="small"
            exclusive
            value={vista}
            onChange={(e, valor) => valor && setVista(valor)}
          >
            <ToggleButton value="lista">
              <Iconify icon="eva:list-fill" sx={{ mr: 1 }} />
              Lista
            </ToggleButton>
            <ToggleButton value="mapa">
              <Iconify icon="eva:pin-fill" sx={{ mr: 1 }} />
              Ubicacion
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={openModalAction}
          >
            Nuevo Cliente
          </Button>
        </Stack>
      </Stack>

      {vista === 'mapa' && <ClientesMapa />}

      {vista === 'lista' && (
        <Card>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, pb: 0 }}>
            <TextField
              value={filterName}
              onChange={handleFilterByName}
              placeholder="Buscar por nombre, apellido o cédula..."
              size="small"
              sx={{ width: { xs: '100%', sm: 350 } }}
              InputProps={{
                startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, opacity: 0.6 }} />,
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {dataFiltered.length} cliente(s)
            </Typography>
          </Stack>

          <Scrollbar>
            <TableContainer sx={{ overflow: 'unset' }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Apellidos</TableCell>
                    <TableCell>Cedula</TableCell>
                    <TableCell>Telefono</TableCell>
                    <TableCell>Frecuencia</TableCell>
                    <TableCell>&nbsp;</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress size={28} sx={{ my: 3 }} />
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    dataFiltered
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) => (
                        <TableRow
                          key={row.id}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell component="th" scope="row">
                            {row.nombre}
                          </TableCell>
                          <TableCell>{row.apellido}</TableCell>
                          <TableCell>{row.cedula}</TableCell>
                          <TableCell>{row.celular}</TableCell>
                          <TableCell>{row.frecuencia ? String(row.frecuencia) : '-'}</TableCell>
                          <TableCell>
                            <IconButton onClick={(event) => handleOpenMenu(event, row)}>
                              <Iconify icon="eva:more-vertical-fill" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}

                  {!loading && dataFiltered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Alert severity="info" sx={{ m: 2 }}>
                          No se encontraron resultados.
                        </Alert>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            page={page}
            component="div"
            count={dataFiltered.length}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            rowsPerPageOptions={[5, 10, 25]}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      )}

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { width: 140 },
        }}
      >
        <MenuItem
          onClick={() => {
            editClient(selected);
            handleCloseMenu();
          }}
        >
          <Iconify icon="eva:edit-fill" sx={{ mr: 2 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            confirmEliminar(selected);
            handleCloseMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="eva:trash-2-outline" sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Popover>

      <Dialog open={openModal} onClose={closeModalAction} maxWidth="md" fullWidth>
        <DialogTitle>{cliente.id ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <TextField
                sx={{ width: '100%' }}
                label="Nombre"
                variant="outlined"
                size="small"
                value={cliente.nombre || ''}
                onChange={(e) => handleInput('nombre', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                sx={{ width: '100%' }}
                label="Apellido"
                variant="outlined"
                size="small"
                value={cliente.apellido || ''}
                onChange={(e) => handleInput('apellido', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                sx={{ width: '100%' }}
                label="Cedula"
                variant="outlined"
                size="small"
                value={cliente.cedula || ''}
                inputProps={{ inputMode: 'numeric' }}
                onChange={(e) => handleInput('cedula', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                sx={{ width: '100%' }}
                label="Telefono"
                variant="outlined"
                size="small"
                value={cliente.celular || ''}
                inputProps={{ inputMode: 'numeric' }}
                onChange={(e) => handleInput('celular', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl sx={{ width: '100%' }} size="small">
                <InputLabel id="select-frecuencia-label">Frecuencia</InputLabel>
                <Select
                  labelId="select-frecuencia-label"
                  id="select-frecuencia"
                  multiple
                  label="Frecuencia"
                  value={cliente.frecuencia || []}
                  input={<OutlinedInput label="Frecuencia" />}
                  onChange={handleChangeDays}
                  renderValue={(value) => value.join(', ')}
                >
                  {days.map((name) => (
                    <MenuItem key={name} value={name}>
                      <Checkbox checked={(cliente.frecuencia || []).indexOf(name) > -1} />
                      <ListItemText primary={name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                sx={{ width: '100%' }}
                label="Negocio"
                variant="outlined"
                size="small"
                value={cliente.tipo_negocio || ''}
                onChange={(e) => handleInput('tipo_negocio', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <UbicacionPicker
                latitude={cliente.latitude}
                longitude={cliente.longitude}
                onChange={handleUbicacion}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button autoFocus variant="outlined" onClick={closeModalAction}>
            Cancelar
          </Button>
          <Button onClick={registrarCliente} variant="contained" autoFocus>
            {cliente.id ? 'Actualizar' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Eliminar Cliente</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Confirma eliminar al cliente {clienteEliminar?.nombre} {clienteEliminar?.apellido}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancelar</Button>
          <Button onClick={eliminarCliente} color="error">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
