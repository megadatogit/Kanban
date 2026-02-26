import React, { useState } from "react";
import { Plus, X } from "lucide-react";

export default function KanbanTaskModal({
  isOpen,
  styles,
  showFirstTaskOnboarding,
  setShowFirstTaskOnboarding,
  setIsModalOpen,
  taskFormError,
  editingTaskId,
  setEditingTaskId,
  setTaskFormError,
  handleAddTask,
  newTask,
  setNewTask,
  renderCustomSelect,
  currentIteration,
  project,
  toggleTag,
}) {
  const [checklistText, setChecklistText] = useState("");

  if (!isOpen) return null;

  const handleCloseModal = () => {
    setChecklistText("");
    setTaskFormError("");
    setShowFirstTaskOnboarding(false);
    setEditingTaskId(null);
    setIsModalOpen(false);
  };

  const checklistItems = Array.isArray(newTask.checklistItems) ? newTask.checklistItems : [];

  const addChecklistItem = () => {
    const text = checklistText.trim();
    if (!text) return;
    setNewTask((prev) => ({
      ...prev,
      checklistItems: [
        ...(Array.isArray(prev.checklistItems) ? prev.checklistItems : []),
        { id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, text, done: false },
      ],
    }));
    setChecklistText("");
  };

  const toggleChecklistItem = (itemId) => {
    setNewTask((prev) => ({
      ...prev,
      checklistItems: (Array.isArray(prev.checklistItems) ? prev.checklistItems : []).map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      ),
    }));
  };

  const removeChecklistItem = (itemId) => {
    setNewTask((prev) => ({
      ...prev,
      checklistItems: (Array.isArray(prev.checklistItems) ? prev.checklistItems : []).filter(
        (item) => item.id !== itemId
      ),
    }));
  };

  return (
    <div
      className={styles.overlay}
      aria-label={editingTaskId ? "Modal de editar tarea" : "Modal de nueva tarea"}
      onClick={handleCloseModal}
    >
      <div className={`${styles.modal} ${styles.taskModal}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Formulario">
        <div className={styles.modalTop}>
          <strong className={styles.modalHeader}>{editingTaskId ? "Editar Tarea" : "Nueva Tarea"}</strong>
          <button
            className={styles.iconBtn}
            onClick={handleCloseModal}
            aria-label="Cerrar modal"
            title="Cerrar"
            type="button"
          >
            <X size={18} strokeWidth={2.1} />
          </button>
        </div>

        {showFirstTaskOnboarding ? (
          <p className={`${styles.hint} ${styles.onboardingHint}`}>
            Paso 2/2: crea tu primera tarea para iniciar el flujo del tablero.
          </p>
        ) : null}

        <form
          onSubmit={(e) => {
            const didSave = handleAddTask(e);
            if (didSave) setChecklistText("");
          }}
          className={styles.form}
        >
          <div className={styles.formRow}>
            <div className={`${styles.formGroup} ${styles.full}`}>
              <label htmlFor="title" className={styles.label}>Titulo</label>
              <input
                id="title"
                className={styles.input}
                value={newTask.title}
                onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ej: Refactorizar carrito"
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={`${styles.formGroup} ${styles.full}`}>
              <label htmlFor="description" className={styles.label}>Descripcion</label>
              <textarea
                id="description"
                className={`${styles.textarea} ${styles.taskDescriptionTextarea}`}
                rows={3}
                value={newTask.description || ""}
                onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
                placeholder="Ej: Alcance, objetivo y criterio de aceptacion de la tarea"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="priority" className={styles.label}>Prioridad</label>
              {renderCustomSelect({
                selectKey: "task-priority",
                value: newTask.priority,
                onChange: (nextPriority) => setNewTask((p) => ({ ...p, priority: nextPriority })),
                options: [
                  { value: "Critica", label: "Critica" },
                  { value: "Alta", label: "Alta" },
                  { value: "Media", label: "Media" },
                  { value: "Baja", label: "Baja" },
                ],
                placeholder: "Prioridad",
                ariaLabel: "Seleccionar prioridad",
              })}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Iteracion</label>
              <input className={styles.input} value={currentIteration?.label ?? ""} readOnly aria-label="Iteracion" />
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
                onChange={(e) => {
                  setTaskFormError("");
                  setNewTask((p) => ({ ...p, startDateISO: e.target.value }));
                }}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="dueDate" className={styles.label}>Fecha limite</label>
              <input
                id="dueDate"
                type="date"
                className={styles.input}
                value={newTask.dueDateISO}
                onChange={(e) => {
                  setTaskFormError("");
                  setNewTask((p) => ({ ...p, dueDateISO: e.target.value }));
                }}
              />
            </div>
          </div>

          {taskFormError ? <p className={styles.errorText}>{taskFormError}</p> : null}

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
              {project.tagsCatalog.map((tagItem) => {
                const tag = tagItem.name;
                const active = newTask.tags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tagItem.id}
                    onClick={() => toggleTag(tag)}
                    className={`${styles.tagBtn} ${active ? styles.tagBtnActive : ""}`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`${styles.formGroup} ${styles.checklistGroup}`}>
            <label className={styles.label}>Actividades (To-Do)</label>
            <div className={styles.checklistCreateRow}>
              <input
                className={styles.input}
                value={checklistText}
                onChange={(e) => setChecklistText(e.target.value)}
                placeholder="Ej: Definir criterios de aceptacion"
              />
              <button
                type="button"
                className={`${styles.btn} ${styles.secondary}`}
                onClick={addChecklistItem}
                aria-label="Agregar actividad"
                title="Agregar actividad"
              >
                <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>
            {checklistItems.length > 0 ? (
              <div className={`${styles.checklistList} ${styles.checklistListScroll}`}>
                {checklistItems.map((item) => (
                  <div key={item.id} className={styles.checklistItem}>
                    <label className={styles.checklistItemLabel}>
                      <input
                        type="checkbox"
                        checked={Boolean(item.done)}
                        onChange={() => toggleChecklistItem(item.id)}
                      />
                      <span className={item.done ? styles.checklistItemDone : ""}>{item.text}</span>
                    </label>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.trashBtn}`}
                      onClick={() => removeChecklistItem(item.id)}
                      aria-label={`Eliminar actividad ${item.text}`}
                      title="Eliminar actividad"
                    >
                      <X size={14} strokeWidth={2.1} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className={styles.actions}>
            <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={handleCloseModal}>
              Cancelar
            </button>
            <button type="submit" className={styles.btn} aria-label={editingTaskId ? "Guardar cambios de tarea" : "Crear tarea"}>
              {editingTaskId ? "Guardar Cambios" : "Crear Tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
