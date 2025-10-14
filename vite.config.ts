import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // FIX: The `__dirname` variable is not available in ES modules. The use of `process.cwd()`
          // caused a TypeScript error because the 'process' type from Vite's client-side
          // environment doesn't include 'cwd'. This has been replaced with a reliable polyfill
          // for `__dirname` using `import.meta.url`, which works correctly in an ES module context.
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
