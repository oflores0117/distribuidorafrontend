import _ from 'lodash';
import { useState, useEffect } from 'react';
import { Marker, Polygon, Polyline, GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import {
  Stack,
  Button,
  Checkbox,
  TextField,
  FormControlLabel,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import ColorSelect from '../rutas/colorSelect';
import swal from 'sweetalert';

const MapContainer = (props) => {
  const { clientesMarkers, setClientesMarkers, postRutas, polygonos, buscarClientes } = props;

  const [path, setPath] = useState([]);
  const [showLoading, setShowLoading] = useState(false);
  const [enableAllClient, setEnableAllClient] = useState(false);
  const [mapCenter] = useState({ lat: -17.785971, lng: -63.1774265 });
  const [color, setColor] = useState('#000');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: `AIzaSyAN2JTbJ5ALoBrHk0DlB4TgpQI30qUhyjA`,
  });

  useEffect(() => {
    const localData = localStorage.getItem('googleMapPolyline');
    if (localData) {
      const parsedData = JSON.parse(localData);
      setPath(parsedData);
    }
  }, []);

  const isPointInPolygon = (point, polygon) => {
    const x = point.lat;
    const y = point.lng;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat;
      const yi = polygon[i].lng;
      const xj = polygon[j].lat;
      const yj = polygon[j].lng;

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  };

  const addPointToPath = (e) => {
    try {
      const latLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      const mergedData = [...path, latLng];
      setPath(mergedData);
      //   setMapCenter(new google.maps.LatLng({ lat: e.latLng.lat(), lng: e.latLng.lng() }));
      localStorage.setItem('googleMapPolyline', JSON.stringify(mergedData));
    } catch (error) {
      console.error('addPointToPath error', error);
    }
  };

  const removeItem = () => {
    const index = path.length - 1;
    const arr = [...path];
    arr.splice(index, 1);
    setPath(arr);
    localStorage.setItem('googleMapPolyline', JSON.stringify(arr));
  };

  const mostrarClientesDentroPoligono = (isChecked) => {
    const arrPoli = [];
    if (isChecked) {
      _.map(clientesMarkers, (cli) => {
        const isMarkerInsidePolygon = isPointInPolygon({ lat: cli.lat, lng: cli.lng }, path);
        if (isMarkerInsidePolygon) {
          cli.visible = true;
        } else {
          cli.visible = false;
        }
        arrPoli.push(cli);
      });
    } else {
      _.map(clientesMarkers, (cli) => {
        cli.visible = false;
        if (enableAllClient) {
          cli.visible = true;
        }
        arrPoli.push(cli);
      });
    }
    setClientesMarkers(arrPoli);
  };

  const mostrarTodosClientes = (e) => {
    console.log('clientes', clientesMarkers.length);
    const arrPoli = [];
    const onlyInsideMarker = document.getElementById('checkInsidePolygon').checked;
    _.map(clientesMarkers, (cli) => {
      let isVisible = onlyInsideMarker ? false : e.target.checked;
      const isMarkerInsidePolygon = isPointInPolygon({ lat: cli.lat, lng: cli.lng }, path);
      if (onlyInsideMarker && isMarkerInsidePolygon) {
        isVisible = true;
      }
      cli.visible = isVisible;
      arrPoli.push(cli);
    });
    setClientesMarkers(arrPoli);
    setEnableAllClient(e.target.checked);
  };

  const registraPolygono = () => {
    setShowLoading(true);
    const nombre = document.getElementById('nombre_ruta').value;
    const descripcion = document.getElementById('descripcion_ruta').value;
    const arrClient = [];
    _.map(clientesMarkers, (cli) => {
      const isMarkerInsidePolygon = isPointInPolygon({ lat: cli.lat, lng: cli.lng }, path);
      if (isMarkerInsidePolygon) {
        arrClient.push(cli.id);
      }
    });
    const obj = {
      nombre: nombre,
      descripcion: descripcion,
      color: color,
      cordenadas: path,
      clientes: arrClient,
    };
    swal({
      title: 'Confirma Registrar el Polygono?',
      icon: 'info',
      buttons: true,
      dangerMode: true,
    }).then((willDelete) => {
      postRutas('registrar_polygono', obj, async (resp) => {
        const { success } = resp;
        if (success) {
          setPath([]);
          buscarClientes();
          setShowLoading(false);
          swal('Ok! registro Correctamente!', {
            icon: 'success',
          });
        } else {
          swal('error al registrar!');
        }
      });
    });
  };

  return isLoaded ? (
    <>
      <Stack direction="row" spacing={2} mb={3} mt={3}>
        <TextField label="Nombre" variant="outlined" id="nombre_ruta" size="small" />
        <TextField label="Descripcion" variant="outlined" id="descripcion_ruta" size="small" />
        <ColorSelect color={color} setColor={setColor} />
        <Button variant="contained" onClick={registraPolygono}>
          Guardar
        </Button>
      </Stack>
      <FormControlLabel
        control={<Checkbox onChange={(e) => mostrarTodosClientes(e)} />}
        label="Mostrar Todos Clientes"
      />
      <FormControlLabel
        control={
          <Checkbox
            id="checkInsidePolygon"
            onChange={(e) => mostrarClientesDentroPoligono(e.target.checked)}
          />
        }
        label="Mostrar Clientes Dentro del Polygono"
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: 1200,
        }}
      >
        <div style={{ width: '95%', height: '1700px' }}>
          <GoogleMap
            onClick={addPointToPath}
            mapContainerStyle={{ width: '95%', height: '400px' }}
            center={mapCenter}
            zoom={13}
          >
            <Polyline path={path} />

            <Polygon
              path={path}
              options={{ strokeOpacity: 0.8, strokeColor: color, fillColor: color }}
            />
            <Button variant="contained" onClick={removeItem}>
              Eliminar
            </Button>
            {_.map(clientesMarkers, (item, i) => {
              return <Marker key={item.id} position={item} visible={item.visible} />;
            })}
            {_.map(polygonos, (polyg) => {
              return (
                <>
                  {_.map(polyg.clientes, (cliPoly, key) => {
                    return <Marker key={key} position={cliPoly} visible={true} />;
                  })}
                  <Polygon
                    path={polyg.cordenadas}
                    options={{
                      strokeOpacity: 0.8,
                      strokeColor: polyg.color,
                      fillColor: polyg.color,
                    }}
                  />
                </>
              );
            })}
          </GoogleMap>
        </div>
      </div>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={showLoading}
        onClick={() => setShowLoading(false)}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  ) : (
    <>Cargado...</>
  );
};

export default MapContainer;
