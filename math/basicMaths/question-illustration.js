#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function usage() {
  console.log('Usage: node question-illustration.js <slides-dir> <output-file> [pattern]');
  console.log('Example: node question-illustration.js notes illustration.md "*question.png"');
}

function patternToRegex(pattern) {
  const escaped = pattern.replace(/[-[\]{}()+?.,\\^$|#\s*]/g, '\\$&');
  const regex = '^' + escaped.replace(/\\\*/g, '.*').replace(/\\\?/g, '.') + '$';
  return new RegExp(regex, 'i');
}

function walkDir(dir, matcher) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath, matcher));
    } else if (entry.isFile() && matcher(entry.name)) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function cleanTitle(name) {
  let title = name.replace(/question$/i, '');
  title = title.replace(/[-_]+$/, '');
  title = title.replace(/[-_]+/g, ' ');
  title = title.trim();
  if (!title) title = name;
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function relativePath(from, to) {
  let rel = path.relative(from, to).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

async function run() {
  const [,, slidesDir, outputFile, patternArg] = process.argv;
  if (!slidesDir || !outputFile) {
    usage();
    process.exit(1);
  }

  const pattern = patternArg || '*question.png';
  const matcher = patternToRegex(pattern);

  if (!fs.existsSync(slidesDir) || !fs.statSync(slidesDir).isDirectory()) {
    console.error(`Error: slides directory not found: ${slidesDir}`);
    process.exit(1);
  }

  const images = walkDir(slidesDir, name => matcher.test(name));
  if (images.length === 0) {
    console.error(`No files matching pattern ${pattern} found under ${slidesDir}`);
    process.exit(1);
  }

  const outputDir = path.dirname(outputFile) || '.';
  fs.mkdirSync(outputDir, { recursive: true });

  const lines = [];
  lines.push('# Question Illustration');
  lines.push('');
  lines.push('Generated from images in `' + slidesDir + '` on ' + new Date().toISOString());
  lines.push('');

  for (const imagePath of images) {
    const relativeImage = relativePath(outputDir, imagePath);
    const baseName = path.basename(imagePath, path.extname(imagePath));
    const title = cleanTitle(baseName);

    lines.push(`## ${title}`);
    lines.push('');
    lines.push(`![${title}](${relativeImage})`);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  fs.writeFileSync(outputFile, lines.join('\n'), 'utf8');
  console.log(`\nGenerated ${outputFile} with ${images.length} entries.`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
