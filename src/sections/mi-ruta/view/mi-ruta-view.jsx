import swal from 'sweetalert';
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Alert,
  Stack,
  Button,
  Select,
  MenuItem,
  TextField,
  Container,
  InputLabel,
  Typography,
  FormControl,
  CardContent,
  LinearProgress,
  CircularProgress,
} from '@mui/material';

import { apiPost } from 'src/api/client';

import ParadaCard from '../parada-card';
import { moneda } from '../../pedidos/estados';
import EntregaDialog from '../../planificacion/entrega-dialog';

const hoy = () => new Date().toISOString().slice(0, 10);

/**
 * La ruta del dia como la ve el repartidor, pensada para el celular: las
 * paradas en orden y el cierre de cada una a un toque.
 *
 * Mientras no exista login (Fase 1) el repartidor se elige a mano en el
 * selector. Cuando haya sesion, el idFuncionario sale del usuario logueado y
 * el selector desaparece.
 */
export default function MiRutaView() {
  const [cargando, setCargando] = useState(false);
  const [funcionarios, setFuncionarios] = useState([]);
  const [idFuncionario, setIdFuncionario] = useState('');
  const [fecha, setFecha] = useState(hoy());
  const [ruta, setRuta] = useState(null);
  const [paradaEntrega, setParadaEntrega] = useState(null);

  useEffect(() => {
    apiPost('obtener_funcionarios')
      .then((resp) => setFuncionarios(resp.funcionario || []))
      .catch(() => setFuncionarios([]));
  }, []);

  const buscar = useCallback(async () => {
    if (!idFuncionario) {
      setRuta(null);
      return;
    }

    setCargando(true);
    try {
      const resp = await apiPost('obtener_mi_ruta', { idFuncionario, fecha });
      // Sin ruta asignada el backend responde success con ruta en null
      setRuta(resp.ruta || null);
    } catch (err) {
      swal('No se pudo cargar la ruta', err.message, 'error');
      setRuta(null);
    } finally {
      setCargando(false);
    }
  }, [idFuncionario, fecha]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  const iniciarRuta = async () => {
    try {
      const resp = await apiPost('cambiar_estado_ruta_dia', {
        idRutaDia: ruta.idRutaDia,
        estado: 'en_curso',
      });
      if (!resp.success) {
        swal('No se pudo iniciar', resp.error || '', 'warning');
        return;
      }
      buscar();
    } catch (err) {
      swal('Error', err.message, 'error');
    }
  };

  const paradas = ruta ? ruta.paradas || [] : [];
  const pendientes = paradas.filter((parada) => parada.estado === 'pendiente');
  const cerradas = paradas.length - pendientes.length;
  const avance = paradas.length > 0 ? (cerradas / paradas.length) * 100 : 0;
  // La proxima casa: la primera pendiente del recorrido
  const siguiente = pendientes.length > 0 ? pendientes[0].idRutaParada : null;

  const cobrado = paradas.reduce((total, parada) => {
    if (parada.estado !== 'entregado' && parada.estado !== 'parcial') return total;
    return total + (Number(parada.montoEntregado) || 0);
  }, 0);

  // Lo que el repartidor tiene que rendir al volver: transferencias y QR no
  // pasan por sus manos
  const efectivo = paradas.reduce((total, parada) => {
    if (!parada.cobro || parada.cobro.medio !== 'efectivo') return total;
    return total + (Number(parada.cobro.monto) || 0);
  }, 0);

  return (
    <Container maxWidth="sm" sx={{ pb: 5 }}>
      <Stack mb={3}>
        <Typography variant="h4">Mi ruta</Typography>
        <Typography variant="body2" color="text.secondary">
          Las paradas del dia en orden. Cierra cada una en el momento de entregar.
        </Typography>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel id="repartidor">Repartidor</InputLabel>
              <Select
                labelId="repartidor"
                label="Repartidor"
                value={idFuncionario}
                onChange={(e) => setIdFuncionario(e.target.value)}
              >
                {funcionarios.map((funcionario) => (
                  <MenuItem key={funcionario.idFuncionario} value={funcionario.idFuncionario}>
                    {`${funcionario.nombre} ${funcionario.apellido || ''}`.trim()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              fullWidth
              type="date"
              label="Fecha"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </CardContent>
      </Card>

      {cargando && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {!cargando && !idFuncionario && (
        <Alert severity="info">Elige el repartidor para ver su ruta del dia.</Alert>
      )}

      {!cargando && idFuncionario && !ruta && (
        <Alert severity="info">No hay ninguna ruta asignada para esa fecha.</Alert>
      )}

      {!cargando && ruta && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {ruta.zona ? ruta.zona.nombre : 'Ruta'}
                  </Typography>
                  <Chip size="small" label={ruta.estado} />
                  {ruta.vehiculo && (
                    <Chip size="small" variant="outlined" label={ruta.vehiculo.placa} />
                  )}
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={avance}
                  color={pendientes.length === 0 ? 'success' : 'primary'}
                />

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip size="small" label={`${cerradas} de ${paradas.length} paradas`} />
                  {pendientes.length > 0 && (
                    <Chip size="small" color="warning" label={`${pendientes.length} pendiente(s)`} />
                  )}
                  {cobrado > 0 && (
                    <Chip size="small" color="success" label={`entregado ${moneda(cobrado)}`} />
                  )}
                  {efectivo > 0 && (
                    <Chip
                      size="small"
                      variant="outlined"
                      color="success"
                      label={`efectivo a rendir ${moneda(efectivo)}`}
                    />
                  )}
                </Stack>

                {ruta.estado === 'planificada' && (
                  <>
                    <Alert severity="warning">
                      La ruta todavia no arranco. Inicia la ruta para poder registrar entregas.
                    </Alert>
                    <Button variant="contained" onClick={iniciarRuta}>
                      Iniciar ruta
                    </Button>
                  </>
                )}

                {ruta.estado === 'en_curso' && pendientes.length === 0 && (
                  <Alert severity="success">
                    Cerraste todas las paradas. Vuelve al deposito para el conteo del camion
                    {efectivo > 0 ? ` y la rendicion de ${moneda(efectivo)} en efectivo` : ''}.
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Stack spacing={2}>
            {paradas.map((parada, indice) => (
              <ParadaCard
                key={parada.idRutaParada}
                parada={parada}
                posicion={indice + 1}
                esSiguiente={parada.idRutaParada === siguiente}
                onEntregar={setParadaEntrega}
              />
            ))}

            {paradas.length === 0 && (
              <Alert severity="info">Esta ruta no tiene paradas cargadas.</Alert>
            )}
          </Stack>
        </>
      )}

      <EntregaDialog
        idRutaParada={paradaEntrega ? paradaEntrega.idRutaParada : null}
        abierto={Boolean(paradaEntrega)}
        onCerrar={() => setParadaEntrega(null)}
        onGuardado={() => {
          setParadaEntrega(null);
          buscar();
        }}
      />
    </Container>
  );
}
