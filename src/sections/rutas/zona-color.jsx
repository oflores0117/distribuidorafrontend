import PropTypes from 'prop-types';

import { Box, Stack, Tooltip, Typography } from '@mui/material';

// Colores separados entre si para distinguir zonas vecinas de un vistazo
const SUGERIDOS = [
  '#1976d2',
  '#2e7d32',
  '#c62828',
  '#f9a825',
  '#6a1b9a',
  '#00838f',
  '#ef6c00',
  '#4e342e',
];

export default function ZonaColor({ color, onChange }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="body2" color="text.secondary">
        Color
      </Typography>

      <Box
        component="input"
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          width: 40,
          height: 34,
          p: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
        }}
      />

      <Stack direction="row" spacing={0.5}>
        {SUGERIDOS.map((sugerido) => (
          <Tooltip key={sugerido} title={sugerido}>
            <Box
              component="button"
              type="button"
              aria-label={`Usar color ${sugerido}`}
              onClick={() => onChange(sugerido)}
              sx={{
                width: 20,
                height: 20,
                p: 0,
                borderRadius: '50%',
                cursor: 'pointer',
                bgcolor: sugerido,
                border: (theme) =>
                  `2px solid ${color === sugerido ? theme.palette.text.primary : 'transparent'}`,
              }}
            />
          </Tooltip>
        ))}
      </Stack>
    </Stack>
  );
}

ZonaColor.propTypes = {
  color: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
