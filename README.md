# TPTV · Te pesco TV

App de pesca recreativa para el **Campo de Gibraltar, Tarifa y alrededores** (de Caños de Meca a Sabinillas). Se instala
en el móvil desde el navegador, como una app, y funciona sin cobertura con lo último que bajó.

## Qué tiene

- **Hoy**: el *índice de pesca TPTV* (0-10) del pesquero elegido, al estilo de la app Tiempo del iPhone. Mezcla viento
  (y si el sitio queda resguardado del Levante o del Poniente), oleaje, movimiento de marea, luz (alba y atardecer),
  periodos solunares, fase lunar y tendencia de la presión. Próximas 24 horas, mejor rato del día, viento, oleaje,
  marea, agua, luna, sol, tiempo, presión, corriente del Estrecho, «por qué esta nota», qué pesqueros van mejor con el
  viento de ahora, próximos 7 días y avisos de temporal, rachas, tormenta o mar en rocas.
- **Páginas de detalle**: cada widget de Hoy (viento, oleaje, marea, agua, luna, sol, tiempo, presión y corriente)
  abre su página con gráfica de 7 días (desliza el dedo para leerla), día a día y cómo afecta a la pesca.
- **Mareas** (desde el widget de marea): curva de 7 días, pleamares y bajamares, mareas vivas o muertas,
  salida y puesta de luna y sol, tabla solunar y cómo se pesca la marea en cada tramo de costa.
- **Pesqueros**: 41 sitios con mapa (satélite o calles), nota en vivo, filtros (playa, rocas, espigón, puerto, río,
  resguardados del viento de hoy, favoritos), ficha con especies, técnicas, marea, acceso, avisos legales y de
  seguridad, y «Cómo llegar».
- **Pecedex**: colección de 68 especies del Estrecho (peces, tiburoncillos, rayas y cefalópodos), con rareza de 1 a 5 estrellas.
  Las que aún no has pescado salen en silueta y se desbloquean al apuntarlas en el Diario. Tallas mínimas, meses,
  cebos, trucos, peligros y normativa resumida.
- **Diario**: apunta cada captura (especie, talla, peso, foto, cebo, pesquero, quién de la peña). Dos listas:
  **Pescados** (todo lo que sale) y **A casa** (lo que te llevas), con el **cupo del día** y aviso si no llega a la
  talla mínima. Estadísticas, récords y ranking de la peña.
- **Cuentas y peña online**: registro con usuario y contraseña, buscar colegas por usuario, solicitudes, capturas
  compartidas, ranking, perfiles recomendados (amigos de tus amigos primero) y perfil personalizable con rango,
  insignias, expositor de trofeos y fotos.
  Necesita un proyecto gratuito de Firebase: pasos en `FIREBASE.md`.
- **Windguru**: su previsión (widget oficial) del punto más cercano, en «Hoy» y en cada pesquero.
- **Fotos reales** de cada especie con el pez entero y nítido, comprobadas una a una, en 4:3 y guardadas en `img/peces`. Origen: Wikimedia Commons, con autor y licencia en cada ficha.
- **Checklist** (pestaña propia): listas por salida que se rellenan solas según la modalidad, sugerencias según el
  parte de ese día y listas compartidas con colegas de la peña (cada uno marca y dice qué lleva).
- **Plan con los colegas**: manda al grupo de WhatsApp el mejor rato del día que elijas con el parte completo.

## Publicarla en GitHub Pages (desde la web, sin instalar nada)

1. En github.com: **New repository** → nombre, por ejemplo `tptv` → **Public** → *Create repository*.
2. En el repositorio vacío: **uploading an existing file** → arrastra **todo el contenido** de esta carpeta
   (`index.html`, `styles.css`, `sw.js`, `manifest.webmanifest`, `README.md` y las carpetas `js` e `icons`) →
   *Commit changes*.
3. **Settings → Pages** → *Source*: **Deploy from a branch** → Branch **main** y carpeta **/ (root)** → *Save*.
4. En uno o dos minutos estará en `https://TU-USUARIO.github.io/tptv/`.

## Instalarla en el móvil

- **iPhone (Safari)**: abre el enlace → botón **Compartir** → **Añadir a pantalla de inicio**.
- **Android (Chrome)**: menú ⋮ → **Instalar aplicación**.

Así se abre a pantalla completa, con su icono, como una app más. Pásale el enlace a la peña y que hagan lo mismo.

## Bueno saber

- **Datos en vivo**: [Open-Meteo](https://open-meteo.com) (gratis, sin clave): viento, rachas, tiempo, presión,
  oleaje, temperatura del agua, corriente y nivel del mar. Se actualizan cada 30 minutos.
- **La marea es un modelo** (resolución ~8 km), no la tabla oficial: sirve para saber cuándo sube y baja, no para
  navegar. Alturas medidas desde la bajamar más baja de la semana.
- **Sol, luna y solunar** se calculan en el propio móvil.
- **Mapa**: satélite de Esri y mapa de OpenStreetMap (botón de capas).
- **Tus datos** (capturas, fotos, peña, favoritos) viven solo en ese móvil. Ajustes → *Guardar copia de seguridad* de
  vez en cuando, y *Restaurar copia* para pasarlos a otro.
- **Normativa**: resumen orientativo. Manda siempre lo que publique el BOJA/BOE vigente, y en el Parque Natural del
  Estrecho comprueba la zonificación del Decreto 130/2024 antes de pescar en una zona nueva.
- Cuando cambies algún archivo y lo subas, la app se actualiza sola al abrirla (a veces hace falta abrirla dos veces).
  Si no, sube el número de `CACHE` en `sw.js` (`tptv-v10` → `tptv-v11`).
