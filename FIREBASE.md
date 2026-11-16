# Cuentas y peña online (Firebase, gratis)

> **Ya está configurado** (15/11/2026): proyecto `tptv-pena` en la cuenta de Google alvarofdzmont@gmail.com, acceso
> con correo/contraseña, Firestore en eur3 (Europa) con las reglas de `firestore.rules` y la app web «TPTV»; sus datos
> están en `js/config.js`. Los pasos de abajo solo hacen falta para montarlo de nuevo en otro proyecto.

Las cuentas (usuario y contraseña) y la peña online necesitan un sitio donde guardar los usuarios y las capturas compartidas. Se usa **Firebase**
de Google con el plan gratuito (Spark): de sobra para una peña de colegas. Se hace **una vez** y vale para todos los que
se descarguen la app: cada persona se registra dentro de la app con su usuario y contraseña, sin email.

## 1. Crear el proyecto (5 min)

1. Entra en <https://console.firebase.google.com> con tu cuenta de Google.
2. **Crear un proyecto** → nombre, por ejemplo `tptv-pena` → puedes desactivar Google Analytics → *Crear proyecto*.

## 2. Activar el acceso con contraseña

1. Menú izquierdo: **Compilación → Authentication** → *Comenzar*.
2. Pestaña **Método de acceso** → **Correo electrónico/contraseña** → activa el primer interruptor (no el de «vínculo
   por correo») → *Guardar*. La app usa por dentro un correo inventado a partir del usuario: nadie da su email.

## 3. Crear la base de datos

1. Menú izquierdo: **Compilación → Firestore Database** → *Crear base de datos*.
2. Ubicación: **eur3 (Europa)** → modo **producción** → *Crear*.
3. Pestaña **Reglas**: borra lo que hay, pega el contenido del archivo `firestore.rules` de esta carpeta y pulsa **Publicar**.

## 4. Sacar los dos datos para la app

1. Rueda dentada (arriba a la izquierda) → **Configuración del proyecto**.
2. En «Tus apps» pulsa el icono **`</>`** (Web) → nombre `TPTV` → *Registrar app* (no hace falta Hosting).
3. Te enseña un bloque `firebaseConfig`. Copia solo **apiKey** y **projectId**.
4. Ábrelos en `js/config.js` y pégalos:

```js
firebase: {
  apiKey: 'AIza...',
  projectId: 'tptv-pena',
},
```

5. Sube `js/config.js` a GitHub (y sube el número de `CACHE` en `sw.js` para que los móviles se actualicen).

## 5. (Recomendado) Limitar la clave a tu web

Google Cloud Console → **APIs y servicios → Credenciales** → la clave «Browser key» → *Restricciones de aplicaciones*:
**Sitios web** → añade `https://TU-USUARIO.github.io/*` → Guardar.

## Cómo se usa

- La primera vez la app enseña **Entrar / Crear cuenta**: usuario, contraseña y repetir contraseña. Se puede saltar con
  «Ahora no» y entrar más tarde desde Diario → **Peña**.
- En **Peña**, busca a tus colegas por su **nombre de usuario** y pulsa «Añadir». Les llega la solicitud y, al aceptarla,
  os veis las capturas, el ranking y «Lo último de la peña».
- **Invitar** manda por WhatsApp un enlace: al abrirlo, el colega crea su cuenta y te envía la solicitud.
- Solo te ven los amigos que aceptas. Si quitas a alguien, deja de verte.
- Cada uno tiene su **perfil**: foto, nombre, bio, tema de color, pesquero y técnica favoritos y un **expositor** de hasta
  6 trofeos con foto. Los amigos lo ven tocando su nombre en la peña.
- Se comparten las capturas apuntadas a tu nombre (especie, talla, peso, sitio y cebo) y las fotos del expositor. Las
  fotos se guardan comprimidas dentro de Firestore, así que no hace falta el plan de pago de Storage.
- **Contraseñas olvidadas**: como no hay email, no se pueden recuperar desde la app. Como administrador puedes borrar la
  cuenta en Firebase → Authentication (el usuario `nombre@usuarios.tptv.app`) y la persona se registra de nuevo.