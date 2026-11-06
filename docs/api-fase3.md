# Fase 3 — Cobranza, corrección de entregas, prueba de entrega y dashboard

Igual que antes: POST, body JSON con `version_api: 1`, respuesta con `success`
y `error`. Backend en `proyecto_php/distribuidorabackend`.

> **Antes de usarlo**: `php artisan migrate` en el contenedor de PHP 7. Son tres
> migraciones nuevas (`2026_10_25_00000{1,2,3}`). Nada de esto se probó contra
> la base: el contenedor no estaba levantado. Se revisó la sintaxis con `php -l`
> y el frontend compila.

## Decisiones del negocio

- **Solo contado.** El repartidor cobra en la parada todo lo entregado. Lo único
  que se elige es el medio: `efectivo`, `transferencia` o `qr` (con número de
  comprobante opcional). No hay cuenta corriente ni saldo de cliente.
- **Corrección de entregas: el admin, en cualquier momento.** También después
  del retorno del camión y de la rendición. Mientras no haya login no se puede
  restringir por rol: el botón solo aparece en Planificación, no en `/mi-ruta`.

## Esquema nuevo

**`Cobro`**: un registro por parada (único por `idRutaParada`), con `monto`,
`medio` y `referencia`. Se escribe junto con la entrega y se reescribe si la
entrega se corrige. Si después de corregir no queda nada entregado, el cobro se
borra.

**`RutaDia`** suma `efectivoRendido`, `rendidoEn` y `rendicionObservacion`.
Solo se guarda lo que se contó. Lo esperado y la diferencia se calculan al
leer, así que si una entrega se corrige después de rendir, el descuadre aparece.

**`EntregaCorreccion`**: el historial. Guarda el estado y el monto de antes y
de después, la foto completa de la entrega en JSON (antes/después) y el motivo.

## Endpoints nuevos

### `corregir_entrega_parada`

Mismo body que `registrar_entrega_parada`, más `motivoCorreccion`, que es
obligatorio.

- Solo para paradas ya cerradas. Valida igual que el registro: coherencia entre
  el resultado y las cantidades, que no se pase de lo pedido y que alcance lo del
  camión.
- La disponibilidad del camión excluye esta parada. **Después del retorno
  también descuenta lo que volvió al depósito**: no se puede haber entregado
  algo que se contó en el retorno.
- Por cada producto que cambia se crea un movimiento `entrega` con `unidades` =
  diferencia (negativa si el cliente recibió menos). Si el camión ya volvió, se
  crea además un `faltante_ruta` con la diferencia inversa: el conteo físico no
  cambia, así que lo que el cliente no recibió es faltante.
- Si la parada pasa de "nada entregado" a "con entrega" y el pedido ya está en
  otra parada pendiente, se rechaza para no entregarlo dos veces.
- El estado del pedido se recalcula desde todo lo entregado
  (`PedidoController::recalcularEstado`). Puede volver a `pendiente` o a
  `en_ruta`.

Respuesta: `{ success, estadoParada, estadoPedido, ajustes, cobrado, rutaRendida }`.

### `obtener_cobros_ruta` — `{ idRutaDia }`

Devuelve las paradas con su cobro, `totales` (`entregado`, `cobrado`,
`porMedio`), `efectivoEsperado`, `pendientes` y `rendicion` (que trae la
`diferencia` calculada en el momento, o `null` si todavía no se rindió).

### `registrar_rendicion_ruta` — `{ idRutaDia, efectivoRendido, observacion }`

Se registra una sola vez y exige que no queden paradas pendientes. Si el
efectivo no cuadra (diferencia de 0,01 o más), la observación es obligatoria.

### `obtener_resumen_dashboard` — `{ fecha }` (por defecto, hoy)

En una sola llamada devuelve:

- `kpis`: entregado, cobrado, efectivo, rutas, paradas, cerradas y faltante.
- `rutas`: avance, monto, faltante y si ya se rindió.
- `resultados` (paradas por estado) y `pedidos` (cantidad por estado).
- `sinRendir`: efectivo de rutas sin rendir, de cualquier día.
- `stock`: productos sin stock o bajo el mínimo.
- `serie`: lo entregado en los últimos 7 días.

## Endpoints que cambiaron

| Endpoint | Cambio |
|---|---|
| `registrar_entrega_parada` | Acepta `cobro: { medio, referencia }` y crea el `Cobro` (sin medio se toma efectivo). Rechaza entregar más de lo que el pedido todavía debe si ya recibió algo en otra parada (pedido parcial reprogramado). Devuelve `cobrado`. |
| `obtener_entrega_parada` | `entrega` trae `latitude`, `longitude`, `cobro` y `correcciones`. La parada trae `rutaRetornada` y `rutaRendida`. `cargaDisponible` descuenta el retorno si ya se registró. |
| `obtener_ruta_dia` / `obtener_mi_ruta` | Cada parada trae `cobro`. |
| `anular_pedido` | Las líneas de entrega en cero ya no bloquean la anulación. Antes, un pedido rechazado o con cliente ausente no se podía anular nunca. |

## Frontend

- **Diálogo de entrega**:
  - Toma el GPS del celular al registrar. Si no lo consigue en 8 s o el usuario
    no da permiso, registra igual.
  - Muestra el cobro con el selector de medio.
  - En modo lectura muestra a cuántos metros del cliente se cerró la parada (en
    rojo si son más de 300 m) y el historial de correcciones.
  - Tiene el modo "Corregir entrega", que se activa con `permitirCorreccion`.
- **Planificación → detalle de ruta**: botón "Cobros" que abre la rendición.
- **Mi ruta**: muestra el efectivo que hay que rendir.
- **Inicio**: dashboard real en lugar de la demo de la plantilla.

## Pendiente

- El GPS del navegador solo funciona en HTTPS (o en `localhost`). En producción
  el sitio tiene que servirse por HTTPS.
- Restringir la corrección al rol admin y registrar `idFuncionario` desde la
  sesión. Ambos dependen de la Fase 1.
- Foto y firma como prueba de entrega, y el modo offline.
- Órdenes de compra a proveedores a partir de las alertas de stock.
