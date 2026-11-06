import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

// En /assets/icons/navbar solo hay seis iconos, asi que la mitad de los modulos
// terminaba repitiendo el de usuario o el de carrito. Estos salen de iconify,
// el mismo set 'eva' que ya usa el resto de la app.
const icon = (nombre) => <Iconify icon={nombre} width={24} />;

// Ordenado por como se usa en el dia: primero el circuito del reparto
// (pedido -> ruta -> camion) y despues los datos que casi no cambian.
const navConfig = [
  {
    title: 'dashboard',
    path: '/',
    icon: icon('eva:pie-chart-2-fill'),
  },
  {
    title: 'pedidos',
    path: '/pedidos',
    icon: icon('eva:file-text-fill'),
  },
  {
    title: 'planificacion',
    path: '/planificacion',
    icon: icon('eva:map-fill'),
  },
  {
    title: 'mi ruta',
    path: '/mi-ruta',
    icon: icon('eva:navigation-2-fill'),
  },
  {
    title: 'inventario',
    path: '/inventario',
    icon: icon('eva:archive-fill'),
  },
  {
    title: 'zonas',
    path: '/rutas',
    icon: icon('eva:pin-fill'),
  },
  {
    title: 'clientes',
    path: '/clientes',
    icon: icon('eva:people-fill'),
  },
  {
    title: 'productos',
    path: '/productos',
    icon: icon('eva:cube-fill'),
  },
  {
    title: 'categorias',
    path: '/categorias',
    icon: icon('eva:pricetags-fill'),
  },
  {
    title: 'proveedores',
    path: '/proveedores',
    icon: icon('eva:briefcase-fill'),
  },
  {
    title: 'funcionarios',
    path: '/funcionarios',
    icon: icon('eva:person-done-fill'),
  },
];

export default navConfig;
