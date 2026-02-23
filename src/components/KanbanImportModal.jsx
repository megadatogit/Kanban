import React from "react";
import { X } from "lucide-react";

export default function KanbanImportModal({
  isOpen,
  styles,
  closeImportMode,
  pendingImportName,
  pendingImportRelatedProjectId,
  pendingImportRelationType,
  pendingImportRelatedProjectName,
  pendingImportNameStrategy,
  setPendingImportNameStrategy,
  setPendingImportError,
  pendingImportManualName,
  setPendingImportManualName,
  pendingImportError,
  getUniqueProjectName,
  project,
  pendingImportRaw,
  projectsIndex,
  handleImportAsReplace,
  handleImportAsNew,
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} aria-label="Modal de importacion" onClick={closeImportMode}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Modo importacion">
        <div className={styles.modalTop}>
          <strong className={styles.modalHeader}>Importar Proyecto</strong>
          <button
            className={styles.iconBtn}
            onClick={closeImportMode}
            aria-label="Cerrar modal"
            title="Cerrar"
            type="button"
          >
            <X size={18} strokeWidth={2.1} />
          </button>
        </div>

        <p className={styles.hint}>
          Archivo: <strong>{pendingImportName || "sin nombre"}</strong>
        </p>
        <p className={styles.hint}>
          Elige como aplicar los datos importados.
        </p>
        {pendingImportRelatedProjectId ? (
          <div className={styles.importConflictBox} role="alert" aria-live="polite">
            <p className={styles.importConflictTitle}>Conflicto detectado</p>
            <p className={styles.hint}>
              {pendingImportRelationType === "origin"
                ? "Se detecto coincidencia por historial de origen."
                : "Se detecto coincidencia probable por nombre."}
            </p>
            <p className={styles.hint}>
              Proyecto local relacionado: <strong>{pendingImportRelatedProjectName}</strong>
            </p>
          </div>
        ) : (
          <p className={styles.hint}>
            No se detecto relacion directa con proyectos locales.
          </p>
        )}

        <div className={styles.importOptions}>
          <p className={styles.importOptionsTitle}>Resolucion de nombre</p>
          <label className={styles.importOption}>
            <input
              type="radio"
              name="importNameStrategy"
              value="keep_local"
              checked={pendingImportNameStrategy === "keep_local"}
              onChange={(e) => {
                setPendingImportNameStrategy(e.target.value);
                setPendingImportError("");
              }}
            />
            <span>Conservar nombre local</span>
          </label>
          <p className={styles.importOptionText}>
            Mantiene la identidad del proyecto en esta maquina mientras actualiza el contenido.
          </p>
          <label className={styles.importOption}>
            <input
              type="radio"
              name="importNameStrategy"
              value="use_imported"
              checked={pendingImportNameStrategy === "use_imported"}
              onChange={(e) => {
                setPendingImportNameStrategy(e.target.value);
                setPendingImportError("");
              }}
            />
            <span>Usar nombre importado</span>
          </label>
          <p className={styles.importOptionText}>
            Adopta el nombre del archivo importado y ajusta sufijo si ya existe otro igual.
          </p>
          <label className={styles.importOption}>
            <input
              type="radio"
              name="importNameStrategy"
              value="manual"
              checked={pendingImportNameStrategy === "manual"}
              onChange={(e) => {
                setPendingImportNameStrategy(e.target.value);
                setPendingImportError("");
              }}
            />
            <span>Definir nombre manual</span>
          </label>
          <p className={styles.importOptionText}>
            Te permite decidir el nombre final antes de aplicar reemplazo o crear nuevo.
          </p>
          {pendingImportNameStrategy === "manual" ? (
            <input
              type="text"
              className={styles.input}
              value={pendingImportManualName}
              onChange={(e) => {
                setPendingImportManualName(e.target.value);
                if (pendingImportError) setPendingImportError("");
              }}
              placeholder="Nombre final del proyecto"
            />
          ) : null}
        </div>
        {pendingImportError ? <p className={styles.errorText}>{pendingImportError}</p> : null}

        <div className={styles.importPreview}>
          <p className={styles.hint}>
            Accion de reemplazo:{" "}
            <strong>{pendingImportRelatedProjectId ? "proyecto relacionado" : "proyecto actual"}</strong>
          </p>
          <p className={styles.hint}>
            Nombre final estimado:{" "}
            <strong>
              {pendingImportNameStrategy === "manual" && !pendingImportManualName.trim()
                ? "Pendiente de definir"
                : getUniqueProjectName(
                    pendingImportNameStrategy === "keep_local"
                      ? (pendingImportRelatedProjectName || project.name || "Proyecto")
                      : pendingImportNameStrategy === "manual"
                        ? pendingImportManualName.trim()
                        : ((pendingImportRaw?.project ?? pendingImportRaw)?.name || "Proyecto Importado"),
                    projectsIndex,
                    pendingImportRelatedProjectId || project.id
                  )}
            </strong>
          </p>
        </div>

        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={closeImportMode}>
            Cancelar
          </button>
          <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={handleImportAsReplace}>
            {pendingImportRelatedProjectId ? "Reemplazar Relacionado" : "Reemplazar Actual"}
          </button>
          <button type="button" className={styles.btn} onClick={handleImportAsNew}>
            Crear Nuevo
          </button>
        </div>
      </div>
    </div>
  );
}
