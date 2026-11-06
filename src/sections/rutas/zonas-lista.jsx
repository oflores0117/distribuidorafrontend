import PropTypes from 'prop-types';

import {
  Box,
  Chip,
  Table,
  Alert,
  Stack,
  Tooltip,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  TableContainer,
} from '@mui/material';

import Iconify from 'src/components/iconify';

export default function ZonasLista({
  zonas,
  zonaVista,
  onVer,
  onEditar,
  onRecalcular,
  onDarDeBaja,
}) {
  if (zonas.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Todavia no hay zonas. Pulsa &quot;Nueva zona&quot; y marca el territorio en el mapa.
      </Alert>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Zona</TableCell>
            <TableCell align="right">Clientes</TableCell>
            <TableCell align="right">&nbsp;</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {zonas.map((zona) => (
            <TableRow
              key={zona.idZona}
              hover
              selected={zonaVista === zona.idZona}
              sx={{ cursor: 'pointer' }}
              onClick={() => onVer(zona)}
            >
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      flexShrink: 0,
                      bgcolor: zona.color || '#000',
                    }}
                  />
                  <Box>
                    <Typography variant="body2">{zona.nombre}</Typography>
                    {!zona.valido && (
                      <Chip size="small" color="error" label="poligono invalido" sx={{ mt: 0.5 }} />
                    )}
                  </Box>
                </Stack>
              </TableCell>
              <TableCell align="right">{zona.clientes}</TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={0} justifyContent="flex-end">
                  <Tooltip title="Editar el poligono">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditar(zona);
                      }}
                    >
                      <Iconify icon="eva:edit-fill" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Recalcular los clientes de esta zona">
                    <IconButton
                      size="small"
                      disabled={!zona.valido}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRecalcular(zona);
                      }}
                    >
                      <Iconify icon="eva:sync-fill" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Dar de baja">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDarDeBaja(zona);
                      }}
                    >
                      <Iconify icon="eva:trash-2-outline" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

ZonasLista.propTypes = {
  zonas: PropTypes.array,
  zonaVista: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onVer: PropTypes.func.isRequired,
  onEditar: PropTypes.func.isRequired,
  onRecalcular: PropTypes.func.isRequired,
  onDarDeBaja: PropTypes.func.isRequired,
};

ZonasLista.defaultProps = {
  zonas: [],
  zonaVista: null,
};
