import { ddmmyyyyToISO, isoToDDMMYYYY, makeId } from "../kanbanLogic";

export function useKanbanTaskActions({
  project,
  selectedIteration,
  newTask,
  setNewTask,
  editingTaskId,
  setEditingTaskId,
  setTaskFormError,
  setShowFirstTaskOnboarding,
  setIsModalOpen,
  getIterationDates,
  updateProject,
  draggedId,
  setDraggedId,
  styles,
}) {
  const openModal = () => {
    setShowFirstTaskOnboarding(false);
    setEditingTaskId(null);
    setTaskFormError("");
    const { start, end } = getIterationDates(selectedIteration);
    setNewTask({
      title: "",
      description: "",
      priority: "Media",
      tags: [],
      assignee: "",
      startDateISO: ddmmyyyyToISO(start),
      dueDateISO: ddmmyyyyToISO(end),
      checklistItems: [],
    });
    setIsModalOpen(true);
  };

  const openEditTask = (task) => {
    if (!task) return;
    setShowFirstTaskOnboarding(false);
    setEditingTaskId(task.id);
    setTaskFormError("");
    setNewTask({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "Media",
      tags: Array.isArray(task.tags) ? task.tags : [],
      assignee: task.assignee || "",
      startDateISO: ddmmyyyyToISO(task.startDate || ""),
      dueDateISO: ddmmyyyyToISO(task.dueDate || ""),
      checklistItems: Array.isArray(task.checklist)
        ? task.checklist.map((item) => ({
            id: String(item.id || makeId("chk")),
            text: String(item.text || ""),
            done: Boolean(item.done),
          }))
        : [],
    });
    setIsModalOpen(true);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.assignee.trim()) return false;
    const defaultColumnId = project.columns[0]?.id;
    if (!defaultColumnId) return false;

    const initials = newTask.assignee
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const { start, end } = getIterationDates(selectedIteration);
    const startDateISO = newTask.startDateISO || ddmmyyyyToISO(start);
    const dueDateISO = newTask.dueDateISO || ddmmyyyyToISO(end);

    if (!startDateISO || !dueDateISO) {
      setTaskFormError("Define fecha de inicio y fecha limite para la tarea.");
      return false;
    }
    if (startDateISO > dueDateISO) {
      setTaskFormError("La fecha de inicio no puede ser mayor a la fecha limite.");
      return false;
    }

    const normalizedChecklist = (newTask.checklistItems || [])
      .map((item) => ({
        id: item.id,
        text: String(item.text || "").trim(),
        done: Boolean(item.done),
      }))
      .filter((item) => item.text);

    const taskPayload = {
      title: newTask.title.trim(),
      description: String(newTask.description || "").trim(),
      priority: newTask.priority,
      tags: newTask.tags,
      checklist: normalizedChecklist,
      assignee: newTask.assignee.trim(),
      initials,
      startDate: isoToDDMMYYYY(startDateISO) || start,
      dueDate: isoToDDMMYYYY(dueDateISO) || end,
    };

    if (editingTaskId) {
      updateProject((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === editingTaskId ? { ...t, ...taskPayload } : t)),
      }));
    } else {
      const taskToAdd = {
        id: makeId("t"),
        ...taskPayload,
        columnId: defaultColumnId,
        iteration: selectedIteration,
      };
      updateProject((prev) => ({
        ...prev,
        tasks: [...prev.tasks, taskToAdd],
      }));
    }

    setShowFirstTaskOnboarding(false);
    setTaskFormError("");
    setEditingTaskId(null);
    setIsModalOpen(false);
    return true;
  };

  const toggleTag = (tag) => {
    setNewTask((prev) => {
      const exists = prev.tags.includes(tag);
      const next = exists ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag];
      return { ...prev, tags: next };
    });
  };

  const onDragStart = (taskId) => setDraggedId(taskId);
  const onDragOver = (e) => e.preventDefault();

  const onDropToColumn = (columnId) => {
    if (!draggedId) return;
    updateProject((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === draggedId ? { ...t, columnId } : t)),
    }));
    setDraggedId(null);
  };

  const getPriorityClass = (p) => {
    switch (p) {
      case "Critica":
        return styles.priorityCritica;
      case "Alta":
        return styles.priorityAlta;
      case "Media":
        return styles.priorityMedia;
      default:
        return styles.priorityBaja;
    }
  };

  return {
    openModal,
    openEditTask,
    handleAddTask,
    toggleTag,
    onDragStart,
    onDragOver,
    onDropToColumn,
    getPriorityClass,
  };
}
