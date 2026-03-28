<div align="center">

  ![alt text](./image/Kanban.gif)

## Kanban Multi-Proyecto Offline

![React](https://img.shields.io/badge/Framework-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![CSS Modules](https://img.shields.io/badge/Estilo-CSS_Modules-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![LocalStorage](https://img.shields.io/badge/Persistencia-localStorage-FFB300?style=for-the-badge&logo=googlechrome&logoColor=black)

</div>

---

### 📝 Descripción
**Kanban Multi-Proyecto Offline** es una aplicación web desarrollada con **React + Vite** para gestionar múltiples proyectos en una misma máquina, sin necesidad de backend ni conexión obligatoria a internet. La aplicación permite organizar tareas mediante flujo Kanban, iteraciones y responsables, guardando toda la información localmente en `localStorage`.

## Qué incluye
- Gestión de múltiples proyectos locales.
- Tablero Kanban con columnas configurables.
- Límites WIP por columna.
- Iteraciones con rango de fechas.
- Creación de tareas con prioridad, etiquetas, responsable y fechas.
- Drag & drop para mover tareas entre columnas.
- Modo claro y oscuro.
- Exportación e importación de proyectos en JSON.
- Eliminación segura de proyectos con doble confirmación y temporizador.

### 📂 Estructura del Proyecto

| Archivo | Tipo | Descripción |
| --- | --- | --- |
| **`src/Kanban.jsx`** | `React` | Componente principal con la interfaz y la lógica del tablero. |
| **`src/Kanban.module.css`** | `CSS Modules` | Estilos del tablero, tarjetas, columnas y modales. |
| **`src/defaultProject.js`** | `JS` | Fábrica del proyecto base que se crea al iniciar la app. |
| **`src/projectStorage.js`** | `JS` | Gestión de persistencia local usando `localStorage`. |
| **`src/index.css`** | `CSS` | Reset global y estilos base de la aplicación. |

### 🎨 Proceso de Diseño (UI/UX)
Para este proyecto, el diseño se enfocó en crear una experiencia clara, funcional y completamente operativa en entorno local. Se trabajó en:
* **Jerarquía visual:** organización del tablero para identificar rápidamente columnas, tareas e iteraciones.
* **Interacción:** uso de modales, confirmaciones y drag & drop para facilitar la gestión de tareas.
* **Feedback visual:** soporte para modo claro/oscuro, microinteracciones y validaciones en acciones críticas.
* **Persistencia local:** experiencia pensada para funcionar sin servidor, manteniendo los datos disponibles desde el navegador.

> Puedes colocar aquí una captura del tablero, flujo de tareas o mockup del diseño.
![alt text](./image//kanban-ui.png)

### ⚙️ Características Técnicas
La aplicación trabaja con una estructura persistida por proyecto que incluye:
- `columns`: columnas del flujo Kanban.
- `iterations`: iteraciones configurables con fechas.
- `tasks`: tareas con prioridad, etiquetas, responsable y fechas.
- `updatedAt`: control de actualización del proyecto.
- `version`: base para futuras migraciones del esquema.

### 🚀 Instalación y Uso
Si quieres explorar el código localmente:

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/tu-repositorio.git
   ```

2. Entra a la carpeta del proyecto:
   ```bash
   cd tu-repositorio
   ```

3. Instala dependencias:
   ```bash
   npm install
   ```

4. Inicia el entorno de desarrollo:
   ```bash
   npm run dev
   ```

### 🧪 Build y calidad
Para validar y generar la versión de producción:

```bash
npm run lint
npm run build
```

### 💾 Persistencia de datos
Toda la información se guarda en el navegador mediante `localStorage`, usando claves para:
- índice de proyectos,
- proyecto activo,
- documentos completos de cada proyecto.

Esto permite trabajar de forma local, mantener varios tableros y recuperar la información al volver a abrir la aplicación.

### 📌 Estado actual del proyecto
**Estado:** funcional y operativo para uso offline.  
Incluye gestión multi-proyecto, configuración de columnas e iteraciones, persistencia local, importación/exportación JSON y seguridad reforzada en eliminación de proyectos.

---

### 👨‍💻 Autor
Desarrollado como una solución de gestión visual de tareas offline con enfoque en organización local, flexibilidad y simplicidad de uso.
