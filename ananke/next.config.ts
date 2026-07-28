import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // ANANKE lives in a subdirectory of a repo that has its own root-level
    // lockfile, so Next would otherwise infer the parent as the workspace root
    // and try to compile files outside this app. Pin the root to this folder.
    root: import.meta.dirname,
  },
};

export default nextConfig;
