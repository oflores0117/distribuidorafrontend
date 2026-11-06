import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import Nav from './nav';
import Main from './main';
import Header from './header';
import { NAV } from './config-layout';

const CLAVE_MINI = 'nav-mini';

// localStorage puede no estar disponible (modo privado): el menu igual funciona
const leerMini = () => {
  try {
    return localStorage.getItem(CLAVE_MINI) === '1';
  } catch (e) {
    return false;
  }
};

// ----------------------------------------------------------------------

export default function DashboardLayout({ children }) {
  const [openNav, setOpenNav] = useState(false);
  const [mini, setMini] = useState(leerMini);

  const alternarMini = () =>
    setMini((prev) => {
      try {
        localStorage.setItem(CLAVE_MINI, prev ? '0' : '1');
      } catch (e) {
        // sin persistencia, no pasa nada
      }
      return !prev;
    });

  const anchoNav = mini ? NAV.WIDTH_MINI : NAV.WIDTH;

  return (
    <>
      <Header onOpenNav={() => setOpenNav(true)} anchoNav={anchoNav} />

      <Box
        sx={{
          minHeight: 1,
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
        }}
      >
        <Nav
          openNav={openNav}
          onCloseNav={() => setOpenNav(false)}
          mini={mini}
          onAlternarMini={alternarMini}
        />

        <Main anchoNav={anchoNav}>{children}</Main>
      </Box>
    </>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node,
};
