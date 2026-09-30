const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, 'spec-source.md'), 'utf8');

function unescape(s) {
  return s
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\$/g, '$')
    .replace(/\\\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

function section(startMarker, endMarker) {
  const startIdx = raw.indexOf(startMarker);
  if (startIdx === -1) throw new Error('start marker not found: ' + startMarker);
  const endIdx = raw.indexOf(endMarker, startIdx + startMarker.length);
  if (endIdx === -1) throw new Error('end marker not found: ' + endMarker);
  return raw.slice(startIdx + startMarker.length, endIdx);
}

// Strips markdown blockquote "> " line prefixes, then splits into numbered
// items using the "N\." (or "N.") line-start markers as boundaries.
function parseNumberedList(text) {
  const stripped = text.replace(/^>\s?/gm, '');
  const marker = /^(\d+)\\?\.\s+/gm;
  const matches = [...stripped.matchAll(marker)];
  const items = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : stripped.length;
    const n = parseInt(matches[i][1], 10);
    const body = unescape(stripped.slice(start, end));
    items.push({ n, body });
  }
  return items;
}

// ---------- MBTI: "Q<n>. text --- LETTER" one per paragraph ----------
function parseLetterTaggedQ(text) {
  const cleaned = unescape(text);
  const re = /Q(\d+)\.\s*(.+?)\s*---\s*([A-Za-z]+)(?=\s*Q\d+\.|$)/g;
  const out = [];
  let m;
  while ((m = re.exec(cleaned))) {
    out.push({ n: parseInt(m[1], 10), text: m[2].trim(), tag: m[3].trim() });
  }
  return out;
}

const mbtiSection = section('MBTI Questions', 'MBTI Backend Scoring');
const mbti = parseLetterTaggedQ(mbtiSection);

// ---------- Five Love Languages: "N. text --- Tag" blockquote items ----------
function sectionWithin(text, startMarker, endMarker) {
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) throw new Error('start marker not found (within): ' + startMarker);
  const endIdx = text.indexOf(endMarker, startIdx + startMarker.length);
  if (endIdx === -1) throw new Error('end marker not found (within): ' + endMarker);
  return text.slice(startIdx + startMarker.length, endIdx);
}

const fiveLoveOuter = section('6\\. TEST 3 --- FIVE LOVE LANGUAGES', '7\\. TEST 4');
const fiveLoveSection = sectionWithin(fiveLoveOuter, '**Questions:**\n\n', '**Scoring:**');
const fiveLoveItems = parseNumberedList(fiveLoveSection);
const fiveLove = fiveLoveItems.map(({ n, body }) => {
  const m = body.match(/^(.*?)\s*---\s*([A-Za-z]+)$/);
  return m ? { n, text: m[1].trim(), tag: m[2].trim() } : { n, text: body, tag: null };
});

// ---------- Inner Child: plain numbered list, no tag ----------
const innerChildSection = section('5\\. TEST 2 --- INNER CHILD SELF-REFLECTION TEST', '**Scoring:**');
const innerChildQuestionsPart = sectionWithin(innerChildSection + '**Scoring:**', '**Questions:**', '**Scoring:**');
const innerChild = parseNumberedList(innerChildQuestionsPart)
  .filter((q) => q.n <= 30)
  .map(({ n, body }) => ({ n, text: body }));

// ---------- Relationship: categorized numbered lists ----------
const relSection = section('**Questions:**\n\n**Communication', '11\\. DATABASE STRUCTURE');
const relSectionFixed = '**Communication' + relSection;
function parseCategorizedBlocks(text) {
  const parts = text.split(/\*\*([A-Za-z ]+):\*\*/);
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const category = parts[i].trim();
    const body = parts[i + 1] || '';
    const items = parseNumberedList(body);
    for (const item of items) out.push({ category, n: item.n, text: item.body });
  }
  return out;
}
const relationship = parseCategorizedBlocks(relSectionFixed);

