import { ContentScriptContext } from "wxt/client";
import "./styles.css";
import { createShadowRootUi } from "wxt/client";
import { setupDragAndDrop, highlightLocalFile } from "@components/ui-components";

export default async (ctx: ContentScriptContext) => {
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

      // Create container elements
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

      function updateViewPane(html: string) {
        viewPane.innerHTML = html;
      }

      const isLocalFile = window.location.protocol === 'file:';
      console.log(`Is local file: ${isLocalFile}`);
      if (isLocalFile) {
        highlightLocalFile(viewPane, editPane, updateViewPane);
      } else {
        setupDragAndDrop(viewPane, editPane, updateViewPane);
      }
    },
  });
  ui.mount();
};
