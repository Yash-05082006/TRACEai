import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  preset: "node-server",
  publicAssets: [
    {
      dir: "./dist/client",
      maxAge: 31536000,
    },
  ],
  handlers: [
    {
      handler: "./dist/server/server.js",
      route: "/**",
    },
  ],
});
