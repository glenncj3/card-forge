import type { Project } from '../types';

const PREFIX = 'cardforge_';

export function saveProject(key: string, project: Project): void {
  const json = JSON.stringify(project);
  localStorage.setItem(`${PREFIX}${key}`, json);
}

export function loadProject(key: string): Project | null {
  const json = localStorage.getItem(`${PREFIX}${key}`);
  if (!json) return null;

  try {
    return JSON.parse(json) as Project;
  } catch {
    return null;
  }
}

export function listProjects(): { id: string; name: string }[] {
  const projects: { id: string; name: string }[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (!storageKey || !storageKey.startsWith(PREFIX)) continue;

    const id = storageKey.slice(PREFIX.length);
    try {
      const json = localStorage.getItem(storageKey);
      if (!json) continue;
      const project = JSON.parse(json) as Project;
      projects.push({ id, name: project.name });
    } catch {
      // Skip corrupted entries
    }
  }

  return projects;
}

export function deleteProject(key: string): void {
  localStorage.removeItem(`${PREFIX}${key}`);
}

export function exportProject(project: Project): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${project.name || 'project'}.cardforge.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function importProject(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = reader.result as string;
        const project = JSON.parse(text) as Project;
        resolve(project);
      } catch {
        reject(new Error('Invalid .cardforge.json file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
