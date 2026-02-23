function makeProjectId() {
  const uuid =
    typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `p_${uuid}`;
}

export function createDefaultProject() {
  const columns = [
    {
      id: "backlog",
      title: "Ideacion",
      limit: 8,
      policy: "Configurar las politicas",
    },
    {
      id: "analysis",
      title: "Tareas",
      limit: 3,
      policy: "Configurar las politicas",
    },
    {
      id: "development",
      title: "En Proceso",
      limit: 4,
      policy: "Configurar las politicas",
    },
    {
      id: "qa",
      title: "Terminadas",
      limit: 3,
      policy: "Configurar las politicas",
    },
    {
      id: "deployment",
      title: "Pruebas",
      limit: 2,
      policy: "Configurar las politicas",
    },
  ];

  const iterations = [
    {
      id: "it1",
      label: "Iteracion 1 (01/02/2026 - 14/02/2026)",
      range: "01/02/2026 - 14/02/2026",
    },
    {
      id: "it2",
      label: "Iteracion 2 (15/02/2026 - 28/02/2026)",
      range: "15/02/2026 - 28/02/2026",
    },
    {
      id: "it3",
      label: "Iteracion 3 (01/03/2026 - 14/03/2026)",
      range: "01/03/2026 - 14/03/2026",
    },
  ];

  const tasks = [];
  const tagsCatalog = [
    { id: "tag_frontend", name: "Front-end" },
    { id: "tag_backend", name: "Back-end" },
    { id: "tag_api", name: "API" },
    { id: "tag_db", name: "DB" },
  ];

  const now = new Date().toISOString();
  const id = makeProjectId();
  return {
    version: 1,
    id,
    name: "E-commerce",
    title: "Tablero Kanban | E-commerce",
    columns,
    iterations,
    tagsCatalog,
    tasks,
    updatedAt: now,
  };
}
