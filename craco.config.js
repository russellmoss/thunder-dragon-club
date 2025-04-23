const { DefinePlugin } = require('webpack');
const { GenerateSW } = require('workbox-webpack-plugin');

module.exports = {
  webpack: {
    plugins: {
      add: [
        new DefinePlugin({
          'process.env.FIREBASE_API_KEY': JSON.stringify(process.env.FIREBASE_API_KEY),
          'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.FIREBASE_AUTH_DOMAIN),
          'process.env.FIREBASE_PROJECT_ID': JSON.stringify(process.env.FIREBASE_PROJECT_ID),
          'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.FIREBASE_STORAGE_BUCKET),
          'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.FIREBASE_MESSAGING_SENDER_ID),
          'process.env.FIREBASE_APP_ID': JSON.stringify(process.env.FIREBASE_APP_ID),
        }),
        new GenerateSW({
          // Don't precache images
          exclude: [/\.(?:png|jpg|jpeg|svg)$/],
          
          // Define runtime caching rules
          runtimeCaching: [
            {
              // Match any request that ends with .png, .jpg, .jpeg or .svg
              urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
              },
            },
            {
              // Match any fonts
              urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'fonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
              },
            },
            {
              // HTML pages (offline fallback)
              urlPattern: /\.html$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24, // 24 hours
                },
                networkTimeoutSeconds: 3,
              },
            },
            {
              // API calls
              urlPattern: /\/api\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60, // 1 hour
                },
                networkTimeoutSeconds: 3,
              },
            }
          ],
          
          // Other configuration
          skipWaiting: true,
          clientsClaim: true,
          
          // Define custom service worker
          swDest: 'service-worker.js',
          
          // Increase chunk size warning limit
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB

          // Enable offline Google Analytics
          offlineGoogleAnalytics: true,

          // Add manifest generation
          manifestTransforms: [
            (manifest) => {
              manifest.push({
                url: '/offline.html',
                revision: new Date().getTime().toString()
              });
              return { manifest, warnings: [] };
            }
          ]
        }),
      ],
    },
  },
}; 