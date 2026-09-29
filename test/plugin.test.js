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

// Backticked words a skill may use that are keys in tool data, not tools.
const KNOWN_KEYS = new Set(['assignees', 'guests', 'groups', 'id', 'is_approved']);

// Status values the server accepts. Task filters are the keys of
// _TASK_STATUS_FILTERS in the Tallyfy MCP server's task_management.py; run
// statuses are those get_organization_runs documents. Refresh with tools.txt.
// `stalled` is left out: the server accepts it, but the Tallyfy API in
// production ignores it and returns every task. Add it once production filters.
const TASK_STATUSES = new Set(['all', 'active', 'active-visible', 'not-started', 'in-progress', 'complete',
  'overdue', 'due-soon', 'on-time', 'has-problem', 'has-improvement']);
const RUN_STATUSES = new Set(['active', 'problem', 'delayed', 'complete', 'improvement', 'starred', 'archived']);
// Which status list each tool takes.
const STATUS_LISTS = {
  get_organization_runs: RUN_STATUSES,
  get_my_tasks: TASK_STATUSES,
  get_tasks_for_process: TASK_STATUSES,
};

function unknownBackticked(text, tools) {
  const words = [...text.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
  return [...new Set(words.filter((w) => !tools.has(w) && !KNOWN_KEYS.has(w)))];
}

function sentences(text) {
  return text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/);
}

// Every status value in a sentence must be one the tool named in that
// sentence accepts. A status with no known tool beside it is also reported.
function unknownStatuses(text) {
  const bad = [];
  for (const s of sentences(text)) {
    const values = [
      ...[...s.matchAll(/status\b[^"'.]{0,30}?["']([^"']+)["']/g)].map((m) => m[1]),
      ...[...s.matchAll(/filter(?:ed)?\b[^"'.]{0,20}?["']([^"']+)["']/g)].map((m) => m[1]),
      ...[...s.matchAll(/["']([^"']+)["']\s+filter/g)].map((m) => m[1]),
      ...[...s.matchAll(/with status ([a-z][a-z-]*)\b/g)].map((m) => m[1]),
    ];
    if (!values.length) continue;
    const named = Object.keys(STATUS_LISTS).filter((tool) => s.includes(tool));
    for (const v of values) {
      if (named.length !== 1 || !STATUS_LISTS[named[0]].has(v)) bad.push(v);
    }
  }
  return [...new Set(bad)];
}

// Kickoff answers are keyed by each field's `id`; any other key is dropped.
// A skill that launches a process must say so, and must not key them any
// other way.
function wrongKickoffKeys(text) {
  const wrong = sentences(text).filter((s) =>
    (/keyed (by|on)/i.test(s) && (!/keyed by each field's `id`/i.test(s) || /\b(labels?|alias(es)?)\b/i.test(s)))
    || /\b(labels?|alias(es)?)\b[^.]*\bkeys?\b|\bkeys?\b[^.]*\b(labels?|alias(es)?)\b/i.test(s));
  if (text.includes('launch_process') && !/keyed by each field's `id`/.test(text.replace(/\s+/g, ' '))) {
    wrong.push('(launch_process named, but no "keyed by each field\'s `id`")');
  }
  return wrong;
}

// Frontmatter values must be plain YAML scalars: no ': ' or ' #' inside.
function badFrontmatterLines(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return ['(no frontmatter)'];
  return m[1].split('\n').filter((line) => !/^[a-z-]+: (?!.*(: | #)).+$/.test(line));
}

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
    assert.deepEqual(unknownBackticked(text, tools), []);
    assert.ok(toolRefs(text, tools).size >= 2);
  });

  test(`${dir}: every quoted status is one the named tool accepts`, () => {
    assert.deepEqual(unknownStatuses(read(`skills/${dir}/SKILL.md`)), []);
  });

  test(`${dir}: kickoff answers are keyed by id, and frontmatter is plain YAML`, () => {
    const text = read(`skills/${dir}/SKILL.md`);
    assert.deepEqual(wrongKickoffKeys(text), []);
    assert.deepEqual(badFrontmatterLines(text), []);
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
  for (const w of ['getMyTasks', 'Get_Task_Commentz', 'mcp__tallyfy__get_kickoff_fieldz', 'label']) {
    assert.deepEqual(unknownBackticked(`call \`${w}\` then \`launch_process\` keyed by \`id\``, tools), [w]);
  }
});

test('control: the status check flags a value the named tool does not accept', () => {
  assert.deepEqual(unknownStatuses('Call `get_my_tasks` with status "active-visibel".'), ['active-visibel']);
  assert.deepEqual(unknownStatuses('Call `get_my_tasks` with status="active-visibel".'), ['active-visibel']);
  assert.deepEqual(unknownStatuses('Call `get_tasks_for_process` with status "problem".'), ['problem']);
  assert.deepEqual(unknownStatuses('Call `get_tasks_for_process` with status "delayed".'), ['delayed']);
  assert.deepEqual(unknownStatuses('Call `get_organization_runs` with status "has-problem".'), ['has-problem']);
  assert.deepEqual(unknownStatuses('Pass status "active".'), ['active']);
  assert.deepEqual(unknownStatuses('Call `get_organization_runs` with status: "delayd".'), ['delayd']);
  assert.deepEqual(unknownStatuses("Call `get_my_tasks` with status 'active-visibel'."), ['active-visibel']);
  assert.deepEqual(unknownStatuses('Call `get_organization_runs` with the status filter set to "delayd".'), ['delayd']);
  assert.deepEqual(unknownStatuses('Call `get_tasks_for_process` with status "stalled".'), ['stalled']);
  assert.deepEqual(unknownStatuses('Call `get_tasks_for_process` with status stalled.'), ['stalled']);
  assert.deepEqual(unknownStatuses('Call `get_tasks_for_process` with the "stalled" filter.'), ['stalled']);
  assert.deepEqual(unknownStatuses('Call `get_tasks_for_process`, filtered to "stalled".'), ['stalled']);
  assert.deepEqual(unknownStatuses('Call `get_tasks_for_process` with status overdue.'), []);
  assert.deepEqual(unknownStatuses('Call `get_organization_runs` with status "delayed". Call `get_tasks_for_process`\nwith status "has-problem".'), []);
});

test('control: kickoff key and frontmatter checks flag the wrong shapes', () => {
  assert.equal(wrongKickoffKeys("answers as one object keyed by each field's `label`.").length, 1);
  assert.equal(wrongKickoffKeys("answers as one object keyed by each field's label.").length, 1);
  assert.equal(wrongKickoffKeys("answers as one object keyed by each field's `id`.").length, 0);
  assert.equal(wrongKickoffKeys("answers keyed on each field's label.").length, 1);
  assert.equal(wrongKickoffKeys("answers keyed by each field's `id` or its label.").length, 1);
  assert.equal(wrongKickoffKeys('Field labels work as keys too.').length, 1);
  assert.equal(wrongKickoffKeys('Keyed by label also works.').length, 1);
  assert.equal(wrongKickoffKeys('Call `launch_process` with the name.').length, 1);
  assert.equal(wrongKickoffKeys("Call `launch_process` with answers keyed by each field's `id`.").length, 0);
  assert.deepEqual(badFrontmatterLines('---\nname: x\ndescription: Do this: then that\n---\n'), ['description: Do this: then that']);
  assert.deepEqual(badFrontmatterLines('---\nname: x\ndescription: Do this, then that\n---\n'), []);
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
