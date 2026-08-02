const fs = require("node:fs");
const path = require("node:path");

const indexPath = path.join(process.cwd(), "dist", "index.html");
let html = fs.readFileSync(indexPath, "utf8");

html = html.replace(
  /content="width=device-width, initial-scale=1, shrink-to-fit=no"/,
  'content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"'
);

html = html.replace(
  "</head>",
  `  <meta name="color-scheme" content="light" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="description" content="Translate menus, see every dish and order with confidence using Tavue." />
    <meta name="apple-mobile-web-app-title" content="Tavue" />
    <meta property="og:title" content="Tavue — Visual Menu" />
    <meta property="og:description" content="Translate menus, see every dish and order with confidence." />
    <meta property="og:type" content="website" />
    <style id="tavue-web-shell">
      html, body, #root {
        min-height: 100%;
        min-height: 100dvh;
        background-color: #F7F3EE;
      }
      html, body {
        margin: 0;
        overscroll-behavior-y: none;
      }
      body {
        -webkit-text-size-adjust: 100%;
      }
    </style>
  </head>`
);

html = html.replace(/(href|src)="\//g, '$1="./');
fs.writeFileSync(indexPath, html);
