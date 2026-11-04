# día. — Tu espacio personal

Un dashboard en español para organizar el día sin complicaciones. HTML, CSS y JavaScript, sin dependencias de ejecución ni proceso de compilación.

## Arrancar

Necesitas Node.js 18 o posterior:

```sh
npm run dev
```

Abre **http://localhost:5173**. Para utilizar otro puerto: `PORT=3000 npm run dev`.

## Funciones

- Crear, editar, completar y eliminar tareas con fecha, hora, prioridad, área y notas.
- Vistas del día, semana, proyectos y tareas completadas.
- Buscar tareas y filtrar por estado o área.
- Resumen de tareas y progreso para la fecha seleccionada.
- Calendario semanal con navegación entre fechas.
- Temporizador de concentración de 25 minutos con pausa y reinicio.
- Una intención personal para cada día.
- Exportación e importación de copias JSON. Al importar se añaden las tareas con identificadores nuevos y se conservan los datos actuales.
- Diseño adaptable a móvil y ordenador. Atajo **N** para crear una tarea.

Los datos se guardan en `localStorage`, únicamente en el navegador y dirección donde uses la aplicación. No hay cuenta, sincronización entre dispositivos ni servidor de datos. Exporta una copia antes de borrar los datos del navegador o cambiar de equipo. La página empieza vacía para que todas las tareas sean tuyas.

El temporizador funciona mientras la página permanece abierta; al salir se solicita confirmación si hay una sesión activa. Las fuentes de Google son opcionales: si no están disponibles se usan las del sistema.

## Comprobar

```sh
npm test
```

Las pruebas cubren fechas, límites entre meses, semanas, filtros y validación de datos importados. El servidor solo sirve los archivos públicos definidos en `server.js`.

## Publicar en GitHub Pages

La aplicación también funciona como web estática: GitHub Pages sirve directamente `index.html`, `styles.css`, `app.js` y `core.js`. No necesita ejecutar `server.js` ni instalar paquetes.

1. En el repositorio, abre **Settings → Pages → Build and deployment** y elige **GitHub Actions** como **Source**.
2. Sube los cambios de este proyecto a la rama `main`, incluyendo `.github/workflows/pages.yml` y `.nojekyll`.
3. En **Actions**, espera a que termine **Publicar dashboard en GitHub Pages**. También puedes iniciarlo con **Run workflow**.
4. La página estará en **https://davidgarciasolis.github.io/dashboard/** cuando el despliegue termine correctamente.

El workflow publica únicamente los archivos públicos y permite una sola publicación simultánea, sin cancelar la que esté en curso. Las rutas de CSS y JavaScript son relativas para funcionar bajo `/dashboard/`.

Si aparece **Deployment cancelled**, comprueba si hubo otra ejecución o cancelación del mismo commit. Cuando todas las ejecuciones anteriores hayan terminado, utiliza **Re-run failed jobs** en la última ejecución fallida. El aviso de `punycode` por sí solo no hace fallar la publicación. Si la cancelación persiste, consulta el estado de GitHub Pages en https://www.githubstatus.com/.

Los datos guardados en `localhost` no aparecen automáticamente en GitHub Pages: exporta una copia desde la aplicación local e impórtala en la página publicada.
