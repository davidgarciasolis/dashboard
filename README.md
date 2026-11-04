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
