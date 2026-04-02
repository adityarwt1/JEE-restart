#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function usage() {
  console.log('Usage: node question-practice-sheet.js <source-dir> <output-file> [pattern]');
  console.log('Example: node question-practice-sheet.js questoinPractices questionSheet.md "*.png"');
}

function wildcardToRegex(pattern) {
  const regex = pattern
    .split('')
    .map(char => {
      if (char === '*') return '.*';
      if (char === '?') return '.';
      return char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
  return new RegExp(`^${regex}$`, 'i');
}

function findImages(dir, matcher) {
  const matches = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      matches.push(...findImages(fullPath, matcher));
    } else if (entry.isFile() && matcher.test(entry.name)) {
      matches.push(fullPath);
    }
  }
  return matches.sort();
}

function makeTitle(filename) {
  let name = path.basename(filename, path.extname(filename));
  name = name.replace(/question$/i, '');
  name = name.replace(/[-_]+/g, ' ');
  name = name.replace(/\s+/g, ' ').trim();
  if (!name) {
    name = path.basename(filename);
  }
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function relativeMarkdownPath(from, to) {
  let rel = path.relative(from, to).replace(/\\/g, '/');
  if (!rel.startsWith('.') && !rel.startsWith('/')) {
    rel = './' + rel;
  }
  return rel;
}

function groupByFolder(files, rootDir) {
  const groups = new Map();
  for (const file of files) {
    const folder = path.relative(rootDir, path.dirname(file)) || '.';
    if (!groups.has(folder)) {
      groups.set(folder, []);
    }
    groups.get(folder).push(file);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function buildMarkdown(groups, rootDir, outputDir) {
  const lines = [];
  lines.push('# Question Practice Sheet');
  lines.push('');
  lines.push(`Generated from images in \`${rootDir}\` on ${new Date().toISOString()}`);
  lines.push('');

  for (const [folder, files] of groups) {
    const section = folder === '.' ? 'General' : folder.replace(/[-_]+/g, ' ');
    lines.push(`## ${section}`);
    lines.push('');

    for (const file of files) {
      const title = makeTitle(file);
      const imagePath = relativeMarkdownPath(outputDir, file);
      lines.push(`### ${title}`);
      lines.push('');
      lines.push(`![${title}](${imagePath})`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

function main() {
  const [,, sourceDir, outputFile, patternArg] = process.argv;
  if (!sourceDir || !outputFile) {
    usage();
    process.exit(1);
  }

  const pattern = patternArg || '*.png';
  const matcher = wildcardToRegex(pattern);

  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    console.error(`Error: source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  const imageFiles = findImages(sourceDir, matcher);
  if (imageFiles.length === 0) {
    console.error(`No images matching ${pattern} found under ${sourceDir}`);
    process.exit(1);
  }

  const outputDir = path.dirname(outputFile) || '.';
  fs.mkdirSync(outputDir, { recursive: true });

  const groups = groupByFolder(imageFiles, sourceDir);
  const markdown = buildMarkdown(groups, sourceDir, outputDir);

  fs.writeFileSync(outputFile, markdown, 'utf8');
  console.log(`Generated ${outputFile} with ${imageFiles.length} questions.`);
}

main();
