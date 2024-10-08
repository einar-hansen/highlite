import { ContentScriptContext } from "wxt/client";
import "./styles.css";
import { codeToHtml } from "shiki";

export default async (ctx: ContentScriptContext) => {
  const { createShadowRootUi } = await import("wxt/client");
  const stylesText = await fetch(
    browser.runtime.getURL("/content-scripts/esm/style.css"),
  ).then((res) => res.text());

  const ui = await createShadowRootUi(ctx, {
    name: "esm-ui-example",
    position: "inline",
    append: "first",
    onMount(uiContainer, shadow) {
      const style = document.createElement("style");
      style.textContent = stylesText.replaceAll(":root", ":host");
      shadow.querySelector("head")!.append(style);

      const isLocalFile = window.location.protocol === 'file:';
      console.log(`Is local file: ${isLocalFile}`);
      if (isLocalFile) {
        highlightLocalFile(uiContainer);
      } else {
        setupDragAndDrop(uiContainer);
      }

      // Function to highlight code
      async function highlightCode(code: string, fileName: string) {
        const language = getLanguageFromFileName(fileName);
        console.log(`Highlighting code in ${language} file: ${fileName}`);
        const html = await codeToHtml(code, {
          lang: language,
          theme: 'github-dark',
        });
        const codeElement = document.createElement("div");
        codeElement.innerHTML = html;
        return codeElement;
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

      // Function to highlight local file
      async function highlightLocalFile(container: HTMLElement) {
        const content = document.body.innerText || document.body.textContent || '';
        const fileName = window.location.pathname.split('/').pop() || 'unknown.txt';
        const highlightedCode = await highlightCode(content, fileName);

        // Clear the original content and append the highlighted code
        document.body.innerHTML = '';
        document.body.appendChild(highlightedCode);

        // Ensure the highlighted code is visible
        document.body.style.display = 'block';
      }

      // Function to setup drag and drop
      function setupDragAndDrop(container: HTMLElement) {
        const dropZone = document.createElement("div");
        dropZone.id = "drop-zone";
        dropZone.textContent = "Drag and drop files here";
        dropZone.style.border = "2px dashed #ccc";
        dropZone.style.padding = "20px";
        dropZone.style.marginTop = "20px";
        container.appendChild(dropZone);

        dropZone.addEventListener("dragover", (e) => {
          e.preventDefault();
          dropZone.style.background = "#f0f0f0";
        });

        dropZone.addEventListener("dragleave", () => {
          dropZone.style.background = "none";
        });

        dropZone.addEventListener("drop", async (e) => {
          e.preventDefault();
          dropZone.style.background = "none";
          const file = e.dataTransfer?.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
              const content = event.target?.result as string;
              const highlightedCode = await highlightCode(content, file.name);
              container.appendChild(highlightedCode);
            };
            reader.readAsText(file);
          }
        });

        // Initial code highlight example
        const initialCode = 'console.log("Hello world!");';
        highlightCode(initialCode, 'example.js').then(highlightedCode => {
          container.appendChild(highlightedCode);
        });
      }
    },
  });
  ui.mount();
};