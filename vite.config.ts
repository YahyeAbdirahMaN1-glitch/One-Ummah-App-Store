import { defineConfig, HttpProxy } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import http from "http";

const PORT = Number(process.env.PORT) || 4500;

function proxyConfig(proxy: HttpProxy.ProxyServer) {
  proxy.on('error', function (err, _req, res) {
    if ('writeHead' in res) {
      (res as http.ServerResponse).writeHead(500, {
        'Content-Type': 'application/json'
      });

      res.end(JSON.stringify({
        json: { error: 'PROXY_ERROR', details: err.message },
      }));
    }
  });
}

export default ({ mode }: { mode: "development" | "production" }) => {
  console.log(`Started vite server in mode: ${mode}`);

  return defineConfig({
    plugins: [tsconfigPaths(), react(), tailwindcss()],
    server: {
      port: Number(PORT),
      host: '0.0.0.0',
      strictPort: false,
      proxy: {
        "/_logger": {
          target: "http://localhost:" + (Number(PORT) + 1),
          changeOrigin: true,
          secure: false,
          configure: proxyConfig,
        },
        "/api": {
          target: "http://localhost:" + (Number(PORT) + 1),
          changeOrigin: true,
          secure: false,
          configure: proxyConfig,
        },
      },
    },
    preview: {
      port: Number(PORT),
      host: '0.0.0.0',
      strictPort: false,
      proxy: {
        "/_logger": {
          target: "http://localhost:" + (Number(PORT) + 1),
          changeOrigin: true,
          secure: false,
          configure: proxyConfig,
        },
        "/api": {
          target: "http://localhost:" + (Number(PORT) + 1),
          changeOrigin: true,
          secure: false,
          configure: proxyConfig,
        },
      },
    },
  });
};
