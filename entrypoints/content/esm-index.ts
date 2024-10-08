import { ContentScriptContext } from "wxt/client";
import "./styles.css";
import { createHighlighter } from "shiki";

export default async (ctx: ContentScriptContext) => {
  const { createShadowRootUi } = await import("wxt/client");
  const stylesText = await fetch(
    browser.runtime.getURL("/content-scripts/esm/style.css"),
  ).then((res) => res.text());

  const highlighter = await createHighlighter({
    themes: ['vitesse-dark'],
    langs: ['javascript', 'typescript', 'python', 'html', 'php'],
  });

  const ui = await createShadowRootUi(ctx, {
    name: "esm-ui-example",
    position: "inline",
    append: "first",
    onMount(uiContainer, shadow) {
      const style = document.createElement("style");
      style.textContent = stylesText.replaceAll(":root", ":host");
      shadow.querySelector("head")!.append(style);

      // Create a drop zone
      const dropZone = document.createElement("div");
      dropZone.id = "drop-zone";
      dropZone.textContent = "Drag and drop files here";
      dropZone.style.border = "2px dashed #ccc";
      dropZone.style.padding = "20px";
      dropZone.style.marginTop = "20px";
      uiContainer.appendChild(dropZone);

      // Add event listeners for drag and drop
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.style.background = "#f0f0f0";
      });

      dropZone.addEventListener("dragleave", () => {
        dropZone.style.background = "none";
      });

      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.style.background = "none";
        const file = e.dataTransfer?.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            highlightCode(content, file.name);
          };
          reader.readAsText(file);
        }
      });

      // Function to highlight code
      async function highlightCode(code: string, fileName: string) {
        const language = getLanguageFromFileName(fileName);
        console.log(`Highlighting code in ${language} file: ${fileName}`);
        const html = await highlighter.codeToHtml(code, {
          lang: language,
          theme: 'vitesse-dark',
        });
        const codeElement = document.createElement("div");
        codeElement.innerHTML = html;
        uiContainer.appendChild(codeElement);
      }

      // Function to guess language from file extension
      function getLanguageFromFileName(fileName: string): string {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const languageMap: { [key: string]: string } = {
          'js': 'javascript',
          'ts': 'typescript',
          'py': 'python',
          'html': 'html',
          'css': 'css',
          'php': 'php',
        };
        return languageMap[extension || ''] || 'text';
      }

      // Initial code highlight example
      const initialCode = 'console.log("Hello world!");';
      highlightCode(initialCode, 'example.js');
    },
  });
  ui.mount();
};