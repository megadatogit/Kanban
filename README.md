# Kanban Multi-Proyecto (Offline)

Aplicación Kanban hecha con React + Vite para gestionar múltiples proyectos en la misma máquina, sin backend y sin conexión obligatoria a internet.  
Toda la información se guarda en `localStorage`.

---

## 1. Guía de Uso (Usuarios No Técnicos)

### 1.1. ¿Qué es esta aplicación?
Este tablero permite organizar tareas por columnas (flujo Kanban), iteraciones y responsables.  
Puedes tener varios proyectos, cambiar entre ellos, exportarlos y volver a importarlos.

### 1.2. Características principales
- Gestión de múltiples proyectos locales.
- Tablero Kanban con columnas configurables.
- Límites WIP por columna.
- Iteraciones configurables con rango de fechas.
- Alta de tareas con prioridad, etiquetas, responsable y fechas.
- Drag & drop para mover tareas entre columnas.
- Modo claro/oscuro.
- Exportación e importación de proyectos en JSON.
- Eliminación de proyecto con doble confirmación y temporizador de seguridad.

### 1.3. Inicio rápido
1. Abre la aplicación.
2. Selecciona un proyecto en el selector superior.
3. Usa `Nueva Tarea` para crear tareas.
4. Arrastra las tarjetas entre columnas para actualizar su estado.
5. Usa el botón de tema (ícono sol/luna) para cambiar visualización.

### 1.4. Barra superior: qué hace cada control
- Selector de proyecto: cambia el proyecto activo.
- Botón `Menú`: abre acciones de administración del proyecto.
- Selector de iteración: filtra tareas por iteración.
- Botón `Nueva Tarea`: abre formulario de creación de tarea.
- Botón tema (sol/luna): alterna modo claro y oscuro.

### 1.5. Menú de proyecto (acción por acción)
Desde `Menú`:

#### Nuevo Proyecto
- Abre un modal para escribir nombre.
- Crea un proyecto nuevo con estructura base.
- Cambia automáticamente al nuevo proyecto.

#### Renombrar
- Abre modal para cambiar nombre.
- Actualiza nombre del proyecto y título del tablero.

#### Duplicar
- Clona el proyecto actual (estructura y tareas).
- Crea un nuevo proyecto con sufijo `(Copia)`.
- Cambia automáticamente al proyecto duplicado.

#### Eliminar
- Abre modal de advertencia con implicaciones.
- Pide doble confirmación.
- En la confirmación final, activa un temporizador de 10 segundos antes de habilitar el botón final.
- Si solo existe un proyecto, la eliminación se bloquea.

#### Exportar
- Descarga un archivo JSON del proyecto activo.
- Recomendado antes de cambios críticos o eliminación.

#### Importar
- Permite cargar un JSON desde tu computadora.
- Luego pide elegir modo:
- `Crear Nuevo`: importa como proyecto nuevo.
- `Reemplazar Actual`: sobreescribe el proyecto activo.

#### Configurar
- Abre el editor de tablero:
- Título.
- Columnas (nombre, WIP, política/reglas).
- Iteraciones (nombre, inicio, fin).

### 1.6. Configuración del tablero: reglas de uso

#### Columnas
- Puedes agregar, editar y eliminar columnas.
- Cada columna tiene:
- Nombre.
- Límite WIP.
- Política (DoR/DoD u otra regla operativa).

Si una columna tiene tareas:
- El sistema exige seleccionar una columna destino.
- Se usa flujo `Mover y Eliminar`.

#### Iteraciones
- Puedes agregar, editar y eliminar iteraciones.
- Cada iteración tiene nombre y rango de fechas.

Si una iteración tiene tareas:
- El sistema exige seleccionar iteración destino.
- Se usa flujo `Mover y Eliminar`.

#### Validaciones
- Debe existir al menos 1 columna y 1 iteración.
- WIP debe ser número entero mayor o igual a 1.
- Fecha inicio no puede ser posterior a fecha fin.
- Título no puede quedar vacío.

### 1.7. Crear tarea
En el modal `Nueva Tarea`:
- Título (obligatorio).
- Prioridad.
- Iteración (según selección actual).
- Fecha inicio/fecha límite.
- Responsable (obligatorio).
- Etiquetas.

La tarea nueva se crea en la primera columna disponible del proyecto.

### 1.8. Modo oscuro
- El modo oscuro aplica clase global y cambia paleta visual.
- El contenedor principal usa `100dvh` para cubrir todo el viewport.

### 1.9. Recomendaciones para usuarios
- Exporta el proyecto antes de eliminarlo.
- Mantén nombres claros en proyecto/iteraciones/columnas.
- Revisa límites WIP para evitar sobrecarga en una columna.

---

## 2. Documentación Técnica (Desarrollo)

### 2.1. Stack
- React.
- Vite.
- CSS Modules.
- `lucide-react` para íconos.
- Persistencia local con `localStorage`.

