import { useEffect } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemButton from '@mui/material/ListItemButton';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useResponsive } from 'src/hooks/use-responsive';

import { account } from 'src/_mock/account';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

import { NAV } from './config-layout';
import navConfig from './config-navigation';

// ----------------------------------------------------------------------

export default function Nav({ openNav, onCloseNav, mini, onAlternarMini }) {
  const pathname = usePathname();

  const upLg = useResponsive('up', 'lg');

  // En celular el menu es un cajon que se abre entero; el modo mini es solo de escritorio
  const achicado = upLg && mini;
  const ancho = achicado ? NAV.WIDTH_MINI : NAV.WIDTH;

  useEffect(() => {
    if (openNav) {
      onCloseNav();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const renderAccount = achicado ? (
    <Tooltip title={`${account.displayName} - ${account.role}`} placement="right">
      <Avatar src={account.photoURL} alt="photoURL" sx={{ my: 3, mx: 'auto' }} />
    </Tooltip>
  ) : (
    <Box
      sx={{
        my: 3,
        mx: 2.5,
        py: 2,
        px: 2.5,
        display: 'flex',
        borderRadius: 1.5,
        alignItems: 'center',
        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
      }}
    >
      <Avatar src={account.photoURL} alt="photoURL" />

      <Box sx={{ ml: 2 }}>
        <Typography variant="subtitle2">{account.displayName}</Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {account.role}
        </Typography>
      </Box>
    </Box>
  );

  const renderMenu = (
    <Stack component="nav" spacing={0.5} sx={{ px: achicado ? 1.5 : 2 }}>
      {navConfig.map((item) => (
        <NavItem key={item.title} item={item} mini={achicado} />
      ))}
    </Stack>
  );

  const renderContent = (
    <Scrollbar
      sx={{
        height: 1,
        '& .simplebar-content': {
          height: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Stack
        direction={achicado ? 'column' : 'row'}
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ mt: 3, px: achicado ? 0 : 2, pl: achicado ? 0 : 4 }}
      >
        <Logo />

        {upLg && (
          <Tooltip title={achicado ? 'Expandir menu' : 'Achicar menu'} placement="right">
            <IconButton size="small" onClick={onAlternarMini}>
              <Iconify
                icon={achicado ? 'eva:arrowhead-right-fill' : 'eva:arrowhead-left-fill'}
                width={20}
              />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {renderAccount}

      {renderMenu}

      <Box sx={{ flexGrow: 1 }} />
    </Scrollbar>
  );

  return (
    <Box
      sx={{
        flexShrink: { lg: 0 },
        width: { lg: ancho },
        transition: (theme) => theme.transitions.create('width'),
      }}
    >
      {upLg ? (
        <Box
          sx={{
            height: 1,
            position: 'fixed',
            width: ancho,
            transition: (theme) => theme.transitions.create('width'),
            borderRight: (theme) => `dashed 1px ${theme.palette.divider}`,
          }}
        >
          {renderContent}
        </Box>
      ) : (
        <Drawer
          open={openNav}
          onClose={onCloseNav}
          PaperProps={{
            sx: {
              width: NAV.WIDTH,
            },
          }}
        >
          {renderContent}
        </Drawer>
      )}
    </Box>
  );
}

Nav.propTypes = {
  openNav: PropTypes.bool,
  onCloseNav: PropTypes.func,
  mini: PropTypes.bool,
  onAlternarMini: PropTypes.func,
};

// ----------------------------------------------------------------------

function NavItem({ item, mini }) {
  const pathname = usePathname();

  const active = item.path === pathname;

  const boton = (
    <ListItemButton
      component={RouterLink}
      href={item.path}
      sx={{
        minHeight: 44,
        borderRadius: 0.75,
        typography: 'body2',
        color: 'text.secondary',
        textTransform: 'capitalize',
        fontWeight: 'fontWeightMedium',
        ...(mini && { justifyContent: 'center', px: 0 }),
        ...(active && {
          color: 'primary.main',
          fontWeight: 'fontWeightSemiBold',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          '&:hover': {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
          },
        }),
      }}
    >
      <Box component="span" sx={{ width: 24, height: 24, mr: mini ? 0 : 2 }}>
        {item.icon}
      </Box>

      {!mini && <Box component="span">{item.title}</Box>}
    </ListItemButton>
  );

  if (!mini) return boton;

  // Sin texto visible, el nombre del modulo aparece al pasar el mouse
  return (
    <Tooltip title={item.title} placement="right">
      {boton}
    </Tooltip>
  );
}

NavItem.propTypes = {
  item: PropTypes.object,
  mini: PropTypes.bool,
};
