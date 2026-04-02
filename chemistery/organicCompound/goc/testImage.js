#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2] || 'test.json';
function die(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  die(`Input file not found: ${inputFile}`);
}

const raw = fs.readFileSync(inputFile, 'utf8');
let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  die(`Failed to parse JSON from ${inputFile}: ${err.message}`);
}

const sections = (data.data && Array.isArray(data.data.sections)) ? data.data.sections : [];
const sectionMap = new Map();
sections.forEach(section => {
  const sectionId = section.sectionId && (section.sectionId._id || section.sectionId) ? (section.sectionId._id || section.sectionId) : null;
  const sectionName = section.sectionId && section.sectionId.name ? section.sectionId.name : (typeof section.sectionId === 'string' ? section.sectionId : 'Unknown');
  if (sectionId) {
    sectionMap.set(String(sectionId), String(sectionName).trim() || 'Unknown');
  }
});

const safeName = name => {
  return String(name || 'Unknown')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '') || 'Unknown';
};

const urlsBySection = new Map();
const addUrl = (section, url, questionNumber) => {
  if (!url || typeof url !== 'string') return;
  const normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) return;
  if (/^https?:\/\/[^\/]+\/?$/i.test(normalized)) return; // skip bare host URLs
  if (!/\.(png|jpe?g|gif|webp|svg)(?:[?#]|$)/i.test(normalized)) return; // only image files
  const sectionKey = safeName(section);
  const row = urlsBySection.get(sectionKey) || [];
  row.push({ url: normalized, questionNumber });
  urlsBySection.set(sectionKey, row);
};

const collectUrls = (value, section, questionNumber) => {
  if (!value && value !== 0) return;
  if (typeof value === 'string') {
    if (/^https?:\/\//i.test(value)) {
      addUrl(section, value, questionNumber);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(item => collectUrls(item, section, questionNumber));
    return;
  }
  if (typeof value === 'object') {
    if (typeof value.baseUrl === 'string' && typeof value.key === 'string') {
      const baseUrl = value.baseUrl.replace(/\/+$/, '');
      const key = value.key.replace(/^\/+|\/+$/g, '');
      if (key.length > 0) {
        addUrl(section, `${baseUrl}/${key}`, questionNumber);
      }
    }
    if (typeof value.url === 'string' && /^https?:\/\//i.test(value.url)) {
      addUrl(section, value.url, questionNumber);
    }
    Object.values(value).forEach(v => collectUrls(v, section, questionNumber));
  }
};

const questions = (data.data && Array.isArray(data.data.questions)) ? data.data.questions : [];
questions.forEach(questionEntry => {
  const question = questionEntry.question || questionEntry;
  const sectionId = question.sectionId || questionEntry.sectionId || null;
  const sectionName = sectionMap.get(String(sectionId)) || 'Unknown';
  const questionNumber = question.questionNumber || question.questionNo || (questionEntry.questionNumber || questionEntry.questionNo) || '';
  collectUrls(question, sectionName, questionNumber);
});

if (urlsBySection.size === 0) {
  die('No image URLs found in the JSON file.');
}

const seen = new Set();
for (const [section, entries] of urlsBySection) {
  for (const entry of entries) {
    if (seen.has(`${section}|${entry.url}`)) continue;
    seen.add(`${section}|${entry.url}`);
    const questionPrefix = entry.questionNumber ? `Q${String(entry.questionNumber).padStart(2, '0')}-` : '';
    let parsed;
    try {
      parsed = new URL(entry.url);
    } catch (err) {
      continue;
    }
    const basename = path.basename(parsed.pathname) || 'image.png';
    const safeBase = basename.replace(/[^A-Za-z0-9._-]/g, '_');
    const target = `${section}/${questionPrefix}${safeBase}`;
    console.log(`${section}\t${entry.url}\t${target}`);
  }
}
