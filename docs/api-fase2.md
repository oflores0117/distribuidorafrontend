# Fase 2 — Cierre de la entrega

Implementado en frontend (este repo) y backend (`proyecto_php/distribuidorabackend`,
Laravel 5.2). Convencion de siempre: POST, body JSON con `version_api: 1`,
respuesta con `success` y `error`.

> **Falta un paso para que funcione**: correr `php artisan migrate` en el entorno
> donde vive la app. El PHP de la CLI de esta maquina no tiene el driver
> `pdo_mysql`, asi que las dos migraciones nuevas quedaron escritas pero sin
> aplicar. El DDL se valido contra la base real (tabla temporal creada y
> borrada), y los tipos de las FK coinciden: todas las PK referenciadas son
> `int unsigned`.

## El cambio de fondo

Antes: lo entregado se deducia de la diferencia entre la carga y el retorno del
camion. Se sabia cuanto bajo del camion, no quien recibio que, y cualquiera
podia marcar una parada como "entregada" desde el escritorio sin mover un gramo
de stock.

Ahora: el repartidor registra la entrega parada por parada y producto por
producto. De ahi salen los movimientos de stock y el estado del pedido. El
retorno del camion es una **conciliacion**: lo que baja se compara con lo que
deberia quedar arriba, y la diferencia es un faltante que queda registrado.

```
carga del camion  →  entregas por parada  →  retorno (conciliacion)
   tipo carga_ruta       tipo entrega            tipo retorno_ruta + faltante_ruta
```

## Esquema nuevo

**`EntregaDetalle`** (migracion `2026_09_11_000001`) — una fila por producto de
cada parada cerrada: `cantidadPedida`, `cantidadEntregada`, `cantidadDevuelta`,
`precioUnitario`, `subtotal`. La cabecera no se duplica: vive en `RutaParada`
(`estado`, `motivo`, `observacion`, y `horaLlegada` como momento del registro).

**`MovimientoStock.unidades`** (migracion `2026_09_11_000002`) — `cantidad` es
el efecto sobre el deposito, y vale cero en todo lo que pasa en la calle porque
la mercaderia ya habia salido al cargar el camion. Eso dejaba la entrega sin
numero: la cantidad real solo se leia dentro del texto del motivo. `unidades`
guarda cuanta mercaderia se movio de verdad, sin romper la invariante de que la
suma de `cantidad` es el stock del deposito.

**Estados nuevos** (ambas columnas son `varchar(20)`, no hizo falta tocarlas):

- `RutaParada.estado`: `pendiente`, `entregado`, `parcial`, `rechazado`, `ausente`.
- `Pedido.estado`: `pendiente`, `en_ruta`, `entregado`, `parcial`, `anulado`.

**Tipo de movimiento nuevo**: `faltante_ruta`, con `cantidad` en cero y
`unidades` con lo que falta. No mueve el deposito a proposito: esas unidades
salieron al cargar el camion y el stock ya esta descontado. Lo que queda es el
registro de que no se sabe donde estan.

## Endpoints nuevos

### `obtener_entrega_parada` — `EntregaController@obtenerEntregaParada`

Request `{ idRutaParada }`. Devuelve la parada con su cliente, el `rutaEstado`
(el frontend solo habilita el registro con la ruta `en_curso`), el pedido con
sus lineas y lo ya entregado en cada una, y `cargaDisponible`: lo que queda
arriba del camion **al llegar a esa parada** (lo cargado menos lo entregado en
las otras paradas). `entrega` es `null` mientras la parada no se cerro; cuando
ya se registro trae `registradaEn` e `idFuncionario`, y el dialogo pasa a modo
lectura. `pedido` es `null` en las paradas de relevamiento.

Un producto del pedido que no aparece en `cargaDisponible` es un producto que no
subio al camion: disponible cero. El frontend usa la misma regla que el backend.

### `registrar_entrega_parada` — `EntregaController@registrarEntregaParada`

```json
{
  "idRutaParada": 120,
  "resultado": "parcial",
  "motivo": "El cliente no tenia lugar para toda la carga",
  "observacion": "",
  "items": [{ "idProducto": 12, "cantidadEntregada": 6, "cantidadDevuelta": 2 }]
}
```

`resultado` es `entregado` / `parcial` / `rechazado` / `ausente`; en las paradas
sin pedido solo `entregado` (visita hecha) o `ausente`. Acepta tambien
`latitude` y `longitude` como prueba de entrega.

