includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
  manifest: {
  name: 'Personal Grocery Companion',
    short_name: 'GroceryComp',
      description: 'Track real-time grocery spend against a budget',
        theme_color: '#009688',
          background_color: '#121212',
            display: 'standalone',
              icons: [
                {
                  src: 'pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
                {
                  src: 'pwa-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                },
              ],
      },
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
          },
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'gstatic-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
          },
          cacheableResponse: {
            statuses: [0, 200]
          },
        }
      }
    ]
},
    }),
  ],
});
