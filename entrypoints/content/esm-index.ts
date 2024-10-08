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
        .container {
          display: flex;
          height: 100vh;
          width: 100vw;
        }
        .view-pane, .edit-pane {
          flex: 1;
          overflow: auto;
        }
        .edit-pane {
          display: none;
        }
        .edit-pane textarea {
          width: 100%;
          height: 100%;
          resize: none;
          background: #1e1e1e;
          color: #d4d4d4;
          font-family: monospace;
          font-size: 14px;
          border: none;
          outline: none;
          padding: 10px;
        }
        .controls {
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 1000;
        }
        button {
          margin-left: 5px;
        }
      `;
      shadow.querySelector("head")!.append(style);

      const container = document.createElement('div');
      container.className = 'container';
      const viewPane = document.createElement('div');
      viewPane.className = 'view-pane';
      const editPane = document.createElement('div');
      editPane.className = 'edit-pane';
      container.appendChild(viewPane);
      container.appendChild(editPane);
      uiContainer.appendChild(container);

      const controls = document.createElement('div');
      controls.className = 'controls';
      const editButton = document.createElement('button');
      editButton.textContent = 'Edit Code';
      const splitButton = document.createElement('button');
      splitButton.textContent = 'Toggle Split';
      controls.appendChild(editButton);
      controls.appendChild(splitButton);
      uiContainer.appendChild(controls);

      let isEditing = false;
      let isVerticalSplit = true;

      editButton.addEventListener('click', () => {
        isEditing = !isEditing;
        editPane.style.display = isEditing ? 'block' : 'none';
        editButton.textContent = isEditing ? 'View Code' : 'Edit Code';
        updateSplitLayout();
      });

      splitButton.addEventListener('click', () => {
        isVerticalSplit = !isVerticalSplit;
        updateSplitLayout();
      });

      function updateSplitLayout() {
        if (isEditing) {
          container.style.flexDirection = isVerticalSplit ? 'row' : 'column';
        } else {
          container.style.flexDirection = 'row';
          viewPane.style.flex = '1';
          editPane.style.flex = '0';
        }
      }

      const isLocalFile = window.location.protocol === 'file:';
      console.log(`Is local file: ${isLocalFile}`);
      if (isLocalFile) {
        highlightLocalFile(viewPane, editPane);
      } else {
        setupDragAndDrop(viewPane, editPane);
      }

      async function createHighlightedCode(code: string, language: string) {
        const highlightedHtml = await codeToHtml(code, { lang: language, theme: 'github-dark-dimmed' });
        const codeElement = document.createElement('div');
        codeElement.innerHTML = highlightedHtml;
        return codeElement;
      }

      function createEditableArea(code: string, language: string, viewPane: HTMLElement) {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.spellcheck = false;

        textarea.addEventListener('input', async () => {
          const updatedHtml = await codeToHtml(textarea.value, { lang: language, theme: 'github-dark-dimmed' });
          viewPane.innerHTML = updatedHtml;
        });

        return textarea;
      }

      function setDynamicBackground(codeElement: HTMLElement) {
        const preElement = codeElement.querySelector('pre');
        if (preElement) {
          const bgColor = window.getComputedStyle(preElement).backgroundColor;
          document.body.style.backgroundColor = bgColor;
          editPane.style.backgroundColor = bgColor;
        }
      }

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

      async function highlightLocalFile(viewPane: HTMLElement, editPane: HTMLElement) {
        const content = document.body.innerText || document.body.textContent || '';
        const fileName = window.location.pathname.split('/').pop() || 'unknown.txt';
        const language = getLanguageFromFileName(fileName);
        const highlightedCode = await createHighlightedCode(content, language);
        const editableArea = createEditableArea(content, language, viewPane);

        viewPane.innerHTML = '';
        viewPane.appendChild(highlightedCode);
        editPane.innerHTML = '';
        editPane.appendChild(editableArea);

        setDynamicBackground(highlightedCode);
        document.body.style.display = 'block';
      }

      function setupDragAndDrop(viewPane: HTMLElement, editPane: HTMLElement) {
        const dropZone = document.createElement("div");
        dropZone.id = "drop-zone";
        dropZone.textContent = "Drag and drop files here";
        dropZone.style.border = "2px dashed #ccc";
        dropZone.style.padding = "20px";
        dropZone.style.marginTop = "20px";
        viewPane.appendChild(dropZone);

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
              const highlightedCode = await createHighlightedCode(content, language);
              const editableArea = createEditableArea(content, language, viewPane);

              viewPane.innerHTML = '';
              viewPane.appendChild(highlightedCode);
              editPane.innerHTML = '';
              editPane.appendChild(editableArea);

              setDynamicBackground(highlightedCode);
            };
            reader.readAsText(file);
          }
        });

        // Initial code highlight example
        const initialCode = 'console.log("Hello world!");';
        createHighlightedCode(initialCode, 'javascript').then(highlightedCode => {
          viewPane.innerHTML = '';
          viewPane.appendChild(highlightedCode);
          const editableArea = createEditableArea(initialCode, 'javascript', viewPane);
          editPane.innerHTML = '';
          editPane.appendChild(editableArea);
          setDynamicBackground(highlightedCode);
        });
      }
    },
  });
  ui.mount();
};