import { useRef } from 'react';
import { v4 as uuid } from 'uuid';
import useStore from '../store/useStore';
import { MAX_ICON_SIZE } from '../constants';
import type { ProjectIcon } from '../types';

export default function IconManager() {
  const icons = useStore((s) => s.project.icons);
  const addIcon = useStore((s) => s.addIcon);
  const removeIcon = useStore((s) => s.removeIcon);
  const setShowIconManager = useStore((s) => s.setShowIconManager);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/png') && !file.type.startsWith('image/svg') && file.type !== 'image/svg+xml') {
        alert(`"${file.name}" is not a PNG or SVG file.`);
        return;
      }

      // Validate size
      if (file.size > MAX_ICON_SIZE) {
        alert(
          `"${file.name}" exceeds the 500KB limit (${Math.round(file.size / 1024)}KB).`,
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;

        // Calculate aspect ratio from loaded image
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          const label = file.name.replace(/\.[^.]+$/, '');

          const icon: ProjectIcon = {
            id: uuid(),
            label,
            src,
            aspectRatio: isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1,
          };

          addIcon(icon);
        };

        img.onerror = () => {
          // For SVG that might not load as Image, use aspect ratio 1
          const label = file.name.replace(/\.[^.]+$/, '');
          const icon: ProjectIcon = {
            id: uuid(),
            label,
            src,
            aspectRatio: 1,
          };
          addIcon(icon);
        };

        img.src = src;
      };

      reader.readAsDataURL(file);
    });

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setShowIconManager(false);
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-dialog modal-dialog--icons" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Icon Manager</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="icon-manager__upload-row">
            <label className="modal-btn modal-btn--primary icon-manager__upload-label">
              Upload Icon (PNG/SVG)
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/svg+xml"
                multiple
                className="icon-manager__upload-input"
                onChange={handleUpload}
              />
            </label>
            <span className="icon-manager__size-hint">Max 500KB per icon</span>
          </div>

          {icons.length === 0 ? (
            <div className="icon-manager__empty">
              No icons uploaded yet. Click the button above to add icons.
            </div>
          ) : (
            <div className="icon-manager__grid">
              {icons.map((icon) => (
                <div key={icon.id} className="icon-manager__item">
                  <div className="icon-manager__preview">
                    <img
                      src={icon.src}
                      alt={icon.label}
                      className="icon-manager__img"
                    />
                  </div>
                  <span className="icon-manager__label" title={icon.label}>
                    {icon.label}
                  </span>
                  <button
                    className="icon-manager__remove-btn"
                    onClick={() => removeIcon(icon.id)}
                    title="Remove icon"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn--secondary" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
