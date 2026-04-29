/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['ws', '@neondatabase/serverless', '@prisma/adapter-neon', '@prisma/client'],
};

export default nextConfig;
