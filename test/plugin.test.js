'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// Snake_case words in skills that are parameter names, not tool names.
const NOT_TOOLS = new Set(['is_approved']);
const SNAKE = /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g;

function loadTools() {
  return new Set(read('test/tools.txt').split('\n').filter(Boolean));
}

// Every snake_case word in the text, wherever it appears (backticks, bold,
// call form or plain prose), that is neither a served tool nor in NOT_TOOLS.
function unknownToolRefs(text, tools) {
  const words = text.match(SNAKE) || [];
  return [...new Set(words.filter((w) => !tools.has(w) && !NOT_TOOLS.has(w)))];
}

function toolRefs(text, tools) {
  return new Set((text.match(SNAKE) || []).filter((w) => tools.has(w)));
}

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

function nonAsciiFiles(files) {
  return files.filter((f) => /[^\x00-\x7F]/.test(read(f)));
}

function listFiles(dir = ROOT, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) listFiles(p, acc);
    else acc.push(path.relative(ROOT, p));
  }
  return acc;
}

const skills = fs
  .readdirSync(path.join(ROOT, 'skills'))
  .filter((d) => fs.existsSync(path.join(ROOT, 'skills', d, 'SKILL.md')));

test('tools.txt is a unique, sorted list of a plausible size', () => {
  const lines = read('test/tools.txt').split('\n').filter(Boolean);
  assert.ok(lines.length >= 100, `only ${lines.length} tools`);
  assert.equal(new Set(lines).size, lines.length);
  assert.deepEqual([...lines].sort(), lines);
});

test('at least four skills are discovered', () => {
  assert.ok(skills.length >= 4, `found ${skills.length}: ${skills}`);
});

for (const dir of skills) {
  test(`${dir}: frontmatter names the skill and describes when to use it`, () => {
    const fm = frontmatter(read(`skills/${dir}/SKILL.md`));
    assert.ok(fm, 'no frontmatter');
    assert.equal(fm.name, dir);
    assert.ok(fm.description && fm.description.length >= 50 && fm.description.length <= 1024);
  });

  test(`${dir}: names only tools the connector serves, and at least two`, () => {
    const text = read(`skills/${dir}/SKILL.md`);
    const tools = loadTools();
    assert.deepEqual(unknownToolRefs(text, tools), []);
    assert.ok(toolRefs(text, tools).size >= 2);
  });
}

test('control: the tool check flags a name the server does not serve', () => {
  const tools = loadTools();
  const fake = `zq${Date.now()}_notathing`;
  assert.ok(!tools.has(fake));
  for (const form of [`\`${fake}\``, `**${fake}**`, `${fake}(task_ref)`, `plain ${fake} text`]) {
    assert.ok(unknownToolRefs(`call ${form} then \`launch_process\``, tools).includes(fake), form);
  }
  assert.deepEqual(unknownToolRefs('call `launch_process` with `is_approved`', tools), []);
});

test('.mcp.json has one http server at the connector URL', () => {
  const servers = JSON.parse(read('.mcp.json')).mcpServers;
  assert.deepEqual(Object.keys(servers), ['tallyfy']);
  assert.equal(servers.tallyfy.type, 'http');
  assert.equal(servers.tallyfy.url, 'https://mcp.tallyfy.com/');
});

test('plugin.json carries the fields the directory needs', () => {
  const p = JSON.parse(read('.claude-plugin/plugin.json'));
  assert.equal(p.name, 'tallyfy');
  assert.match(p.version, /^\d+\.\d+\.\d+$/);
  for (const k of ['description', 'author', 'homepage', 'repository', 'license', 'privacyPolicyUrl']) {
    assert.ok(p[k], `missing ${k}`);
  }
});

test('every file is ASCII only', () => {
  const files = listFiles();
  assert.ok(files.length >= 8, `only ${files.length} files`);
  assert.deepEqual(nonAsciiFiles(files), []);
});

test('control: the ASCII check flags a non-ASCII file', () => {
  const tmp = path.join(ROOT, 'test', `zq${process.pid}.tmp`);
  fs.writeFileSync(tmp, 'a' + String.fromCharCode(0x2014) + 'b');
  try {
    assert.deepEqual(nonAsciiFiles([path.relative(ROOT, tmp)]), [path.relative(ROOT, tmp)]);
  } finally {
    fs.unlinkSync(tmp);
  }
});
