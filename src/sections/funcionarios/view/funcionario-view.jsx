import { useState, useEffect } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Iconify from 'src/components/iconify';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import {
  Box,
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
  DialogActions,
  DialogContent,
  TableContainer,
  DialogContentText,
} from '@mui/material';

import { useAxiosPost } from '../../../hooks/useAxiosPost';

export default function FuncionariosView() {
  const postFuncionarios = useAxiosPost();
  const [open, setOpen] = useState(null);
  const [filters, setFilters] = useState('asd');
  const [resCargos, setResCargos] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(null);
  const [resFuncionario, setResFuncionario] = useState([]);
  const [paramsFuncionario, setParamsFuncionario] = useState('');

  const buscarFuncionarios = async () => {
    postFuncionarios('obtener_funcionarios', 'asd', async (resp) => {
      const { funcionario, cargos } = resp;
      setResCargos(cargos);
      setResFuncionario(funcionario);
    });
  };

  useEffect(() => {
    buscarFuncionarios();
  }, [setResCargos, setResFuncionario]);

  const openModalAction = () => {
    setOpenModal(true);
  };

  const closeModalAction = () => {
    setOpenModal(false);
  };

  const openModalConfirm = (fun) => {
    setParamsFuncionario(fun);
    setOpenConfirm(true);
  };

  const closeModalConfirm = () => {
    setOpenConfirm(false);
  };

  const handleInput = (campo, value) => {
    setParamsFuncionario({ ...paramsFuncionario, [campo]: value });
  };

  const insertarFuncionario = () => {
    postFuncionarios('registrar_funcionarios', paramsFuncionario, async (resp) => {
      const { success } = resp;
      if (success) {
        buscarFuncionarios();
      }
    });
  };

  const eliminarFuncionario = () => {
    console.log('eliminar', paramsFuncionario);
    postFuncionarios('eliminar_funcionario', paramsFuncionario, async (resp) => {
      const { success } = resp;
      if (success) {
        buscarFuncionarios();
      }
    });
    setOpenConfirm(false);
  };

  const handleOpenMenu = (event) => {
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const editFuncionario = (fun) => {
    console.log('editar', fun);
    setParamsFuncionario(fun);
    setOpen(null);
    setOpenModal(true);
  };

  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">Funcionarios</Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={openModalAction}
        >
          Nuevo Funcionario
        </Button>
      </Stack>
      <Card>
        <TableContainer sx={{ overflow: 'unset' }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Apellido</TableCell>
                <TableCell>Cedula</TableCell>
                <TableCell>Direccion</TableCell>
                <TableCell>Telefono</TableCell>
                <TableCell>Cargo</TableCell>
                <TableCell>&nbsp;</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resFuncionario.map((row) => (
                <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {row.nombre}
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {row.apellido}
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {row.cedula}
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {row.direccion}
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {row.telefono}
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {row.nombre_cargo}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={handleOpenMenu}>
                      <Iconify icon="eva:more-vertical-fill" />
                    </IconButton>
                  </TableCell>
                  <Popover
                    open={!!open}
                    anchorEl={open}
                    onClose={handleCloseMenu}
                    anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{
                      sx: { width: 140 },
                    }}
                  >
                    <MenuItem onClick={() => editFuncionario(row)}>
                      <Iconify icon="eva:edit-fill" sx={{ mr: 2 }} />
                      Edit
                    </MenuItem>

                    <MenuItem onClick={() => openModalConfirm(row)} sx={{ color: 'error.main' }}>
                      <Iconify icon="eva:trash-2-outline" sx={{ mr: 2 }} />
                      Delete
                    </MenuItem>
                  </Popover>
                </TableRow>
              ))}
              {resFuncionario.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12}>
                    <Stack sx={{ width: '100%' }} spacing={2}>
                      <Alert severity="info">No se encontraron resultados. !</Alert>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      <Dialog open={openModal} onClose={closeModalAction}>
        <DialogTitle>Nuevo Funcionario</DialogTitle>
        <Box sx={{ flexGrow: 1 }} style={{ padding: '0px 30px' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                style={{ width: '100%' }}
                value={paramsFuncionario.nombre}
                label="Nombre"
                id="outlined-basic"
                defaultValue=""
                variant="outlined"
                size="small"
                onChange={(e) => handleInput('nombre', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                style={{ width: '100%' }}
                value={paramsFuncionario.apellido}
                label="Apellido"
                id="outlined-basic"
                defaultValue=""
                variant="outlined"
                size="small"
                onChange={(e) => handleInput('apellido', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                style={{ width: '100%' }}
                value={paramsFuncionario.cedula}
                label="Cedula"
                id="outlined-basic"
                defaultValue=""
                variant="outlined"
                size="small"
                onChange={(e) => handleInput('cedula', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                style={{ width: '100%' }}
                value={paramsFuncionario.telefono}
                label="Telefono"
                id="outlined-basic"
                defaultValue=""
                variant="outlined"
                size="small"
                onChange={(e) => handleInput('telefono', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                style={{ width: '100%' }}
                value={paramsFuncionario.direccion}
                label="Direccion"
                id="outlined-basic"
                defaultValue=""
                variant="outlined"
                size="small"
                onChange={(e) => handleInput('direccion', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                style={{ width: '100%' }}
                type="date"
                label="Fecha Ingreso"
                id="outlined-basic"
                defaultValue=""
                variant="outlined"
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                style={{ width: '100%' }}
                type="date"
                label="Fecha Salida"
                id="outlined-basic"
                defaultValue=""
                variant="outlined"
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl style={{ width: '100%' }} size="small">
                <InputLabel id="demo-select-small-label">Cargos</InputLabel>
                <Select
                  labelId="demo-select-small-label"
                  id="demo-select-small"
                  label="Cargos"
                  onChange={(e) => handleInput('cargo_id', e.target.value)}
                >
                  {resCargos.map((cargo) => (
                    <MenuItem value={cargo.id} key={cargo.id}>
                      {cargo.nombre_cargo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
        <DialogActions>
          <Button autoFocus variant="outlined" onClick={closeModalAction}>
            Cancelar
          </Button>
          <Button onClick={insertarFuncionario} variant="contained" autoFocus>
            Registrar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openConfirm}
        onClose={closeModalConfirm}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Modal!</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Confirma Eliminar el funcionario?.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModalConfirm}>Cancelar</Button>
          <Button onClick={eliminarFuncionario}>Confirmar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
