import { codeToHtml } from "shiki";

export function getLanguageFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    html: 'html',
    css: 'css',
    php: 'php',
    // Add more mappings as needed
  };
  return languageMap[extension || ''] || 'text';
}

export async function createHighlightedCode(code: string, language: string): Promise<HTMLElement> {
  const highlightedHtml = await codeToHtml(code, { lang: language, theme: 'github-dark-dimmed' });
  const codeElement = document.createElement('div');
  codeElement.innerHTML = highlightedHtml;
  return codeElement;
}
