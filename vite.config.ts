import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': 'upgrade-insecure-requests'
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'data.json'],
      manifest: {
        name: 'DMT Code Visual Symbol Catalogue',
        short_name: 'DMT Code',
        description: 'Open catalogue of visual symbols from 650 nm laser exposure and N,N-DMT experiences',
        theme_color: '#ff0000',
        background_color: '#000000',
        display: 'standalone',
        scope: '/',
        start_url: '/?source=pwa',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB limit
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5
              }
            }
          },
          {
            urlPattern: /\/data\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'data-json-cache',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60
              }
            }
          },
          {
            urlPattern: /\/registry/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'registry-cache',
              networkTimeoutSeconds: 5,
              plugins: [
                {
                  handlerDidError: async () => {
                    return new Response(
                      JSON.stringify({ offline: true, message: 'Offline - saved symbols will sync when online' }),
                      { headers: { 'Content-Type': 'application/json' } }
                    );
                  }
                }
              ]
            }
          },
          {
            urlPattern: /\/api\/symbols/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-symbols-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 30
              }
            }
          },
          {
            urlPattern: /\/analysis/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'analysis-cache',
              networkTimeoutSeconds: 10
            }
          }
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/data\.json$/]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
