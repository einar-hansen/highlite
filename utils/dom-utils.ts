import {codeToHtml} from "shiki";

export function createEditableArea(
  code: string,
  language: string,
  viewPane: HTMLElement,
  updateViewPane: (html: string) => void,
): HTMLTextAreaElement {
  const textarea = document.createElement('textarea');
  textarea.value = code;
  textarea.spellcheck = false;
  textarea.style.width = '100%';
  textarea.style.height = '100%';
  textarea.style.resize = 'none';
  textarea.style.background = 'var(--bg-color)';
  textarea.style.color = 'var(--text-color)';
  textarea.style.fontFamily = 'monospace';
  textarea.style.fontSize = '14px';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.padding = '10px';

  textarea.addEventListener('input', async () => {
    const updatedHtml = await codeToHtml(textarea.value, { lang: language, theme: 'github-dark-dimmed' });
    updateViewPane(updatedHtml);
  });

  return textarea;
}

export function setDynamicBackground(
  codeElement: HTMLElement,
  editPane: HTMLElement,
): void {
  const preElement = codeElement.querySelector('pre');
  if (preElement) {
    const bgColor = window.getComputedStyle(preElement).backgroundColor;
    document.body.style.backgroundColor = bgColor;
    editPane.style.backgroundColor = bgColor;
  }
}
