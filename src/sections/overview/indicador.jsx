import PropTypes from 'prop-types';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

/**
 * Un numero del dia con su contexto. El color es del icono, nunca del numero:
 * el valor se lee siempre en tinta de texto.
 */
export default function Indicador({ titulo, valor, detalle, icono, color = 'primary', alerta }) {
  return (
    <Card sx={{ p: 2.5, height: 1 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Iconify icon={icono} width={20} sx={{ color: `${color}.main` }} />
        <Typography variant="subtitle2" color="text.secondary">
          {titulo}
        </Typography>
      </Stack>

      <Typography variant="h4">{valor}</Typography>

      {detalle && (
        <Typography variant="caption" color={alerta ? 'error.main' : 'text.secondary'}>
          {detalle}
        </Typography>
      )}
    </Card>
  );
}

Indicador.propTypes = {
  titulo: PropTypes.string.isRequired,
  valor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  detalle: PropTypes.string,
  icono: PropTypes.string.isRequired,
  color: PropTypes.string,
  alerta: PropTypes.bool,
};
