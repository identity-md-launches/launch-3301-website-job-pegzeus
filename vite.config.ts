import { defineConfig } from "vite";

// base "./" keeps every asset URL relative, so dist/ works from an IPFS
// gateway subpath, an ENS name or any static host without rewrites.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
