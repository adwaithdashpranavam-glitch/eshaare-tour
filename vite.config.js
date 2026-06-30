import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

const prerenderPlugin = () => {
  return {
    name: 'prerender-plugin',
    closeBundle() {
      if (process.env.NODE_ENV === 'production') {
        console.log('Running prerender script...');
        try {
          execSync('node prerender.mjs', { stdio: 'inherit' });
          console.log('Prerender script executed successfully.');
        } catch (error) {
          console.error('Prerender script failed:', error);
          // Don't throw to prevent build failure if prerender fails, or throw if required
          // We'll throw so Vercel build fails if prerendering fails
          throw error;
        }
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), prerenderPlugin()],
  build: {
    target: 'chrome71'
  }
})
