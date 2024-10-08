import { ContentScriptContext } from "wxt/client";
import "./styles.css";
import { codeToHtml, createHighlighter, Highlighter, Lang } from "shiki";

// Configuration
const config = {
  theme: 'vitesse-dark' as const,
  languages: ['javascript', 'typescript', 'python', 'html', 'php'] as Lang[],
  initialCode: 'console.log("Hello world!");',
  initialFileName: 'example.js',
};

// Language map
const languageMap: Record<string, Lang> = {
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'html': 'html',
  'css': 'css',
  'php': 'php',
  // Add more mappings as needed
};

export default async (ctx: ContentScriptContext) => {
  const { createShadowRootUi } = await import("wxt/client");
  const stylesText = await fetch(
    browser.runtime.getURL("/content-scripts/esm/style.css"),
  ).then((res) => res.text());

  const highlighter = await createHighlighter({
    themes: [config.theme],
    langs: config.languages,
  });

  const ui = await createShadowRootUi(ctx, {
    name: "esm-ui-example",
    position: "inline",
    append: "first",
    onMount(uiContainer, shadow) {
      setupStyles(shadow, stylesText);
      const dropZone = createDropZone();
      uiContainer.appendChild(dropZone);
      setupDropListeners(dropZone, (content, fileName) => highlightCode(highlighter, uiContainer, content, fileName));
      highlightCode(highlighter, uiContainer, config.initialCode, config.initialFileName);
    },
  });
  ui.mount();
};

function setupStyles(shadow: ShadowRoot, stylesText: string) {
  const style = document.createElement("style");
  style.textContent = stylesText.replaceAll(":root", ":host");
  shadow.querySelector("head")!.append(style);
}

function createDropZone(): HTMLDivElement {
  const dropZone = document.createElement("div");
  dropZone.id = "drop-zone";
  dropZone.textContent = "Drag and drop files here";
  dropZone.className = "drop-zone";
  return dropZone;
}

function setupDropListeners(dropZone: HTMLDivElement, onDrop: (content: string, fileName: string) => void) {
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const file = e.dataTransfer?.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onDrop(content, file.name);
      };
      reader.readAsText(file);
    }
  });
}

async function highlightCode(highlighter: Highlighter, container: HTMLElement, code: string, fileName: string) {
  try {
    const language = getLanguageFromFileName(fileName);
    const html = await highlighter.codeToHtml(code, {
      lang: language,
      theme: config.theme,
    });
    const codeElement = document.createElement("div");
    codeElement.className = "highlighted-code";
    codeElement.innerHTML = html;
    container.appendChild(codeElement);
  } catch (error) {
    console.error("Error highlighting code:", error);
    // Provide user feedback here
  }
}

function getLanguageFromFileName(fileName: string): Lang {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return languageMap[extension || ''] || 'text';
}