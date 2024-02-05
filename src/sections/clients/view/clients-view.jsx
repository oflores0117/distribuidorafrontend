import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Popover from '@mui/material/Popover';
import Iconify from 'src/components/iconify';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/DialogContentText';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import DialogActions from '@mui/material/DialogActions';
import OutlinedInput from '@mui/material/OutlinedInput';
import TableContainer from '@mui/material/TableContainer';
import { useAxiosPost } from '../../../hooks/useAxiosPost';

export default function ClientsView() {
  const postClientes = useAxiosPost();

  const [params, setParams] = useState('');
  const [cliente, setCliente] = useState('');
  const [result, setResult] = useState([]);
  const [open, setOpen] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [dayNames, setDayNames] = useState([]);

  const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

  const handleOpenMenu = (event) => {
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  useEffect(() => {
    const buscarClientes = async () => {
      postClientes('obtener_clientes', 'asd', async (resp) => {
        const { clientes } = resp;
        setResult(clientes);
      });
    };
    buscarClientes();
  }, [setResult]);
  const openModalAction = () => {
    setOpenModal(true);
    setCliente('');
  };

  const closeModalAction = () => {
    setOpenModal(false);
  };

  const handleChangeDays = (event) => {
    const {
      target: { value },
    } = event;
    setDayNames(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    );
  };

  const editClient = (paramsCliente) => {
    setCliente(paramsCliente);
    setOpenModal(true);
  };
  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">Clientes</Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={openModalAction}
        >
          Nuevo Cliente
        </Button>
      </Stack>
      <div style={{ height: 400, width: '100%' }}>
        <TableContainer sx={{ overflow: 'unset' }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Apellidos</TableCell>
                <TableCell>Cedula</TableCell>
                <TableCell>Telefono</TableCell>
                <TableCell>&nbsp;</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.map((row) => (
                <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {row.nombre}
                  </TableCell>
                  <TableCell>{row.apellido}</TableCell>
                  <TableCell>{row.cedula}</TableCell>
                  <TableCell>{row.telefono}</TableCell>
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
                    <MenuItem onClick={() => editClient(row)}>
                      <Iconify icon="eva:edit-fill" sx={{ mr: 2 }} />
                      Edit
                    </MenuItem>

                    <MenuItem onClick={handleCloseMenu} sx={{ color: 'error.main' }}>
                      <Iconify icon="eva:trash-2-outline" sx={{ mr: 2 }} />
                      Delete
                    </MenuItem>
                  </Popover>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <Dialog open={openModal} onClose={closeModalAction}>
        <DialogTitle>Nuevo Cliente</DialogTitle>
        <Box sx={{ flexGrow: 1 }} style={{ padding: '0px 30px' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                style={{ width: '100%' }}
                label="Nombre"
                id="outlined-basic"
                defaultValue=""
                value={cliente.nombre}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                style={{ width: '100%' }}
                label="Apellido"
                id="filled-size-small"
                defaultValue=""
                value={cliente.apellido}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={8} md={6}>
              <TextField
                style={{ width: '100%' }}
                label="Cedula"
                id="filled-size-small"
                defaultValue=""
                value={cliente.cedula}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                style={{ width: '100%' }}
                label="Telefono"
                id="filled-size-small"
                defaultValue=""
                value={cliente.telefono}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl sx={{ m: 0 }} style={{ width: '100%' }} size="small">
                <InputLabel id="demo-multiple-checkbox-label">Frecuencia</InputLabel>
                <Select
                  labelId="demo-multiple-checkbox-label"
                  id="demo-multiple-checkbox"
                  multiple
                  value={dayNames}
                  input={<OutlinedInput label="Frecuencia" />}
                  onChange={handleChangeDays}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {days.map((name) => (
                    <MenuItem key={name} value={name}>
                      <Checkbox checked={dayNames.indexOf(name) > -1} />
                      <ListItemText primary={name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl sx={{ m: 0 }} style={{ width: '100%' }} size="small">
                <InputLabel id="demo-multiple-checkbox-label">Negocio</InputLabel>
                <Select
                  labelId="demo-multiple-checkbox-label"
                  id="demo-multiple-checkbox"
                  multiple
                  value={dayNames}
                  input={<OutlinedInput label="Negocio" />}
                  onChange={handleChangeDays}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {days.map((name) => (
                    <MenuItem key={name} value={name}>
                      <Checkbox checked={dayNames.indexOf(name) > -1} />
                      <ListItemText primary={name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
        <DialogActions>
          <Button autoFocus onClick={closeModalAction}>
            Cancelar
          </Button>
          <Button onClick={closeModalAction} autoFocus>
            Registrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
