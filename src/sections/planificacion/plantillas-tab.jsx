import swal from 'sweetalert';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Table,
  Stack,
  Button,
  Dialog,
  Select,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  InputLabel,
  IconButton,
  FormControl,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { apiPost } from 'src/api/client';

import Iconify from 'src/components/iconify';

export const DIAS_SEMANA = [
  { valor: 1, nombre: 'Lunes' },
  { valor: 2, nombre: 'Martes' },
  { valor: 3, nombre: 'Miercoles' },
  { valor: 4, nombre: 'Jueves' },
  { valor: 5, nombre: 'Viernes' },
  { valor: 6, nombre: 'Sabado' },
  { valor: 7, nombre: 'Domingo' },
];

const nombreDia = (valor) => {
  const dia = DIAS_SEMANA.find((d) => d.valor === Number(valor));
  return dia ? dia.nombre : '-';
};

const PLANTILLA_VACIA = {
  nombre: '',
  idZona: '',
  idFuncionario: '',
  idVehiculo: '',
  diaSemana: 1,
  horaSalida: '08:00',
};

export default function PlantillasTab({ onPlantillasChange }) {
  const [cargando, setCargando] = useState(true);
  const [plantillas, setPlantillas] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(PLANTILLA_VACIA);

  const buscar = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await apiPost('obtener_ruta_plantillas');
      setPlantillas(resp.plantillas || []);
      setZonas(resp.zonas || []);
      setFuncionarios(resp.funcionarios || []);
      setVehiculos(resp.vehiculos || []);
      if (onPlantillasChange) onPlantillasChange(resp.plantillas || []);
    } catch (err) {
      swal('No se pudieron cargar las plantillas', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, [onPlantillasChange]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  const abrirNueva = () => {
    setForm(PLANTILLA_VACIA);
    setAbierto(true);
  };

  const abrirEdicion = (plantilla) => {
    setForm({
      idRutaPlantilla: plantilla.idRutaPlantilla,
      nombre: plantilla.nombre,
      idZona: plantilla.idZona,
      idFuncionario: plantilla.idFuncionario || '',
      idVehiculo: plantilla.idVehiculo || '',
      diaSemana: plantilla.diaSemana,
      horaSalida: plantilla.horaSalida || '08:00',
    });
    setAbierto(true);
  };

  const cambiar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const guardar = async () => {
    if (!form.nombre || !form.idZona) {
      swal('Faltan datos', 'El nombre y la zona son obligatorios', 'warning');
      return;
    }
    try {
      const resp = await apiPost('registrar_ruta_plantilla', form);
      if (!resp.success) {
        swal('Error', resp.error || 'No se pudo guardar', 'error');
        return;
      }
      setAbierto(false);
      buscar();
    } catch (err) {
      swal('Error', err.message, 'error');
    }
  };

  const eliminar = async (plantilla) => {
    const confirmado = await swal({
      title: `Dar de baja "${plantilla.nombre}"?`,
      icon: 'warning',
      buttons: true,
      dangerMode: true,
    });
    if (!confirmado) return;

    const resp = await apiPost('eliminar_ruta_plantilla', {
      idRutaPlantilla: plantilla.idRutaPlantilla,
    });
    if (resp.success) buscar();
  };

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={abrirNueva}
        >
          Nueva plantilla
        </Button>
      </Stack>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Zona</TableCell>
                <TableCell>Repartidor</TableCell>
                <TableCell>Vehiculo</TableCell>
                <TableCell>Dia</TableCell>
                <TableCell>Salida</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plantillas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    Aun no hay plantillas. Crea una para poder generar rutas del dia.
                  </TableCell>
                </TableRow>
              )}
              {plantillas.map((p) => (
                <TableRow key={p.idRutaPlantilla} hover>
                  <TableCell>{p.nombre}</TableCell>
                  <TableCell>{p.zona ? p.zona.nombre : '-'}</TableCell>
                  <TableCell>
                    {p.funcionario ? `${p.funcionario.nombre} ${p.funcionario.apellido || ''}` : '-'}
                  </TableCell>
                  <TableCell>{p.vehiculo ? p.vehiculo.placa : '-'}</TableCell>
                  <TableCell>{nombreDia(p.diaSemana)}</TableCell>
                  <TableCell>{p.horaSalida || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => abrirEdicion(p)}>
                      <Iconify icon="eva:edit-fill" />
                    </IconButton>
                    <IconButton color="error" onClick={() => eliminar(p)}>
                      <Iconify icon="eva:trash-2-outline" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={abierto} onClose={() => setAbierto(false)} fullWidth maxWidth="sm">
        <DialogTitle>{form.idRutaPlantilla ? 'Editar plantilla' : 'Nueva plantilla'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              value={form.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Zona</InputLabel>
              <Select
                label="Zona"
                value={form.idZona}
                onChange={(e) => cambiar('idZona', e.target.value)}
              >
                {zonas.map((z) => (
                  <MenuItem key={z.idZona} value={z.idZona}>
                    {z.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Repartidor</InputLabel>
              <Select
                label="Repartidor"
                value={form.idFuncionario}
                onChange={(e) => cambiar('idFuncionario', e.target.value)}
              >
                {funcionarios.map((f) => (
                  <MenuItem key={f.idFuncionario} value={f.idFuncionario}>
                    {`${f.nombre} ${f.apellido || ''}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Vehiculo</InputLabel>
              <Select
                label="Vehiculo"
                value={form.idVehiculo}
                onChange={(e) => cambiar('idVehiculo', e.target.value)}
              >
                {vehiculos.map((v) => (
                  <MenuItem key={v.idVehiculo} value={v.idVehiculo}>
                    {`${v.placa} ${v.descripcion || ''}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Dia de visita</InputLabel>
              <Select
                label="Dia de visita"
                value={form.diaSemana}
                onChange={(e) => cambiar('diaSemana', e.target.value)}
              >
                {DIAS_SEMANA.map((d) => (
                  <MenuItem key={d.valor} value={d.valor}>
                    {d.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Hora de salida"
              type="time"
              value={form.horaSalida}
              onChange={(e) => cambiar('horaSalida', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbierto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardar}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

PlantillasTab.propTypes = {
  onPlantillasChange: PropTypes.func,
};