function sliceOptionsByMarkers(text) {
  const markerRe = /([A-D])\)/g;
  const markers = [...text.matchAll(markerRe)];
  const out = [];
  for (let i = 0; i < markers.length; i++) {
    const label = markers[i][1];
    const start = markers[i].index + markers[i][0].length;
    const end = i + 1 < markers.length ? markers[i + 1].index : text.length;
    out.push({ label, text: text.slice(start, end).trim() });
  }
  return out;
}

// ---------- Spirit Animal (10 provided, multi-option per question) ----------
const spiritSection = section('8\\. TEST 5 --- SPIRIT ANIMAL / MYTHICAL ANIMAL TEST', 'Expand to 30 questions');
function parseSpiritAnimal(text) {
  const cleaned = unescape(text);
  const re = /Q(\d+)\.\s*(.+?)(?=\s*Q\d+\.|$)/g;
  const out = [];
  let m;
  while ((m = re.exec(cleaned))) {
    const qn = parseInt(m[1], 10);
    const rest = m[2].trim();
    const stemMatch = rest.match(/^(.*?)\s*A\)/);
    const stem = stemMatch ? stemMatch[1].replace(/:$/, '').trim() : rest;
    const rawOptions = sliceOptionsByMarkers(rest);
    const options = rawOptions.map((o) => {
      const om = o.text.match(/^(.*?)\s*---\s*([A-Za-z]+)$/);
      return om ? { label: o.label, text: om[1].trim(), animal: om[2].trim() } : { label: o.label, text: o.text, animal: null };
    });
    out.push({ n: qn, stem, options });
  }
  return out;
}
const spiritAnimal = parseSpiritAnimal(spiritSection);

// ---------- IQ / Cognitive (10 provided, correct answer) ----------
const iqSection = section('7\\. TEST 4 --- COGNITIVE REASONING / IQ-STYLE TEST', '**Scoring:**');
function parseIQ(text) {
  const cleaned = unescape(text);
  const re = /Q(\d+)\.\s*(.+?)(?=\s*Q\d+\.|$)/g;
  const out = [];
  let m;
  while ((m = re.exec(cleaned))) {
    const qn = parseInt(m[1], 10);
    const rest = m[2].trim();
    const correctMatch = rest.match(/---\s*Correct\s+([A-D])/);
    const correct = correctMatch ? correctMatch[1] : null;
    const beforeCorrect = rest.split(/---\s*Correct/)[0];
    const stemMatch = beforeCorrect.match(/^(.*?)\s*A\)/);
    const stem = stemMatch ? stemMatch[1].trim() : beforeCorrect;
    const options = sliceOptionsByMarkers(beforeCorrect);
    out.push({ n: qn, stem, options, correct });
  }
  return out;
}
const iq = parseIQ(iqSection);

const outDir = path.join(__dirname, 'data');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'mbti.json'), JSON.stringify(mbti, null, 2));
fs.writeFileSync(path.join(outDir, 'fiveLoveLanguages.json'), JSON.stringify(fiveLove, null, 2));
fs.writeFileSync(path.join(outDir, 'innerChild.json'), JSON.stringify(innerChild, null, 2));
fs.writeFileSync(path.join(outDir, 'relationship.json'), JSON.stringify(relationship, null, 2));
fs.writeFileSync(path.join(outDir, 'spiritAnimal.json'), JSON.stringify(spiritAnimal, null, 2));
fs.writeFileSync(path.join(outDir, 'iq.json'), JSON.stringify(iq, null, 2));

console.log('MBTI:', mbti.length);
console.log('FiveLove:', fiveLove.length);
console.log('InnerChild:', innerChild.length);
console.log('Relationship:', relationship.length);
console.log('SpiritAnimal:', spiritAnimal.length, spiritAnimal.map((q) => q.options.length));
console.log('IQ:', iq.length, iq.map((q) => q.options.length));
