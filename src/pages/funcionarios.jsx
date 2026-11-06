import { Helmet } from 'react-helmet-async';

import { FuncionariosView } from 'src/sections/funcionarios/view';

// ----------------------------------------------------------------------

export default function FuncionariosPage() {
  return (
    <>
      <Helmet>
        <title> Funcionarios | Minimal UI </title>
      </Helmet>

      <FuncionariosView />
    </>
  );
}
