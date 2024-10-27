// wxt.config.ts
import { defineConfig } from "wxt";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  runner: {
    startUrls: ["https://wxt.dev"],
  },
  manifest: {
    permissions: [
      "clipboardWrite",
      "activeTab",
      "scripting",
      "file:///*",
      "<all_urls>",
    ],
  },
  vite: (config) => ({
    // Merge existing Vite config with your custom plugins
    ...config,
    plugins: [
      tsconfigPaths(), // Add the tsconfig paths plugin here
    ],
  }),
});
