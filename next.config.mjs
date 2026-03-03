/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker/コンテナデプロイ向けの standalone 出力
  // Vercel へのデプロイでも問題なく動作する
  output: 'standalone',

  // 画像最適化の設定（Unsplash 等の外部ドメインを許可）
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // クリックジャッキング防止
          { key: 'X-Frame-Options', value: 'DENY' },
          // MIME タイプスニッフィング防止
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // リファラー情報の制限
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // 権限ポリシー（不要なブラウザ API へのアクセスを制限）
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          // HSTS（HTTPS 強制）
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // CSP（コンテンツセキュリティポリシー）
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "connect-src 'self' https://api.open-meteo.com https://marine-api.open-meteo.com https://vitals.vercel-insights.com",
              "img-src 'self' data: blob: https://images.unsplash.com",
              "font-src 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
