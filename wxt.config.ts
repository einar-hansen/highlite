import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  runner: {
    startUrls: ["https://wxt.dev"],
  },
  manifest: {
    permissions: [
        'clipboardWrite', 'activeTab', 'scripting',
      "file:///*",
      "<all_urls>"
    ],
  },
  // content: {
  //   matches: [
  //     "file:///*",
  //     "http://*/*",
  //     "https://*/*"
  //   ],
  // },
});
