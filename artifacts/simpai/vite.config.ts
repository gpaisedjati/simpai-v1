import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT || "3000";
const port = Number(rawPort);
const basePath = process.env.BASE_PATH || "/";
const isReplit = process.env.REPL_ID !== undefined;
const isProduction = process.env.NODE_ENV === "production";

export default defineConfig(async () => {
  const replitPlugins: any[] = [];

  if (!isProduction && isReplit) {
    const { default: runtimeErrorOverlay } = await import(
      "@replit/vite-plugin-runtime-error-modal"
    );
    replitPlugins.push(runtimeErrorOverlay());

    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    replitPlugins.push(cartographer());

    const { devBanner } = await import("@replit/vite-plugin-dev-banner");
    replitPlugins.push(devBanner());
  }

  return {
    base: basePath,
    plugins: [react(), tailwindcss(), ...replitPlugins],
    resolve: {
      alias: {
        "@": path.resolve("src"),
        "@assets": path.resolve("../../attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    build: {
      outDir: "dist/public",
      emptyOutDir: true,
      sourcemap: false,
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: { strict: false },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
