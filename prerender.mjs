import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { preview } from 'vite';
import fs from 'fs';
import path from 'path';

const getBrowserPath = () => {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
};

(async () => {
  console.log('Starting Vite preview server for prerendering...');
  const server = await preview({ preview: { port: 4173 } });
  
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    executablePath: process.env.VERCEL ? await chromium.executablePath() : getBrowserPath(),
    headless: process.env.VERCEL ? chromium.headless : true,
    args: process.env.VERCEL ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const routes = ['/', '/about', '/services', '/contact'];
  
  for (const route of routes) {
    try {
      console.log(`Crawling ${route}...`);
      const page = await browser.newPage();
      await page.setUserAgent(await browser.userAgent() + ' ReactSnap');
      await page.goto(`http://localhost:4173${route}`, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 500));
      let content = await page.content();
      
      const filePath = route === '/' ? 'dist/index.html' : `dist${route}/index.html`;
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, content);
      console.log(`✅ Prerendered ${route} -> ${filePath}`);
    } catch (err) {
      console.error(`❌ Failed to prerender ${route}:`, err);
    }
  }
  
  await browser.close();
  server.httpServer.close();
  console.log('Prerendering complete.');
  process.exit(0);
})();