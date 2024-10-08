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
      style.textContent = stylesText.replaceAll(":root", ":host") + `
        .editable-code {
          position: relative;
        }
        .editable-code textarea {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          resize: none;
          background: transparent;
          color: transparent;
          caret-color: white;
          font-family: monospace;
          font-size: inherit;
          line-height: inherit;
          padding: inherit;
          border: none;
          outline: none;
        }
      `;
      shadow.querySelector("head")!.append(style);

      const isLocalFile = window.location.protocol === 'file:';
      console.log(`Is local file: ${isLocalFile}`);
      if (isLocalFile) {
        highlightLocalFile(uiContainer);
      } else {
        setupDragAndDrop(uiContainer);
      }

      // Function to create editable highlighted code
      async function createEditableHighlightedCode(code: string, language: string) {
        const highlightedHtml = await codeToHtml(code, { lang: language, theme: 'github-dark-dimmed' });
        const container = document.createElement('div');
        container.className = 'editable-code';
        container.innerHTML = highlightedHtml;

        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.spellcheck = false;
        container.appendChild(textarea);

        textarea.addEventListener('input', async () => {
          const updatedHtml = await codeToHtml(textarea.value, { lang: language, theme: 'github-dark-dimmed' });
          container.querySelector('pre')!.innerHTML = updatedHtml;
        });

        return container;
      }

      // Function to set background color based on highlighted code
      function setDynamicBackground(codeElement: HTMLElement) {
        const preElement = codeElement.querySelector('pre');
        if (preElement) {
          const bgColor = window.getComputedStyle(preElement).backgroundColor;
          document.body.style.backgroundColor = bgColor;

          const styleElement = document.createElement('style');
          styleElement.textContent = `
            body {
              margin: 0;
              padding: 20px;
              min-height: 100vh;
            }
            .shiki {
              background-color: transparent !important;
            }
          `;
          document.head.appendChild(styleElement);
        }
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
        const language = getLanguageFromFileName(fileName);
        const editableCode = await createEditableHighlightedCode(content, language);

        document.body.innerHTML = '';
        document.body.appendChild(editableCode);

        setDynamicBackground(editableCode);
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
              const language = getLanguageFromFileName(file.name);
              const editableCode = await createEditableHighlightedCode(content, language);
              container.innerHTML = '';
              container.appendChild(editableCode);
              setDynamicBackground(editableCode);
            };
            reader.readAsText(file);
          }
        });

        // Initial code highlight example
        const initialCode = 'console.log("Hello world!");';
        createEditableHighlightedCode(initialCode, 'javascript').then(editableCode => {
          container.appendChild(editableCode);
          setDynamicBackground(editableCode);
        });
      }
    },
  });
  ui.mount();
};