### 2.2. Estructura de archivos clave
- `src/Kanban.jsx`: componente principal con UI y lógica.
- `src/Kanban.module.css`: estilos del tablero y modales.
- `src/defaultProject.js`: fábrica de proyecto base.
- `src/projectStorage.js`: capa de acceso a `localStorage`.
- `src/index.css`: reset global.

### 2.3. Modelo de datos del proyecto
Cada proyecto persiste como objeto:

```json
{
  "version": 1,
  "id": "p_1700000000000_xxxxx",
  "name": "Nombre Proyecto",
  "title": "Tablero Kanban | Nombre Proyecto",
  "columns": [
    {
      "id": "backlog",
      "title": "Ideacion",
      "limit": 8,
      "policy": "Reglas de entrada/salida de la columna"
    }
  ],
  "iterations": [
    {
      "id": "it1",
      "label": "Iteracion 1 (01/02/2026 - 14/02/2026)",
      "range": "01/02/2026 - 14/02/2026"
    }
  ],
  "tasks": [
    {
      "id": "EC-01",
      "title": "Catalogo",
      "description": "Descripcion",
      "priority": "Media",
      "tags": ["Front", "Feature"],
      "assignee": "Equipo Front",
      "initials": "EF",
      "columnId": "backlog",
      "iteration": "it1",
      "startDate": "01/02/2026",
      "dueDate": "05/02/2026"
    }
  ],
  "updatedAt": "2026-02-21T18:00:00.000Z"
}
```

### 2.4. Claves de localStorage
Definidas en `src/projectStorage.js`:

- `kanban:projects:index`: lista de proyectos disponibles (id, name, updatedAt).
- `kanban:projects:active`: id del proyecto activo.
- `kanban:project:<id>`: documento completo del proyecto.

### 2.5. Funciones principales de storage
En `src/projectStorage.js`:
- `loadProjectsIndex()`
- `saveProjectsIndex(index)`
- `loadProject(projectId)`
- `saveProject(project)`
- `removeProject(projectId)`
- `getActiveProjectId()`
- `setActiveProjectId(projectId)`
- `addProjectToIndex(project)`
- `removeProjectFromIndex(projectId)`

### 2.6. Flujo de arranque
En `Kanban.jsx`:
1. Se ejecuta `loadOrCreateInitialProject()`.
2. Si hay proyecto activo válido, lo carga.
3. Si no hay activo pero existe índice, carga el primero.
4. Si no hay datos, crea proyecto por defecto y lo persiste.

### 2.7. Flujo de actualización
`updateProject(updater)`:
- actualiza el estado en memoria,
- recalcula `updatedAt`,
- guarda el proyecto,
- sincroniza índice de proyectos.

### 2.8. Gestión del menú
El menú concentra acciones de proyecto:
- Crear, renombrar, duplicar, eliminar.
- Exportar/importar.
- Configurar tablero.

Las acciones críticas usan modales y validación previa.

### 2.9. Importación de JSON
Validación mínima:
- existencia de `columns`, `iterations`, `tasks` como arreglos.

Modos:
- Crear nuevo:
- se sanitiza contenido,
- se genera nuevo `id`,
- se agrega al índice y se activa.

- Reemplazar actual:
- se conserva `id` del proyecto activo,
- se sobreescriben datos del proyecto activo.

Funciones de saneo:
- `sanitizeImportedProject(raw)`
- `sanitizeImportedProjectForReplace(raw, currentProject)`

### 2.10. Eliminación segura de proyecto
Flujo actual:
1. Modal de advertencia (implicaciones).
2. Confirmación final.
3. Temporizador de 10 segundos para habilitar botón definitivo.
4. Eliminación física del proyecto + limpieza de índice + carga de fallback.

### 2.11. Configuración de columnas/iteraciones con tareas
Si se elimina una columna o iteración con tareas:
- se requiere destino de movimiento (`Mover y Eliminar`),
- al guardar configuración se reasignan referencias de tareas.

Fallback adicional:
- si alguna referencia queda inválida, se asigna primera columna/iteración válida.

### 2.12. Estilos
- CSS Modules en `src/Kanban.module.css`.
- Unidades relativas (`rem`, `em`).
- Tipografía responsiva con `clamp()`.
- Reset global en `src/index.css`.
- `min-height: 100dvh` en contenedor principal.
- Microinteracciones de botones/tarjetas, con soporte `prefers-reduced-motion`.

### 2.13. Comandos de desarrollo
```bash
npm install
npm run dev
```

### 2.14. Build y calidad
```bash
npm run lint
npm run build
```

---

## 3. Buenas prácticas operativas
- Exportar JSON antes de acciones destructivas.
- Mantener nombres de IDs estables para integridad de referencias.
- Probar importación en modo `Crear nuevo` antes de `Reemplazar actual`.
- Mantener `version` para futuras migraciones de esquema.

---

## 4. Estado actual del proyecto
- Funcional para uso offline.
- Multi-proyecto completamente operativo.
- CRUD de configuración (título, columnas, iteraciones).
- Seguridad reforzada en eliminación.
- Documentación funcional y técnica consolidada.
