import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Next.js 16 uses Turbopack by default.
   * The Stellar SDK ships browser-compatible bundles with its own crypto shims
   * (TweetNaCl). Turbopack handles these automatically without webpack config.
   *
   * Empty turbopack config satisfies the check; no custom rules needed.
   */
  turbopack: {},
};

export default nextConfig;
