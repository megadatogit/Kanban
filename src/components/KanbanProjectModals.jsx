import React from "react";
import { X } from "lucide-react";

export default function KanbanProjectModals({
  styles,
  isCreateProjectOpen,
  closeCreateProjectModal,
  submitCreateProject,
  newProjectName,
  setNewProjectName,
  isRenameProjectOpen,
  closeRenameProjectModal,
  submitRenameProject,
  renameProjectName,
  setRenameProjectName,
  isDeleteProjectOpen,
  closeDeleteProjectModal,
  isDeleteSuccessOpen,
  closeDeleteSuccessModal,
  deletedProjectName,
  project,
  isDeleteFinalStep,
  deleteCountdown,
  deleteProjectError,
  executeDeleteProject,
  confirmDeleteProject,
}) {
  return (
    <>
      {isCreateProjectOpen && (
        <div className={styles.overlay} aria-label="Modal nuevo proyecto" onClick={closeCreateProjectModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Crear proyecto">
            <div className={styles.modalTop}>
              <strong className={styles.modalHeader}>Nuevo Proyecto</strong>
              <button
                className={styles.iconBtn}
                onClick={closeCreateProjectModal}
                aria-label="Cerrar modal"
                title="Cerrar"
                type="button"
              >
                <X size={18} strokeWidth={2.1} />
              </button>
            </div>

            <form onSubmit={submitCreateProject} className={styles.form}>
              <div className={styles.formRow}>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label htmlFor="newProjectName" className={styles.label}>Nombre del proyecto</label>
                  <input
                    id="newProjectName"
                    className={styles.input}
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Ej: App Inventario"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={closeCreateProjectModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btn}>
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRenameProjectOpen && (
        <div className={styles.overlay} aria-label="Modal renombrar proyecto" onClick={closeRenameProjectModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Renombrar proyecto">
            <div className={styles.modalTop}>
              <strong className={styles.modalHeader}>Renombrar Proyecto</strong>
              <button
                className={styles.iconBtn}
                onClick={closeRenameProjectModal}
                aria-label="Cerrar modal"
                title="Cerrar"
                type="button"
              >
                <X size={18} strokeWidth={2.1} />
              </button>
            </div>

            <form onSubmit={submitRenameProject} className={styles.form}>
              <div className={styles.formRow}>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label htmlFor="renameProjectName" className={styles.label}>Nuevo nombre</label>
                  <input
                    id="renameProjectName"
                    className={styles.input}
                    value={renameProjectName}
                    onChange={(e) => setRenameProjectName(e.target.value)}
                    placeholder="Ej: Proyecto Kanban"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={closeRenameProjectModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btn}>
                  Guardar Nombre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteProjectOpen && (
        <div className={styles.overlay} aria-label="Modal eliminar proyecto" onClick={closeDeleteProjectModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Eliminar proyecto">
            <div className={styles.modalTop}>
              <strong className={styles.modalHeader}>Eliminar Proyecto</strong>
              <button
                className={styles.iconBtn}
                onClick={closeDeleteProjectModal}
                aria-label="Cerrar modal"
                title="Cerrar"
                type="button"
              >
                <X size={18} strokeWidth={2.1} />
              </button>
            </div>

            <div className={styles.dangerBox} role="alert" aria-live="polite">
              <p className={styles.dangerTitle}>Advertencia importante</p>
              <p className={styles.hint}>
                Vas a eliminar el proyecto <strong>{project.name}</strong>.
              </p>
              <p className={styles.hint}>
                Implicaciones:
              </p>
              <ul className={styles.dangerList}>
                <li>Se perderan tareas, columnas, iteraciones y configuracion de este proyecto.</li>
                <li>La eliminacion es permanente y no se puede deshacer.</li>
                <li>Si necesitas respaldo, exporta el proyecto antes de eliminarlo.</li>
              </ul>
            </div>
            {isDeleteFinalStep ? (
              <div className={styles.finalWarningBox} role="alert" aria-live="assertive">
                <p className={styles.finalWarningTitle}>Confirmacion final requerida</p>
                <p className={styles.finalWarningText}>
                  Si continuas, este proyecto se eliminara definitivamente y no podras recuperarlo.
                </p>
                <p className={`${styles.finalWarningText} ${styles.finalWarningCountdown}`}>
                  Espera {deleteCountdown}s para habilitar la eliminacion.
                </p>
              </div>
            ) : null}
            {deleteProjectError ? <p className={styles.errorText}>{deleteProjectError}</p> : null}

            <div className={styles.actions}>
              <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={closeDeleteProjectModal}>
                Cancelar
              </button>
              {isDeleteFinalStep ? (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={executeDeleteProject}
                  disabled={deleteCountdown > 0}
                >
                  {deleteCountdown > 0
                    ? `Confirmar Eliminacion (${deleteCountdown}s)`
                    : "Confirmar Eliminacion"}
                </button>
              ) : (
                <button type="button" className={styles.btn} onClick={confirmDeleteProject}>
                  Eliminar Proyecto
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isDeleteSuccessOpen && (
        <div className={styles.overlay} aria-label="Modal proyecto eliminado" onClick={closeDeleteSuccessModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Proyecto eliminado">
            <div className={styles.modalTop}>
              <strong className={styles.modalHeader}>Proyecto eliminado</strong>
            </div>
            <p className={styles.hint}>
              El proyecto <strong>{deletedProjectName}</strong> se ha eliminado.
            </p>
            <div className={styles.actions}>
              <button type="button" className={styles.btn} onClick={closeDeleteSuccessModal}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
