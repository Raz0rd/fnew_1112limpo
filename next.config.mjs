/** @type {import('next').NextConfig} */
const nextConfig = {
  // SSR + APIs habilitados, não usamos export
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // evita erro com o otimizador de imagens do Next
  },

  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    }

    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          default: false,
          vendors: false,
          ui: {
            name: 'ui',
            chunks: 'all',
            test: /[\\/]components[\\/]/,
            priority: 20,
          },
          hooks: {
            name: 'hooks',
            chunks: 'all',
            test: /[\\/]hooks[\\/]/,
            priority: 10,
          },
        },
      },
    }

    return config
  },

  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-switch',
      '@radix-ui/react-dialog'
    ],
    instrumentationHook: true,
  },

  // Cabeçalhos de segurança (fallback - principal está no middleware)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ]
  },
}

export default nextConfig
