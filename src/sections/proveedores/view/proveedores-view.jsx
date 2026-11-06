import swal from 'sweetalert';
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
  Popover,
  TableRow,
  MenuItem,
  TextField,
  TableHead,
  TableBody,
  TableCell,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  TablePagination,
  CircularProgress,
  DialogContentText,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

import { useAxiosPost } from '../../../hooks/useAxiosPost';

export default function ProveedoresView() {
  const postProveedores = useAxiosPost();
  const postProveedoresRef = useRef(postProveedores);
  postProveedoresRef.current = postProveedores;

  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const [proveedor, setProveedor] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [proveedorEliminar, setProveedorEliminar] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const buscarProveedores = async () => {
    setLoading(true);
    postProveedoresRef.current('obtener_proveedores', 'asd', async (resp) => {
      const { proveedores } = resp;
      setResult(proveedores);
      setLoading(false);
    });
  };

  useEffect(() => {
    buscarProveedores();
  }, [reload, setResult]);

  const handleInput = (campo, value) => {
    setProveedor((prev) => ({ ...prev, [campo]: value }));
  };

  const openModalAction = () => {
    setProveedor({});
    setOpenModal(true);
  };

  const closeModalAction = () => {
    setOpenModal(false);
  };

  const editProveedor = (row) => {
    setProveedor({ ...row });
    setOpenModal(true);
  };

  const registrarProveedor = () => {
    postProveedores('insertar_proveedor', proveedor, async (resp) => {
      const { success } = resp;
      if (success) {
        setOpenModal(false);
        setReload((r) => r + 1);
        swal('Ok! Proveedor guardado correctamente!', {
          icon: 'success',
        });
      } else {
        swal('Error al guardar el proveedor!');
      }
    });
  };

  const eliminarProveedor = () => {
    postProveedores('eliminar_proveedor', proveedorEliminar, async (resp) => {
      const { success } = resp;
      if (success) {
        setOpenConfirm(false);
        setReload((r) => r + 1);
        swal('Ok! Proveedor eliminado correctamente!', {
          icon: 'success',
        });
      } else {
        swal('Error al eliminar el proveedor!');
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
    setProveedorEliminar(row);
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
      String(row.correo || '').toLowerCase().includes(filterName.toLowerCase())
  );

  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">Proveedores</Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={openModalAction}
        >
          Nuevo Proveedor
        </Button>
      </Stack>

      <Card>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, pb: 0 }}>
          <TextField
            value={filterName}
            onChange={handleFilterByName}
            placeholder="Buscar por nombre o correo..."
            size="small"
            sx={{ width: { xs: '100%', sm: 350 } }}
            InputProps={{
              startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, opacity: 0.6 }} />,
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {dataFiltered.length} proveedor(es)
          </Typography>
        </Stack>

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Correo</TableCell>
                  <TableCell>&nbsp;</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress size={28} sx={{ my: 3 }} />
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  dataFiltered
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <TableRow
                        key={row.idProveedor}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          {row.nombre}
                        </TableCell>
                        <TableCell>{row.telefono}</TableCell>
                        <TableCell>{row.correo}</TableCell>
                        <TableCell>
                          <IconButton onClick={(event) => handleOpenMenu(event, row)}>
                            <Iconify icon="eva:more-vertical-fill" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}

                {!loading && dataFiltered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
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
            editProveedor(selected);
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

      <Dialog open={openModal} onClose={closeModalAction} maxWidth="sm" fullWidth>
        <DialogTitle>{proveedor.idProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                sx={{ width: '100%' }}
                label="Nombre"
                variant="outlined"
                size="small"
                value={proveedor.nombre || ''}
                onChange={(e) => handleInput('nombre', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                sx={{ width: '100%' }}
                label="Teléfono"
                variant="outlined"
                size="small"
                value={proveedor.telefono || ''}
                inputProps={{ inputMode: 'numeric' }}
                onChange={(e) => handleInput('telefono', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                sx={{ width: '100%' }}
                label="Correo"
                variant="outlined"
                size="small"
                type="email"
                value={proveedor.correo || ''}
                onChange={(e) => handleInput('correo', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button autoFocus variant="outlined" onClick={closeModalAction}>
            Cancelar
          </Button>
          <Button onClick={registrarProveedor} variant="contained" autoFocus>
            {proveedor.idProveedor ? 'Actualizar' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Eliminar Proveedor</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Confirma eliminar al proveedor {proveedorEliminar?.nombre}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancelar</Button>
          <Button onClick={eliminarProveedor} color="error">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
