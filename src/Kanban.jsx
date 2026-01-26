import React, { useState, useMemo, useEffect } from "react";
import styles from "./Kanban.module.css";

/** Helpers de fechas */
function ddmmyyyyToISO(ddmmyyyy) {
  if (!ddmmyyyy || !ddmmyyyy.includes("/")) return "";
  const [dd, mm, yyyy] = ddmmyyyy.split("/");
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

function isoToDDMMYYYY(iso) {
  if (!iso || !iso.includes("-")) return "";
  const [yyyy, mm, dd] = iso.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

function parseIterationRange(range) {
  // "DD/MM/YYYY - DD/MM/YYYY"
  const [start, end] = range.split(" - ").map((s) => s.trim());
  return { start, end };
}

function tagSlug(tag) {
  // "Front-end" -> "frontend", "Back-end" -> "backend"
  return tag.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function Kanban() {
  // Columnas
  const COLUMNS = [
    {
      id: "backlog",
      title: "Ideación",
      limit: 8,
      policy:
        "DoR: Tareas deben tener descripción técnica básica y criterios de aceptación iniciales. DoD: la tarea se considera lista para análisis cuando hay claridad suficiente para estimar.",
    },
    {
      id: "analysis",
      title: "Tareas",
      limit: 3,
      policy:
        "DoR: Definición de endpoints o mockups aprobados. DoD: contratos de API documentados y mockups aprobados.",
    },
    {
      id: "development",
      title: "En Procesos",
      limit: 4,
      policy:
        "DoR: Requisitos claros, tickets detallados. DoD: código funcionando, adherido a estilos, comentarios cuando necesario y pruebas básicas pasadas.",
    },
    {
      id: "qa",
      title: "Termindas",
      limit: 3,
      policy:
        "DoR: Pruebas unitarias diseñadas. DoD: pruebas unitarias y de integración pasadas en entorno de staging.",
    },
    {
      id: "deployment",
      title: "Pruebas",
      limit: 2,
      policy:
        "DoR: Revisión de cambios y plan de despliegue. DoD: aprobación del Tech Lead y backup de DB realizado.",
    },
  ];

  // Iteraciones
  const ITERATIONS = [
    {
      id: 1,
      label: "Iteración 1 (01/02/2026 - 14/02/2026)",
      range: "01/02/2026 - 14/02/2026",
    },
    {
      id: 2,
      label: "Iteración 2 (15/02/2026 - 28/02/2026)",
      range: "15/02/2026 - 28/02/2026",
    },
    {
      id: 3,
      label: "Iteración 3 (01/03/2026 - 14/03/2026)",
      range: "01/03/2026 - 14/03/2026",
    },
  ];

  const getIterationDates = (iterationId) => {
    const it = ITERATIONS.find((i) => i.id === iterationId);
    if (!it) return { start: "", end: "" };
    return parseIterationRange(it.range);
  };

  // Tareas iniciales (ya incluyen startDate y dueDate en DD/MM/YYYY)
  const INITIAL_TASKS = [
  // =========================
  // Iteración 1 (01/02/2026 - 14/02/2026)
  // =========================
  {
    id: "EC-01",
    title: "Catálogo",
    description:
      "Construir vista de catálogo con listado, filtros básicos y tarjetas de producto desde datos simulados o API.",
    points: 3,
    priority: "Media",
    tags: ["Front", "Feature", "Catálogo"],
    assignee: "Equipo Front",
    initials: "EF",
    columnId: "backlog",
    iteration: 1,
    startDate: "01/02/2026",
    dueDate: "05/02/2026",
  },
  {
    id: "EC-02",
    title: "Carrito",
    description:
      "Implementar carrito con agregar, quitar, modificar cantidades y resumen de totales persistente durante la sesión del usuario.",
    points: 3,
    priority: "Media",
    tags: ["Front", "Feature"],
    assignee: "Equipo Front",
    initials: "EF",
    columnId: "backlog",
    iteration: 1,
    startDate: "03/02/2026",
    dueDate: "07/02/2026",
  },
  {
    id: "EC-03",
    title: "Checkout base",
    description:
      "Crear flujo inicial de checkout con formulario, validaciones, resumen de compra y confirmación previa al pago.",
    points: 5,
    priority: "Alta",
    tags: ["Front", "Feature", "Checkout"],
    assignee: "Equipo Front",
    initials: "EF",
    columnId: "backlog",
    iteration: 1,
    startDate: "06/02/2026",
    dueDate: "12/02/2026",
  },
  {
    id: "EC-04",
    title: "Back Productos + Stock",
    description:
      "Desarrollar endpoints de productos y stock: listar, detalle, actualizar existencias y reglas mínimas de validación.",
    points: 5,
    priority: "Alta",
    tags: ["Back", "Feature"],
    assignee: "Equipo Back",
    initials: "EB",
    columnId: "backlog",
    iteration: 1,
    startDate: "01/02/2026",
    dueDate: "10/02/2026",
  },
  {
    id: "EC-05",
    title: "Back Orden PENDING",
    description:
      "Crear orden en estado PENDING con items, totales, usuario y timestamp; persistencia y respuesta para frontend.",
    points: 3,
    priority: "Media",
    tags: ["Back", "Feature"],
    assignee: "Equipo Back",
    initials: "EB",
    columnId: "backlog",
    iteration: 1,
    startDate: "08/02/2026",
    dueDate: "14/02/2026",
  },
  {
    id: "EC-06",
    title: "Integración + Deploy demo 1",
    description:
      "Integrar front y back, ejecutar smoke tests y desplegar demo funcional con flujo catálogo-carrito-checkout básico.",
    points: 2,
    priority: "Media",
    tags: ["Feature"],
    assignee: "Equipo Integración",
    initials: "EI",
    columnId: "backlog",
    iteration: 1,
    startDate: "13/02/2026",
    dueDate: "14/02/2026",
  },

  // =========================
  // Iteración 2 (15/02/2026 - 28/02/2026)
  // =========================
  {
    id: "EC-07",
    title: "MP Preferencia pago (Back)",
    description:
      "Generar preferencia de pago en Mercado Pago desde orden PENDING; guardar referencia, montos y metadatos en backend.",
    points: 5,
    priority: "Alta",
    tags: ["Back", "Feature", "Mercado Pago"],
    assignee: "Equipo Back",
    initials: "EB",
    columnId: "backlog",
    iteration: 2,
    startDate: "15/02/2026",
    dueDate: "20/02/2026",
  },
  {
    id: "EC-08",
    title: "MP UI pago (Front)",
    description:
      "Implementar UI para iniciar pago Mercado Pago: botón, redirección, manejo de estados y feedback claro al usuario.",
    points: 3,
    priority: "Media",
    tags: ["Front", "Feature", "Mercado Pago"],
    assignee: "Equipo Front",
    initials: "EF",
    columnId: "backlog",
    iteration: 2,
    startDate: "18/02/2026",
    dueDate: "23/02/2026",
  },
  {
    id: "EC-09",
    title: "MP Webhook/retorno y actualizar orden (Back)",
    description:
      "Recibir webhook/retorno, validar firma, consultar estado y actualizar orden a APPROVED/REJECTED con trazabilidad completa.",
    points: 5,
    priority: "Alta",
    tags: ["Back", "Feature", "Mercado Pago"],
    assignee: "Equipo Back",
    initials: "EB",
    columnId: "backlog",
    iteration: 2,
    startDate: "20/02/2026",
    dueDate: "27/02/2026",
  },
  {
    id: "EC-10",
    title: "Confirmación compra (Front)",
    description:
      "Mostrar pantalla de confirmación según estado de pago, detalle de orden, mensajes claros y acciones siguientes para usuario.",
    points: 2,
    priority: "Media",
    tags: ["Front", "Feature"],
    assignee: "Equipo Front",
    initials: "EF",
    columnId: "backlog",
    iteration: 2,
    startDate: "24/02/2026",
    dueDate: "26/02/2026",
  },
  {
    id: "EC-11",
    title: "QA flujo E2E",
    description:
      "Ejecutar pruebas E2E del flujo completo; registrar bugs/mejoras, reproducibilidad, severidad y criterios de cierre acordados.",
    points: 3,
    priority: "Media",
    tags: ["QA", "Bug/Mejora"],
    assignee: "Equipo QA",
    initials: "QA",
    columnId: "backlog",
    iteration: 2,
    startDate: "25/02/2026",
    dueDate: "28/02/2026",
  },
  {
    id: "EC-12",
    title: "Deploy demo 2",
    description:
      "Desplegar demo con Mercado Pago integrado, rutas finales activas y evidencias de pruebas básicas documentadas para entrega.",
    points: 1,
    priority: "Baja",
    tags: ["Feature"],
    assignee: "Equipo Integración",
    initials: "EI",
    columnId: "backlog",
    iteration: 2,
    startDate: "28/02/2026",
    dueDate: "28/02/2026",
  },

  // =========================
  // Iteración 3 (01/03/2026 - 14/03/2026)
  // =========================
  {
    id: "EC-13",
    title: "Login Admin",
    description:
      "Implementar login admin con validación, sesión segura, rutas protegidas y respuesta de backend basada en tokens.",
    points: 3,
    priority: "Media",
    tags: ["Back", "Front", "Feature", "Admin"],
    assignee: "Equipo Fullstack",
    initials: "FS",
    columnId: "backlog",
    iteration: 3,
    startDate: "01/03/2026",
    dueDate: "04/03/2026",
  },
  {
    id: "EC-14",
    title: "Admin productos",
    description:
      "Crear CRUD de productos desde panel admin: altas, edición, imágenes, stock y validaciones en frontend/backend.",
    points: 5,
    priority: "Alta",
    tags: ["Front", "Back", "Feature", "Admin"],
    assignee: "Equipo Fullstack",
    initials: "FS",
    columnId: "backlog",
    iteration: 3,
    startDate: "03/03/2026",
    dueDate: "09/03/2026",
  },
  {
    id: "EC-15",
    title: "Admin órdenes",
    description:
      "Panel de órdenes para revisar estados, buscar por fecha/cliente y actualizar estatus con auditoría mínima de cambios.",
    points: 3,
    priority: "Media",
    tags: ["Front", "Back", "Feature", "Admin"],
    assignee: "Equipo Fullstack",
    initials: "FS",
    columnId: "backlog",
    iteration: 3,
    startDate: "08/03/2026",
    dueDate: "11/03/2026",
  },
  {
    id: "EC-16",
    title: "UX mejoras críticas",
    description:
      "Aplicar mejoras críticas UX: jerarquía visual, accesibilidad básica, estados vacíos, loaders, errores y microcopys consistentes.",
    points: 2,
    priority: "Media",
    tags: ["UX/UI", "Mejora"],
    assignee: "Equipo UX/UI",
    initials: "UX",
    columnId: "backlog",
    iteration: 3,
    startDate: "10/03/2026",
    dueDate: "12/03/2026",
  },
  {
    id: "EC-17",
    title: "Performance básico",
    description:
      "Optimizar performance: lazy loading, compresión de imágenes, memoización, reducir renders y medir métricas principales en UI.",
    points: 2,
    priority: "Media",
    tags: ["Front", "Mejora"],
    assignee: "Equipo Front",
    initials: "EF",
    columnId: "backlog",
    iteration: 3,
    startDate: "11/03/2026",
    dueDate: "13/03/2026",
  },
  {
    id: "EC-18",
    title: "Deploy final + cierre",
    description:
      "Desplegar versión final, checklist de cierre, documentación breve, retro final y entrega de evidencias del proyecto completo.",
    points: 1,
    priority: "Baja",
    tags: ["Feature"],
    assignee: "Equipo Integración",
    initials: "EI",
    columnId: "backlog",
    iteration: 3,
    startDate: "14/03/2026",
    dueDate: "14/03/2026",
  },
];


  // Estado
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [darkMode, setDarkMode] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIteration, setSelectedIteration] = useState(1);

  const [newTask, setNewTask] = useState({
    title: "",
    priority: "Media",
    tags: [],
    assignee: "",
    startDateISO: "",
    dueDateISO: "",
  });

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  // Filtrar por iteración
  const visibleTasks = useMemo(
    () => tasks.filter((t) => t.iteration === selectedIteration),
    [tasks, selectedIteration]
  );

  const columnTasks = (colId) => visibleTasks.filter((t) => t.columnId === colId);

  // Modal
  const openModal = () => {
    const { start, end } = getIterationDates(selectedIteration);
    setNewTask({
      title: "",
      priority: "Media",
      tags: [],
      assignee: "",
      startDateISO: ddmmyyyyToISO(start),
      dueDateISO: ddmmyyyyToISO(end),
    });
    setIsModalOpen(true);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.assignee.trim()) return;

    const initials = newTask.assignee
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const { start, end } = getIterationDates(selectedIteration);

    const startDate =
      isoToDDMMYYYY(newTask.startDateISO) || start; // fallback a iteración
    const dueDate =
      isoToDDMMYYYY(newTask.dueDateISO) || end; // fallback a iteración

    const taskToAdd = {
      id: `t-${Date.now()}`,
      title: newTask.title.trim(),
      priority: newTask.priority,
      tags: newTask.tags,
      assignee: newTask.assignee.trim(),
      columnId: "backlog",
      iteration: selectedIteration,
      initials,
      startDate,
      dueDate,
    };

    setTasks((prev) => [...prev, taskToAdd]);
    setIsModalOpen(false);
  };

  // Etiquetas
  const toggleTag = (tag) => {
    setNewTask((prev) => {
      const exists = prev.tags.includes(tag);
      const next = exists ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag];
      return { ...prev, tags: next };
    });
  };

  // Drag & drop
  const onDragStart = (taskId) => setDraggedId(taskId);
  const onDragOver = (e) => e.preventDefault();
  const onDropToColumn = (columnId) => {
    if (!draggedId) return;
    setTasks((prev) => prev.map((t) => (t.id === draggedId ? { ...t, columnId } : t)));
    setDraggedId(null);
  };

  // Clases por prioridad
  const getPriorityClass = (p) => {
    switch (p) {
      case "Crítica":
        return styles.priorityCritica;
      case "Alta":
        return styles.priorityAlta;
      case "Media":
        return styles.priorityMedia;
      default:
        return styles.priorityBaja;
    }
  };

  const currentIteration = ITERATIONS.find((i) => i.id === selectedIteration);

  return (
    <div className={`${styles.app} ${darkMode ? styles.dark : ""}`} aria-label="Kanban E-commerce con iteraciones">
      {/* Header */}
      <div className={styles.boardHeader} aria-label="Encabezado Tablero">
        <div className={styles.titleWrap}>
          <div className={styles.title}>Tablero Kanban | E-commerce</div>
          <div className={styles.description}>
            {`[Iteración actual: ${selectedIteration} • rango: ${currentIteration?.range}]`}
          </div>
        </div>

        <div className={styles.controls} role="group" aria-label="Controles">
          <select
            className={styles.select}
            value={selectedIteration}
            onChange={(e) => setSelectedIteration(parseInt(e.target.value, 10))}
            aria-label="Seleccionar Iteración"
          >
            {ITERATIONS.map((it) => (
              <option key={it.id} value={it.id}>
                {it.label}
              </option>
            ))}
          </select>

          <button className={styles.btn} onClick={openModal} aria-label="Añadir nueva tarea">
            Nueva Tarea
          </button>

          <button
            className={`${styles.btn} ${styles.secondary}`}
            onClick={() => setDarkMode((d) => !d)}
            aria-label="Alternar modo oscuro"
            title="Modo Oscuro"
          >
            {darkMode ? "Claro" : "Oscuro"}
          </button>
        </div>
      </div>

      {/* Board */}
      <div className={styles.board} aria-label="Tablero Kanban">
        <div className={styles.columns} role="region" aria-label="Columnas Kanban">
          {COLUMNS.map((col) => {
            const items = columnTasks(col.id);
            const atLimit = items.length >= col.limit;
            const overLimit = items.length > col.limit;

            return (
              <section key={col.id} className={styles.column} aria-label={`Columna ${col.title}`} draggable={false}>
                <div className={styles.columnHeader}>
                  <div className={styles.columnHeaderLeft}>
                    <span className={styles.columnColor} aria-label="Color de columna" />
                    <span className={styles.columnTitle}>{col.title}</span>
                  </div>

                  <div className={styles.columnHeaderRight}>
                    <span
                      className={`${styles.badge} ${atLimit ? styles.badgeWarn : styles.badgeNeutral}`}
                    >
                      WIP= {items.length} / {col.limit}
                    </span>
                    {overLimit ? (
                      <span className={`${styles.badge} ${styles.badgeDanger}`}>Sobre límite</span>
                    ) : null}
                  </div>
                </div>

                <div className={styles.policyNote} aria-label={`Políticas de la columna ${col.title}`}>
                  {col.policy}
                </div>

                <div
                  className={`${styles.cardStack} ${darkMode ? styles.cardStackDark : ""}`}
                  onDragOver={onDragOver}
                  onDrop={() => onDropToColumn(col.id)}
                  role="group"
                  aria-label={`Área de tareas de ${col.title}`}
                >
                  {items.map((t) => (
                    <article
                      key={t.id}
                      className={`${styles.card} ${getPriorityClass(t.priority)}`}
                      draggable
                      onDragStart={() => onDragStart(t.id)}
                      role="article"
                      aria-label={`Tarea ${t.title}`}
                    >
                      {/* Header card */}
                      <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>
                          {t.title}
                          <br/>
                          <p className={styles.description}>{t.description}</p>
                          </div>
                        <span className={`${styles.badge} ${styles.badgeSoft}`}>{t.priority}</span>
                      </div>

                      {/* Tags */}
                      <div className={styles.tagsRow}>
                        {t.tags.map((tag) => {
                          const slug = tagSlug(tag);
                          const tagClass = styles[`tag_${slug}`] || styles.tag_default;
                          return (
                            <span key={tag} className={`${styles.chip} ${tagClass}`}>
                              {tag}
                            </span>
                          );
                        })}
                      </div>

                      {/* Meta */}
                      <div className={styles.metaRow}>
                        <span className={styles.metaText}>
                          {t.assignee} • {t.initials}
                        </span>
                        <span className={styles.metaText}>Iteración {t.iteration}</span>
                      </div>

                      <div className={styles.metaRow}>
                        <span className={styles.metaStrong}>ID: {t.id}</span>
                        <span className={styles.metaText}>
                          {t.startDate} → {t.dueDate}
                        </span>
                      </div>
                    </article>
                  ))}

                  {items.length === 0 && (
                    <div className={styles.emptyDrop}>
                      Arrastra una tarea aquí
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className={styles.overlay} aria-label="Modal de nueva tarea" onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Formulario">
            <div className={styles.modalTop}>
              <strong className={styles.modalHeader}>Nueva Tarea</strong>
              <button
                className={`${styles.btn} ${styles.secondary}`}
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar"
                type="button"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleAddTask} className={styles.form}>
              <div className={styles.formRow}>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label htmlFor="title" className={styles.label}>Título</label>
                  <input
                    id="title"
                    className={styles.input}
                    value={newTask.title}
                    onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Ej: Refactorizar carrito de compras"
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="priority" className={styles.label}>Prioridad</label>
                  <select
                    id="priority"
                    className={styles.select}
                    value={newTask.priority}
                    onChange={(e) => setNewTask((p) => ({ ...p, priority: e.target.value }))}
                  >
                    <option value="Crítica">Crítica</option>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Iteración</label>
                  <input
                    className={styles.input}
                    value={`Iteración ${selectedIteration}`}
                    readOnly
                    aria-label="Iteración asignada"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="startDate" className={styles.label}>Fecha inicio</label>
                  <input
                    id="startDate"
                    type="date"
                    className={styles.input}
                    value={newTask.startDateISO}
                    onChange={(e) => setNewTask((p) => ({ ...p, startDateISO: e.target.value }))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="dueDate" className={styles.label}>Fecha límite</label>
                  <input
                    id="dueDate"
                    type="date"
                    className={styles.input}
                    value={newTask.dueDateISO}
                    onChange={(e) => setNewTask((p) => ({ ...p, dueDateISO: e.target.value }))}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label htmlFor="assignee" className={styles.label}>Responsable</label>
                  <input
                    id="assignee"
                    className={styles.input}
                    placeholder="Nombre del responsable"
                    value={newTask.assignee}
                    onChange={(e) => setNewTask((p) => ({ ...p, assignee: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Etiquetas</label>
                <div className={styles.tagButtons}>
                  {["Front-end", "Back-end", "API", "DB"].map((tag) => {
                    const active = newTask.tags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`${styles.tagBtn} ${active ? styles.tagBtnActive : ""}`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btn} aria-label="Crear tarea">
                  Crear Tarea
                </button>
              </div>

              <p className={styles.hint}>
                Si no modificas fechas, se usarán por defecto las fechas del rango de la iteración seleccionada.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
