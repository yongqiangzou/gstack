/**
 * Shared discovery for SKILL.md and .tmpl files.
 * Scans root + one level of subdirs, skipping node_modules/.git/dist.
 */

import * as fs from 'fs';
import * as path from 'path';

const SKIP = new Set(['node_modules', '.git', 'dist']);

function subdirs(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.') && !SKIP.has(d.name))
    .map(d => d.name);
}

export function discoverTemplates(root: string): Array<{ tmpl: string; output: string }> {
  const dirs = ['', ...subdirs(root)];
  const results: Array<{ tmpl: string; output: string }> = [];
  for (const dir of dirs) {
    const base = dir ? `${dir}/` : '';
    // Discover all *.md.tmpl files (SKILL.md.tmpl, SKILL.cn.md.tmpl, etc.)
    const dirPath = dir ? path.join(root, dir) : root;
    if (!fs.existsSync(dirPath)) continue;
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md.tmpl'));
    for (const file of files) {
      const rel = `${base}${file}`;
      results.push({ tmpl: rel, output: rel.replace(/\.tmpl$/, '') });
    }
  }
  return results;
}

export function discoverSkillFiles(root: string): string[] {
  const dirs = ['', ...subdirs(root)];
  const results: string[] = [];
  for (const dir of dirs) {
    const rel = dir ? `${dir}/SKILL.md` : 'SKILL.md';
    if (fs.existsSync(path.join(root, rel))) {
      results.push(rel);
    }
  }
  return results;
}
