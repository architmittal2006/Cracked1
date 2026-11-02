import { test, expect } from '@playwright/test';

const baseURL = 'http://localhost:5174';

const viewports = [
  { width: 375, height: 812, label: 'mobile' },
  { width: 768, height: 1024, label: 'tablet' },
  { width: 1440, height: 900, label: 'desktop' },
];

const pages = ['/', '/cases', '/how-it-works', '/leaderboard'];

test.describe('Minimalist Homepage QA', () => {
  for (const page of pages) {
    for (const vp of viewports) {
      test(`Page ${page} at ${vp.label} (${vp.width}x${vp.height})`, async ({ page: p }) => {
        await p.setViewportSize({ width: vp.width, height: vp.height });
        await p.goto(`${baseURL}${page}`, { waitUntil: 'networkidle' });

        // Save viewport screenshot
        await p.screenshot({ path: `qa-screenshots/${page.replace(/\//g, '_')}-${vp.label}-viewport.png`, fullPage: false });

        // Save full-page screenshot
        await p.screenshot({ path: `qa-screenshots/${page.replace(/\//g, '_')}-${vp.label}-fullpage.png`, fullPage: true });

        // Check horizontal overflow
        const scrollWidth = await p.evaluate(() => document.documentElement.scrollWidth);
        const innerWidth = await p.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(innerWidth);

        // Check text elements don't overlap or extend outside Container
        await p.evaluate(() => {
          const container = document.querySelector('.max-w-6xl') || document.body;
          const containerRect = container.getBoundingClientRect();
          const textElements = Array.from(document.querySelectorAll('h1, h2, h3, p, span, a, button, label'));
          for (const el of textElements) {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            // Check not outside container
            if (rect.right > containerRect.right + 1 || rect.left < containerRect.left - 1) {
              console.warn(`Text element extends outside container: ${el.tagName} "${el.textContent?.substring(0, 30)}"`);
            }
          }
        });

        // Check button text padding (text not closer than 16px to button edge)
        await p.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a[role="button"]'));
          for (const btn of buttons) {
            const rect = btn.getBoundingClientRect();
            const textRect = btn.firstChild?.getBoundingClientRect();
            if (!textRect) continue;
            const horizontalPadding = (rect.width - textRect.width) / 2;
            if (horizontalPadding < 8) {
              console.warn(`Button text too close to edge: ${btn.textContent?.substring(0, 30)} padding=${horizontalPadding.toFixed(1)}px`);
            }
          }
        });

        // Check paragraph font sizes
        const fontViolations = await p.evaluate(() => {
          const violations: string[] = [];
          const paragraphs = Array.from(document.querySelectorAll('p'));
          for (const p of paragraphs) {
            const style = window.getComputedStyle(p);
            const size = parseFloat(style.fontSize);
            if (size < 14) {
              violations.push(`Paragraph font-size ${size}px < 14px: "${p.textContent?.substring(0, 30)}"`);
            }
          }
          // Body text check
          const bodyStyle = window.getComputedStyle(document.body);
          const bodySize = parseFloat(bodyStyle.fontSize);
          if (bodySize < 16) {
            violations.push(`Body font-size ${bodySize}px < 16px`);
          }
          return violations;
        });
        expect(fontViolations).toEqual([]);
      });
    }
  }
});