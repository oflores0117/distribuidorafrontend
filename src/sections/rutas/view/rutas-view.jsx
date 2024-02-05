import _ from 'lodash';
import { useState, useEffect } from 'react';
import { Stack, Container, Typography } from '@mui/material';
import { useAxiosPost } from '../../../hooks/useAxiosPost';
import MapContainer from '../map-container';

export default function RutasView() {
  const postClientes = useAxiosPost();
  const [markers, setMarkers] = useState([]);
  const [polygonos, setPolygonos] = useState([]);
  const buscarClientes = async () => {
    postClientes('obtener_todos_clientes', 'asd', async (resp) => {
      const { clientes, polygonos } = resp;
      const prMarker = [];
      _.map(clientes, (cli) => {
        prMarker.push({
          id: cli.id,
          lat: parseFloat(cli.latitude),
          lng: parseFloat(cli.longitude),
          visible: false,
        });
      });
      setMarkers(prMarker);
      const arrPolygonos = [];
      _.map(polygonos, (poly) => {
        const arrCli = [];
        _.map(poly.clientes, (polyCli) => {
          arrCli.push({
            lat: parseFloat(polyCli.latitude),
            lng: parseFloat(polyCli.longitude),
          });
        });
        arrPolygonos.push({
          color: poly.color,
          cordenadas: JSON.parse(poly.cordenadas),
          clientes: arrCli,
        });
      });
      setPolygonos(arrPolygonos);
    });
  };
  useEffect(() => {
    buscarClientes();
    // buscarPolygonos();
  }, [setMarkers, setPolygonos]);

  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h4">Asignar Rutas</Typography>
      </Stack>

      <MapContainer
        clientesMarkers={markers}
        setClientesMarkers={setMarkers}
        postRutas={postClientes}
        polygonos={polygonos}
        buscarClientes={buscarClientes}
      />
    </Container>
  );
}
