import PropTypes from 'prop-types';

import { Card, Chip, Stack, Divider, CardHeader, Typography } from '@mui/material';

import { RouterLink } from 'src/routes/components';

/**
 * Productos para reponer: sin stock o en su minimo. Ordenados por lo lejos que
 * estan del minimo, asi lo mas urgente queda arriba.
 */
export default function AlertasStock({ stock }) {
  const total = stock.sinStock + stock.bajoMinimo;

  return (
    <Card sx={{ height: 1 }}>
      <CardHeader
        title="Reponer stock"
        subheader={
          total === 0
            ? 'Todo por encima del minimo'
            : `${stock.sinStock} sin stock · ${stock.bajoMinimo} bajo el minimo`
        }
        action={
          <Chip
            size="small"
            variant="outlined"
            label="Inventario"
            component={RouterLink}
            href="/inventario"
            clickable
          />
        }
      />

      <Stack divider={<Divider />} sx={{ px: 3, pb: 2 }}>
        {stock.productos.map((producto) => (
          <Stack key={producto.idProducto} direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
            <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap>
                {producto.nombre}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {`${producto.codigo || ''} · minimo ${producto.stockMinimo}`}
              </Typography>
            </Stack>
            <Typography variant="subtitle2">{producto.stockActual}</Typography>
            <Chip
              size="small"
              color={producto.alerta === 'sin_stock' ? 'error' : 'warning'}
              label={producto.alerta === 'sin_stock' ? 'sin stock' : 'bajo minimo'}
            />
          </Stack>
        ))}

        {total > stock.productos.length && (
          <Typography variant="caption" color="text.secondary" sx={{ pt: 1 }}>
            {`Y ${total - stock.productos.length} mas en inventario.`}
          </Typography>
        )}
      </Stack>
    </Card>
  );
}

AlertasStock.propTypes = {
  stock: PropTypes.shape({
    sinStock: PropTypes.number,
    bajoMinimo: PropTypes.number,
    productos: PropTypes.array,
  }).isRequired,
};
