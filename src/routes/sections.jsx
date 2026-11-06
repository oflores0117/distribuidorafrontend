import { lazy, Suspense } from 'react';
import { Outlet, Navigate, useRoutes } from 'react-router-dom';

import DashboardLayout from 'src/layouts/dashboard';

export const IndexPage = lazy(() => import('src/pages/app'));
export const BlogPage = lazy(() => import('src/pages/blog'));
export const UserPage = lazy(() => import('src/pages/user'));
export const RutasPage = lazy(() => import('src/pages/rutas'));
export const PlanificacionPage = lazy(() => import('src/pages/planificacion'));
export const MiRutaPage = lazy(() => import('src/pages/mi-ruta'));
export const ClientsPage = lazy(() => import('src/pages/clients'));
export const PedidosPage = lazy(() => import('src/pages/pedidos'));
export const FuncionariosPage = lazy(() => import('src/pages/funcionarios'));
export const CategoriasPage = lazy(() => import('src/pages/categorias'));
export const ProveedoresPage = lazy(() => import('src/pages/proveedores'));
export const ProductosPage = lazy(() => import('src/pages/productos'));
export const InventarioPage = lazy(() => import('src/pages/inventario'));
export const LoginPage = lazy(() => import('src/pages/login'));
export const ProductsViewPage = lazy(() => import('src/pages/productsView'));
export const ProductsPage = lazy(() => import('src/pages/products'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));

// ----------------------------------------------------------------------

export default function Router() {
  const routes = useRoutes([
    {
      element: (
        <DashboardLayout>
          <Suspense>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      ),
      children: [
        { element: <IndexPage />, index: true },
        { path: 'rutas', element: <RutasPage /> },
        { path: 'planificacion', element: <PlanificacionPage /> },
        { path: 'mi-ruta', element: <MiRutaPage /> },
        { path: 'clientes', element: <ClientsPage /> },
        { path: 'pedidos', element: <PedidosPage /> },
        { path: 'funcionarios', element: <FuncionariosPage /> },
        { path: 'categorias', element: <CategoriasPage /> },
        { path: 'proveedores', element: <ProveedoresPage /> },
        { path: 'productos', element: <ProductosPage /> },
        { path: 'inventario', element: <InventarioPage /> },
        { path: 'user', element: <UserPage /> },
        { path: 'productsView', element: <ProductsPage /> },
        { path: 'products', element: <ProductsPage /> },
        { path: 'blog', element: <BlogPage /> },
      ],
    },
    {
      path: 'login',
      element: <LoginPage />,
    },
    {
      path: '404',
      element: <Page404 />,
    },
    {
      path: '*',
      element: <Navigate to="/404" replace />,
    },
  ]);

  return routes;
}
