import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import Chart, { useChart } from 'src/components/chart';

import { moneda } from '../pedidos/estados';

const DIAS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];

// La fecha llega como YYYY-MM-DD; armarla a mano evita el corrimiento de zona
// horaria de new Date('YYYY-MM-DD'), que la toma como UTC
const etiquetaDia = (fecha) => {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const nombre = DIAS[new Date(anio, mes - 1, dia).getDay()];
  return `${nombre} ${dia}`;
};

/**
 * Lo entregado por dia en la ultima semana. Una sola serie: como la venta es al
 * contado, lo cobrado es lo mismo y no aporta una segunda barra.
 */
export default function VentasSemana({ serie }) {
  const theme = useTheme();

  const opciones = useChart({
    colors: [theme.palette.primary.main],
    plotOptions: { bar: { columnWidth: '40%', borderRadius: 4, borderRadiusApplication: 'end' } },
    xaxis: { categories: serie.map((dia) => etiquetaDia(dia.fecha)) },
    yaxis: { labels: { formatter: (valor) => moneda(valor) } },
    tooltip: { y: { formatter: (valor) => moneda(valor), title: { formatter: () => 'Entregado' } } },
    legend: { show: false },
  });

  return (
    <Card sx={{ height: 1 }}>
      <CardHeader title="Entregado por dia" subheader="Ultimos 7 dias, por fecha de la ruta" />
      <Box sx={{ p: 2, pb: 1 }}>
        <Chart
          dir="ltr"
          type="bar"
          series={[{ name: 'Entregado', data: serie.map((dia) => dia.ventas) }]}
          options={opciones}
          width="100%"
          height={300}
        />
      </Box>
    </Card>
  );
}

VentasSemana.propTypes = {
  serie: PropTypes.arrayOf(
    PropTypes.shape({ fecha: PropTypes.string, ventas: PropTypes.number })
  ).isRequired,
};