Valida, en una transaccion, que: la ruta este `en_curso`; la parada este
`pendiente` (se registra una sola vez); el pedido no este anulado; cada producto
pertenezca al pedido; `cantidadEntregada + cantidadDevuelta` no pase lo pedido;
`cantidadEntregada` no pase lo que queda arriba del camion; y que el resultado y
las cantidades cuenten la misma historia (no se puede marcar entrega completa si
faltan unidades, ni rechazo si el cliente recibio algo).

Despues escribe las lineas de `EntregaDetalle` —incluidas las que quedaron en
cero, para que la entrega cuente que paso con cada producto—, un movimiento
`entrega` por producto entregado, cierra la parada y mueve el pedido.

Response: `{ success, estadoParada, estadoPedido, movimientos, entregado }`.

**La decision que estaba abierta**: con `rechazado` o `ausente` el pedido vuelve
a `pendiente`, o sea a la cola de reparto, para que el planificador lo
reprograme en otra ruta. La parada cerrada conserva el registro del intento (con
su motivo), y para que eso funcionara `validarPedidoDeParada` cambio: ahora solo
una parada **todavia pendiente** ocupa un pedido. Antes, una parada cerrada
bloqueaba el pedido para siempre y no habia forma de reprogramarlo.

### `obtener_mi_ruta` — `RutaController@obtenerMiRuta`

Request `{ idFuncionario, fecha }` (la fecha por defecto es hoy). Devuelve
`{ success: true, ruta: null }` si ese dia no le toca repartir — no es un error.
Las paradas vienen ordenadas por `orden`, cada una con su cliente, el resumen de
su pedido y `montoEntregado`.

Mientras no exista login, el `idFuncionario` llega por parametro y **cualquiera
puede pedir la ruta de cualquier repartidor**. Con la Fase 1 tiene que salir del
usuario autenticado y dejar de confiar en lo que manda el cliente.

## Endpoints que cambiaron

| Endpoint | Cambio |
|---|---|
| `obtener_carga_ruta` | Cada item trae `entregado` (de las entregas registradas, ya no de la resta contra el retorno), `devuelto` y `esperado = cargado - entregado`, disponibles desde el primer reparto. |
| `registrar_retorno_ruta` | Ya no deduce lo entregado. Exige que no queden paradas pendientes, rechaza que vuelva mas de lo esperado (eso significa una entrega mal registrada), y lo que falta queda como movimiento `faltante_ruta`. Devuelve `{ retornado, faltante }`. |
| `obtener_ruta_dia` | Cada parada trae `pedido` (`idPedido`, `codigo`, `estado`, `items`, `total`) y `montoEntregado`. |
| `obtener_rutas_dia` | Suma `paradasCerradas` (todo lo resuelto) junto a `paradasEntregadas` (las que dejaron mercaderia). El avance del recorrido se mide con la primera: una parada rechazada tambien esta hecha. |
| `obtener_existencias` | `enRuta` descuenta lo ya entregado. Antes solo sumaba lo cargado, asi que un camion a media ruta declaraba como "en ruta" mercaderia que ya estaba en el negocio del cliente. |
| `actualizar_parada` | Dejo de cambiar el estado de la parada: si llega un estado distinto al actual, responde error apuntando a `registrar_entrega_parada`. Tampoco deja cambiar el pedido de una parada ya cerrada, y el motivo de una parada cerrada no se pisa. |
| `registrar_visita` | Si la parada lleva pedido, responde error: ese es justo el agujero que cierra este modulo. Queda solo para las visitas de relevamiento. |
| `anular_pedido` | Rechaza anular un pedido con entrega registrada (habria movimiento de stock sin respaldo) o en estado `parcial`. |

## Lo que sigue pendiente

- **Fase 1 (auth y roles)**: `obtener_mi_ruta` confia en el `idFuncionario` que
  manda el cliente, y `/mi-ruta` tiene un selector de repartidor a mano.
- **Prueba de entrega**: el backend ya guarda `latitude`/`longitude` si llegan,
  pero el frontend todavia no las manda. Foto y firma no estan.
- **Modo offline** para el celular del repartidor.
- **Correccion de una entrega ya registrada**: hoy el unico camino es anular el
  pedido, y eso esta bloqueado justamente cuando hay entrega. Falta definir con
  el negocio como se revierte (contramovimiento de stock, quien puede hacerlo).
