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
        height: var(--tavue-viewport-height, 100dvh) !important;
        min-height: 0 !important;
        max-height: var(--tavue-viewport-height, 100dvh);
        width: 100%;
        background-color: #F7F3EE;
      }
      html, body {
        margin: 0;
        overscroll-behavior-y: none;
      }
      body {
        -webkit-text-size-adjust: 100%;
      }
      #tavue-app-shell {
        height: var(--tavue-viewport-height, 100dvh);
        max-height: var(--tavue-viewport-height, 100dvh);
      }
      body > div:not(#root) [role="dialog"] {
        top: 0 !important;
        bottom: auto !important;
        height: var(--tavue-viewport-height, 100dvh) !important;
        max-height: var(--tavue-viewport-height, 100dvh);
      }
      @media (hover: none) and (pointer: coarse) {
        #tavue-app-shell {
          width: 100vw !important;
          max-width: none !important;
        }
      }
    </style>
    <script id="tavue-visual-viewport">
      (() => {
        const root = document.documentElement;
        let frame = 0;

        const applyViewport = () => {
          frame = 0;
          const viewport = window.visualViewport;
          const height = viewport?.height || window.innerHeight;
          if (height > 0) {
            root.style.setProperty("--tavue-viewport-height", Math.round(height) + "px");
          }
        };

        const scheduleViewport = () => {
          if (frame) return;
          frame = window.requestAnimationFrame(applyViewport);
        };

        applyViewport();
        window.addEventListener("resize", scheduleViewport, { passive: true });
        window.addEventListener("orientationchange", scheduleViewport, { passive: true });
        window.addEventListener("pageshow", scheduleViewport, { passive: true });
        window.visualViewport?.addEventListener("resize", scheduleViewport, { passive: true });
        window.visualViewport?.addEventListener("scroll", scheduleViewport, { passive: true });
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) scheduleViewport();
        });
      })();
    </script>
  </head>`
);

fs.writeFileSync(indexPath, html);
