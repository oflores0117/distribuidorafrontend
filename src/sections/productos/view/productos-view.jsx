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
  Select,
  Popover,
  TableRow,
  MenuItem,
  TextField,
  TableHead,
  TableBody,
  TableCell,
  IconButton,
  InputLabel,
  FormControl,
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

export default function ProductosView() {
  const postProductos = useAxiosPost();
  const postProductosRef = useRef(postProductos);
  postProductosRef.current = postProductos;

  const postCategorias = useAxiosPost();
  const postCategoriasRef = useRef(postCategorias);
  postCategoriasRef.current = postCategorias;

  const postProveedores = useAxiosPost();
  const postProveedoresRef = useRef(postProveedores);
  postProveedoresRef.current = postProveedores;

  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [producto, setProducto] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [productoEliminar, setProductoEliminar] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const buscarCatalogos = async () => {
    postCategoriasRef.current('obtener_categorias', 'asd', async (resp) => {
      const { categorias: cats } = resp;
      setCategorias(cats);
    });
    postProveedoresRef.current('obtener_proveedores', 'asd', async (resp) => {
      const { proveedores: provs } = resp;
      setProveedores(provs);
    });
  };

  const buscarProductos = async () => {
    setLoading(true);
    postProductosRef.current('obtener_productos', 'asd', async (resp) => {
      const { productos } = resp;
      setResult(productos);
      setLoading(false);
    });
  };

  useEffect(() => {
    buscarCatalogos();
  }, [setCategorias, setProveedores]);

  useEffect(() => {
    buscarProductos();
  }, [reload, setResult]);

  const handleInput = (campo, value) => {
    setProducto((prev) => ({ ...prev, [campo]: value }));
  };

  const openModalAction = () => {
    setProducto({});
    setOpenModal(true);
  };

  const closeModalAction = () => {
    setOpenModal(false);
  };

  const editProducto = (row) => {
    setProducto({ ...row });
    setOpenModal(true);
  };

  const registrarProducto = () => {
    postProductos('insertar_producto', producto, async (resp) => {
      const { success } = resp;
      if (success) {
        setOpenModal(false);
        setReload((r) => r + 1);
        swal('Ok! Producto guardado correctamente!', {
          icon: 'success',
        });
      } else {
        swal('Error al guardar el producto!');
      }
    });
  };

  const eliminarProducto = () => {
    postProductos('eliminar_producto', productoEliminar, async (resp) => {
      const { success } = resp;
      if (success) {
        setOpenConfirm(false);
        setReload((r) => r + 1);
        swal('Ok! Producto eliminado correctamente!', {
          icon: 'success',
        });
      } else {
        swal('Error al eliminar el producto!');
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
    setProductoEliminar(row);
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

  const nombreCategoria = (row) => row.nombre_categoria || row.idCategoria;
  const nombreProveedor = (row) => row.nombre_proveedor || row.idProveedor;

  const dataFiltered = result.filter(
    (row) =>
      !filterName ||
      String(row.nombre || '').toLowerCase().includes(filterName.toLowerCase()) ||
      String(row.codigo || '').toLowerCase().includes(filterName.toLowerCase())
  );

  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">Productos</Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={openModalAction}
        >
          Nuevo Producto
        </Button>
      </Stack>

      <Card>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, pb: 0 }}>
          <TextField
            value={filterName}
            onChange={handleFilterByName}
            placeholder="Buscar por nombre o código..."
            size="small"
            sx={{ width: { xs: '100%', sm: 350 } }}
            InputProps={{
              startAdornment: <Iconify icon="eva:search-fill" sx={{ mr: 1, opacity: 0.6 }} />,
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {dataFiltered.length} producto(s)
          </Typography>
        </Stack>

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Proveedor</TableCell>
                  <TableCell>P. Compra</TableCell>
                  <TableCell>P. Venta</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>&nbsp;</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress size={28} sx={{ my: 3 }} />
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  dataFiltered
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <TableRow
                        key={row.idProducto}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell>{row.codigo}</TableCell>
                        <TableCell component="th" scope="row">
                          {row.nombre}
                        </TableCell>
                        <TableCell>{nombreCategoria(row)}</TableCell>
                        <TableCell>{nombreProveedor(row)}</TableCell>
                        <TableCell>{row.precioCompra}</TableCell>
                        <TableCell>{row.precioVenta}</TableCell>
                        <TableCell>{row.stockActual}</TableCell>
                        <TableCell>{row.estado}</TableCell>
                        <TableCell>
                          <IconButton onClick={(event) => handleOpenMenu(event, row)}>
                            <Iconify icon="eva:more-vertical-fill" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}

                {!loading && dataFiltered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9}>
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
            editProducto(selected);
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
        <DialogTitle>{producto.idProducto ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <TextField
                sx={{ width: '100%' }}
                label="Código"
                variant="outlined"
                size="small"
                value={producto.codigo || ''}
                onChange={(e) => handleInput('codigo', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                sx={{ width: '100%' }}
                label="Nombre"
                variant="outlined"
                size="small"
                value={producto.nombre || ''}
                onChange={(e) => handleInput('nombre', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                sx={{ width: '100%' }}
                label="Descripción"
                variant="outlined"
                size="small"
                multiline
                minRows={2}
                value={producto.descripcion || ''}
                onChange={(e) => handleInput('descripcion', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl sx={{ width: '100%' }} size="small">
                <InputLabel id="select-categoria-label">Categoría</InputLabel>
                <Select
                  labelId="select-categoria-label"
                  id="select-categoria"
                  label="Categoría"
                  value={producto.idCategoria || ''}
                  onChange={(e) => handleInput('idCategoria', e.target.value)}
                >
                  {categorias.map((categoria) => (
                    <MenuItem value={categoria.idCategoria} key={categoria.idCategoria}>
                      {categoria.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl sx={{ width: '100%' }} size="small">
                <InputLabel id="select-proveedor-label">Proveedor</InputLabel>
                <Select
                  labelId="select-proveedor-label"
                  id="select-proveedor"
                  label="Proveedor"
                  value={producto.idProveedor || ''}
                  onChange={(e) => handleInput('idProveedor', e.target.value)}
                >
                  {proveedores.map((proveedor) => (
                    <MenuItem value={proveedor.idProveedor} key={proveedor.idProveedor}>
                      {proveedor.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                sx={{ width: '100%' }}
                label="Precio Compra"
                variant="outlined"
                size="small"
                type="number"
                value={producto.precioCompra || ''}
                onChange={(e) => handleInput('precioCompra', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                sx={{ width: '100%' }}
                label="Precio Venta"
                variant="outlined"
                size="small"
                type="number"
                value={producto.precioVenta || ''}
                onChange={(e) => handleInput('precioVenta', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                sx={{ width: '100%' }}
                label="Stock Actual"
                variant="outlined"
                size="small"
                type="number"
                value={producto.stockActual || ''}
                onChange={(e) => handleInput('stockActual', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                sx={{ width: '100%' }}
                label="Stock Mínimo"
                variant="outlined"
                size="small"
                type="number"
                value={producto.stockMinimo || ''}
                onChange={(e) => handleInput('stockMinimo', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl sx={{ width: '100%' }} size="small">
                <InputLabel id="select-estado-label">Estado</InputLabel>
                <Select
                  labelId="select-estado-label"
                  id="select-estado"
                  label="Estado"
                  value={producto.estado || ''}
                  onChange={(e) => handleInput('estado', e.target.value)}
                >
                  <MenuItem value="Activo">Activo</MenuItem>
                  <MenuItem value="Inactivo">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button autoFocus variant="outlined" onClick={closeModalAction}>
            Cancelar
          </Button>
          <Button onClick={registrarProducto} variant="contained" autoFocus>
            {producto.idProducto ? 'Actualizar' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Eliminar Producto</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Confirma eliminar el producto {productoEliminar?.nombre}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancelar</Button>
          <Button onClick={eliminarProducto} color="error">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
