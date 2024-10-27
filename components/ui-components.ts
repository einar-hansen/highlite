import { createHighlightedCode,  getLanguageFromFileName} from '@utils/code-utils';
import {createEditableArea,  setDynamicBackground } from '@utils/dom-utils';

export function setupDragAndDrop(
  viewPane: HTMLElement,
  editPane: HTMLElement,
  updateViewPane: (html: string) => void,
): void {
  const dropZone = document.createElement('div');
  dropZone.id = 'drop-zone';
  dropZone.textContent = 'Drag and drop files here';
  dropZone.style.border = '2px dashed #ccc';
  dropZone.style.padding = '20px';
  dropZone.style.marginTop = '20px';
  viewPane.appendChild(dropZone);

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.background = '#f0f0f0';
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.style.background = 'none';
  });

  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.style.background = 'none';
    const file = e.dataTransfer?.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        const language = getLanguageFromFileName(file.name);
        const highlightedCode = await createHighlightedCode(content, language);
        const editableArea = createEditableArea(content, language, viewPane, updateViewPane);

        viewPane.innerHTML = '';
        viewPane.appendChild(highlightedCode);
        editPane.innerHTML = '';
        editPane.appendChild(editableArea);

        setDynamicBackground(highlightedCode, editPane);
      };
      reader.readAsText(file);
    }
  });

  // Initial code highlight example
  const initialCode = 'console.log("Hello world!");';
  createHighlightedCode(initialCode, 'javascript').then((highlightedCode) => {
    viewPane.innerHTML = '';
    viewPane.appendChild(highlightedCode);
    const editableArea = createEditableArea(initialCode, 'javascript', viewPane, updateViewPane);
    editPane.innerHTML = '';
    editPane.appendChild(editableArea);
    setDynamicBackground(highlightedCode, editPane);
  });
}

export async function highlightLocalFile(
  viewPane: HTMLElement,
  editPane: HTMLElement,
  updateViewPane: (html: string) => void,
): Promise<void> {
  const content = document.body.innerText || document.body.textContent || '';
  const fileName = window.location.pathname.split('/').pop() || 'unknown.txt';
  const language = getLanguageFromFileName(fileName);
  const highlightedCode = await createHighlightedCode(content, language);
  const editableArea = createEditableArea(content, language, viewPane, updateViewPane);

  viewPane.innerHTML = '';
  viewPane.appendChild(highlightedCode);
  editPane.innerHTML = '';
  editPane.appendChild(editableArea);

  setDynamicBackground(highlightedCode, editPane);
  document.body.style.display = 'block';
}
