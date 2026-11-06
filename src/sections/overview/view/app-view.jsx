import swal from 'sweetalert';
import { useState, useEffect, useCallback } from 'react';

import Grid from '@mui/material/Unstable_Grid2';
import {
  Box,
  Card,
  Chip,
  Stack,
  Container,
  TextField,
  CardHeader,
  Typography,
  CircularProgress,
} from '@mui/material';

import { apiPost } from 'src/api/client';

import Indicador from '../indicador';
import RutasDelDia from '../rutas-del-dia';
import AlertasStock from '../alertas-stock';
import VentasSemana from '../ventas-semana';
import { moneda } from '../../pedidos/estados';
import { ESTADOS_PARADA, ETIQUETA_PARADA } from '../../planificacion/entregas';

// Fecha local, no UTC: a la noche toISOString ya daria el dia siguiente
const hoy = () => {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

/**
 * Inicio: como va el reparto del dia, cuanto se vendio y cobro, que plata
 * falta rendir y que hay que reponer. Todo sale de obtener_resumen_dashboard.
 */
export default function AppView() {
  const [fecha, setFecha] = useState(hoy());
  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState(null);

  const buscar = useCallback(async () => {
    setCargando(true);
    try {
      const resp = await apiPost('obtener_resumen_dashboard', { fecha });
      if (!resp.success) {
        swal('Error', resp.error || 'No se pudo cargar el resumen', 'error');
        return;
      }
      setDatos(resp);
    } catch (err) {
      swal('No se pudo cargar el resumen', err.message, 'error');
    } finally {
      setCargando(false);
    }
  }, [fecha]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  const kpis = datos ? datos.kpis : null;

  return (
    <Container maxWidth="xl">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4">Resumen del reparto</Typography>
          <Typography variant="body2" color="text.secondary">
            Lo que paso en las rutas del dia elegido
          </Typography>
        </Box>
        <TextField
          size="small"
          type="date"
          label="Fecha"
          value={fecha}
          onChange={(e) => setFecha(e.target.value || hoy())}
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      {cargando && !datos && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {datos && (
        <Grid container spacing={3} sx={{ opacity: cargando ? 0.6 : 1 }}>
          <Grid xs={12} sm={6} md={4} lg={2}>
            <Indicador
              titulo="Entregado"
              valor={moneda(kpis.ventas)}
              detalle={`${kpis.rutas} ruta(s)`}
              icono="eva:shopping-bag-fill"
            />
          </Grid>
          <Grid xs={12} sm={6} md={4} lg={2}>
            <Indicador
              titulo="Cobrado"
              valor={moneda(kpis.cobrado)}
              detalle={`${moneda(kpis.efectivo)} en efectivo`}
              icono="eva:credit-card-fill"
              color="success"
            />
          </Grid>
          <Grid xs={12} sm={6} md={4} lg={2}>
            <Indicador
              titulo="Paradas"
              valor={`${kpis.paradasCerradas}/${kpis.paradas}`}
              detalle={
                kpis.paradas > kpis.paradasCerradas
                  ? `${kpis.paradas - kpis.paradasCerradas} pendiente(s)`
                  : 'todas cerradas'
              }
              icono="eva:pin-fill"
              color="info"
            />
          </Grid>
          <Grid xs={12} sm={6} md={4} lg={2}>
            <Indicador
              titulo="Pedidos en cola"
              valor={datos.pedidos.pendiente}
              detalle={`${datos.pedidos.en_ruta} en ruta`}
              icono="eva:file-text-fill"
              color="warning"
            />
          </Grid>
          <Grid xs={12} sm={6} md={4} lg={2}>
            <Indicador
              titulo="Efectivo sin rendir"
              valor={moneda(datos.sinRendir.monto)}
              detalle={`${datos.sinRendir.rutas} ruta(s), de cualquier dia`}
              icono="eva:alert-circle-fill"
              color="warning"
              alerta={datos.sinRendir.monto > 0}
            />
          </Grid>
          <Grid xs={12} sm={6} md={4} lg={2}>
            <Indicador
              titulo="Faltante"
              valor={`${kpis.faltante} u.`}
              detalle={kpis.faltante > 0 ? 'no volvio ni figura entregado' : 'sin faltantes'}
              icono="eva:cube-fill"
              color="error"
              alerta={kpis.faltante > 0}
            />
          </Grid>

          <Grid xs={12} lg={7}>
            <RutasDelDia rutas={datos.rutas} />
          </Grid>
          <Grid xs={12} lg={5}>
            <Card sx={{ height: 1 }}>
              <CardHeader title="Resultado de las paradas" />
              <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} sx={{ p: 3 }}>
                {ESTADOS_PARADA.map((estado) => (
                  <Chip
                    key={estado}
                    color={ETIQUETA_PARADA[estado].color}
                    variant={datos.resultados[estado] > 0 ? 'filled' : 'outlined'}
                    label={`${ETIQUETA_PARADA[estado].texto}: ${datos.resultados[estado] || 0}`}
                  />
                ))}
              </Stack>
            </Card>
          </Grid>

          <Grid xs={12} md={7}>
            <VentasSemana serie={datos.serie} />
          </Grid>
          <Grid xs={12} md={5}>
            <AlertasStock stock={datos.stock} />
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
