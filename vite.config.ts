import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false, // Désactiver les source maps en production pour éviter les erreurs
  },
  optimizeDeps: {
    force: true, // Forcer la réoptimisation
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'next-themes',
      'lucide-react',
    ],
    esbuildOptions: {
      // Ignorer les source maps corrompus
      legalComments: 'none',
      sourcemap: false,
    },
  },
  esbuild: {
    // Ignorer les erreurs de source map
    legalComments: 'none',
    sourcemap: false,
  },
}));
