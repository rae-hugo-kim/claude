#!/usr/bin/env node
// git-commit-detect.mjs - shared `git commit` detection for the commit gates.
// Not a hook itself — imported by acceptance-gate, backpressure-gate, and
// review-gate (all PreToolUse: Bash) so they detect a commit identically.
//
// isGitCommit(command) -> boolean
//
// Replaces the old per-gate regex /(?:^|&&|\|\||;)\s*git\b[^|;]*\bcommit\b/, which
// had two defects (adversarial review then surfaced a long tail in both directions):
//   (1) false-NEGATIVE: a real `git commit` slipped past when separated by a NEWLINE
//       or single `&`, hidden behind an env-with-quoted-value or wrapper-with-options
//       prefix, behind a `bash -c`/`sh -c` variant, or behind a shell reserved word.
//   (2) false-POSITIVE: it fired on non-commit git commands whose args merely contain
//       "commit" (`git log --grep commit`), on sibling subcommands (`git commit-graph`,
//       `git commit-tree`), on commented-out / heredoc-body text, and on terminal global
//       options (`git --help commit`).
//
// Approach — a small, linear shell-aware lexer (NOT a full bash grammar):
//   lexSegments()  splits into top-level command segments. Quotes ('…'/"…") protect
//                  operators; `\`+newline is a line-join; an unquoted word-initial `#`
//                  starts a comment (dropped); `<<WORD` heredoc bodies are dropped;
//                  delimiters are && || ; | & and newline.
//   Per segment: tokenize() quote-aware, then locate the program being run — skipping
//   env-assignments and shell reserved words, and (for a wrapper command such as
//   sudo/env/nice/timeout, matched by BASENAME so `/usr/bin/env` counts) scanning past
//   its options for the first git/bash/sh program token. `bash -c "<inner>"` recurses on
//   the inner script. Fire only when the program is `git` (basename) and its SUBCOMMAND —
//   the first token after global options, with terminal options (--help/--version/…)
//   short-circuiting — is exactly `commit`.
//
// Bias: this is a SAFETY gate, so ambiguous/unparseable cases fail CLOSED (treated as a
// commit) rather than fail-open. Wrapper option arity is NOT modelled — we scan for the
// real program token instead, so unknown wrapper options can never hide the commit.
//
// Deliberate scope / known gaps (documented, asserted in tests):
//   - Cross-repo targeting (`git -C other commit`) is NOT special-cased — still detected.
//   - Commit hidden inside command substitution (`echo "$(git commit)"`), `env -S "git
//     commit"` split-string exec, `case … esac` pattern bodies, backslash-escaped
//     program names (`\git commit`), leading redirections before the command
//     (`>out git commit`), and process substitution (`cat <(git commit)`) are NOT
//     detected — all exotic and outside the (non-adversarial) agent threat model.
//   - A few exotic forms OVER-detect (fail-closed, harmless): `command -v git commit`
//     and `xargs echo git commit` are lookups/echoes, not commits, but report true.
//   - Past MAX_DEPTH of nested `bash -c`, detection FAILS CLOSED (treats it as a commit).

const MAX_DEPTH = 5;

const RESERVED = new Set(['if', 'then', 'elif', 'else', 'fi', 'while', 'until', 'for',
  'in', 'do', 'done', 'case', 'esac', 'function', '!', '{', '}']);

// Commands that exec the rest of the line (after their own options). Matched by basename.
const WRAPPER = new Set(['env', 'sudo', 'doas', 'nice', 'ionice', 'time', 'timeout',
  'command', 'nohup', 'stdbuf', 'setsid', 'xargs', 'exec']);

// Terminal/informational options that make a wrapper print-and-exit (never exec git).
const WRAPPER_TERMINAL_OPT = new Set(['--help', '--version', '-h', '-V']);

// git global options that take a SEPARATE argument (consume the next token too).
const GIT_OPT_WITH_ARG = new Set(['-C', '-c', '--config-env', '--git-dir', '--work-tree',
  '--namespace', '--exec-path', '--super-prefix']);
// Terminal/informational git global options: git prints and exits before any subcommand.
const GIT_TERMINAL_OPT = new Set(['-h', '--help', '--version', '--html-path',
  '--man-path', '--info-path']);

// bash/sh options that take a SEPARATE argument, consumed before locating `-c`.
const SHELL_OPT_WITH_ARG = new Set(['-o', '-O', '--rcfile', '--init-file']);

function basename(t) {
  const i = t.lastIndexOf('/');
  return i >= 0 ? t.slice(i + 1) : t;
}
function isAssign(t) { return /^[A-Za-z_][A-Za-z0-9_]*=/.test(t); }
function isShellProg(b) { return b === 'git' || b === 'bash' || b === 'sh'; }

// Split a command into top-level segments, dropping comments and heredoc bodies.
function lexSegments(cmd) {
  const segs = [];
  let cur = '', i = 0, q = null;            // q = "'" or '"' while inside that quote
  const heredocs = [];                       // delimiters opened on the current line
  const n = cmd.length;
  while (i < n) {
    const c = cmd[i], nx = cmd[i + 1];
    if (q === "'") { cur += c; if (c === "'") q = null; i++; continue; }
    if (q === '"') {
      if (c === '\\' && nx !== undefined) { cur += c + nx; i += 2; continue; }
      cur += c; if (c === '"') q = null; i++; continue;
    }
    if (c === '\\' && nx === '\n') { i += 2; continue; }                       // line join
    if (c === '\\' && nx === '\r' && cmd[i + 2] === '\n') { i += 3; continue; } // CRLF join
    if (c === '\\' && nx !== undefined) { cur += c + nx; i += 2; continue; }    // escape
    if (c === "'" || c === '"') { q = c; cur += c; i++; continue; }
    if (c === '#' && (cur === '' || /\s$/.test(cur))) {                        // comment
      while (i < n && cmd[i] !== '\n') i++;
      continue;
    }
    if (c === '<' && nx === '<' && cmd[i + 2] !== '<') {                        // heredoc start (not <<<)
      const m = /^<<(-?)\s*(?:'([^']+)'|"([^"]+)"|\\?([A-Za-z_][A-Za-z0-9_.-]*))/.exec(cmd.slice(i));
      if (m) {
        heredocs.push({ delim: m[2] ?? m[3] ?? m[4], strip: m[1] === '-' });
        cur += m[0]; i += m[0].length; continue;
      }
    }
    if (c === '\n' || c === '\r') {                                            // newline = separator
      segs.push(cur); cur = ''; i++;
      if (c === '\r' && cmd[i] === '\n') i++;
      while (heredocs.length) {                                                // drop heredoc bodies
        const { delim, strip } = heredocs.shift();
        while (i < n) {
          let j = i;
          while (j < n && cmd[j] !== '\n') j++;
          const line = cmd.slice(i, j);
          i = j < n ? j + 1 : j;
          if ((strip ? line.replace(/^\t+/, '') : line) === delim) break;
        }
      }
      continue;
    }
    if (c === '&' && nx === '&') { segs.push(cur); cur = ''; i += 2; continue; }
    if (c === '|' && nx === '|') { segs.push(cur); cur = ''; i += 2; continue; }
    if (c === ';' || c === '|' || c === '&') { segs.push(cur); cur = ''; i++; continue; }
    cur += c; i++;
  }
  segs.push(cur);
  return segs;
}

// Quote-aware tokenizer: splits on unquoted whitespace and ( ) { } metacharacters,
// stripping the quotes.
function tokenize(s) {
  const toks = [];
  let cur = '', i = 0, q = null, started = false;
  while (i < s.length) {
    const c = s[i], n = s[i + 1];
    if (q) {
      if (q === '"' && c === '\\' && n !== undefined) { cur += n; i += 2; started = true; continue; }
      if (c === q) { q = null; i++; continue; }
      cur += c; i++; started = true; continue;
    }
    if (c === "'" || c === '"') { q = c; i++; started = true; continue; }
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r' ||
        c === '(' || c === ')' || c === '{' || c === '}') {
      if (started) { toks.push(cur); cur = ''; started = false; }
      i++; continue;
    }
    cur += c; i++; started = true;
  }
  if (started) toks.push(cur);
  return toks;
}

// Locate the index of the program token to analyze, or -1. Skips leading env-assignments
// and shell reserved words; for a wrapper command, scans past its options for the first
// git/bash/sh program (so unknown wrapper option arity can never hide the real command).
function programIndex(toks) {
  let i = 0;
  while (i < toks.length && (isAssign(toks[i]) || RESERVED.has(toks[i]))) i++;
  if (i >= toks.length) return -1;
  const b = basename(toks[i]);
  if (isShellProg(b)) return i;
  if (WRAPPER.has(b)) {
    for (let k = i + 1; k < toks.length; k++) {
      const t = toks[k];
      if (WRAPPER_TERMINAL_OPT.has(t)) return -1;       // wrapper prints help/version, never runs git
      if (isShellProg(basename(t))) return k;
    }
    return -1;
  }
  return i;                                              // some other program -> analyzed, will be non-git
}

// If toks is a bash/sh invocation, return the inner `-c` script string, else null.
function bashDashCPayload(toks) {
  let i = 1;
  while (i < toks.length) {
    const t = toks[i];
    if (!t.startsWith('-')) return null;            // a script FILE arg, not -c "string"
    if (/^-[A-Za-z]*c$/.test(t)) return i + 1 < toks.length ? toks[i + 1] : null; // …c takes next token
    if (SHELL_OPT_WITH_ARG.has(t)) { i += 2; continue; }
    i += 1;                                          // boolean option (-l, --noprofile, …)
  }
  return null;
}

function gitSubcommandIsCommit(toks) {
  let i = 1;
  while (i < toks.length) {
    const t = toks[i];
    if (!t.startsWith('-')) break;
    if (GIT_TERMINAL_OPT.has(t) || t.startsWith('--list-cmds')) return false;
    if (GIT_OPT_WITH_ARG.has(t)) { i += 2; continue; }
    i += 1;                                          // --opt=value or boolean global flag
  }
  return toks[i] === 'commit';
}

function segmentIsGitCommit(seg, depth) {
  const toks = tokenize(seg);
  const pi = programIndex(toks);
  if (pi < 0) return false;
  const rest = toks.slice(pi);
  const b = basename(rest[0]);
  if (b === 'bash' || b === 'sh') {
    const inner = bashDashCPayload(rest);
    if (inner === null) return false;
    if (depth >= MAX_DEPTH) return true;             // fail CLOSED on pathological nesting
    return anySegmentIsCommit(inner, depth + 1);
  }
  if (b === 'git') return gitSubcommandIsCommit(rest);
  return false;
}

function anySegmentIsCommit(cmd, depth) {
  if (!cmd || typeof cmd !== 'string') return false;
  for (const seg of lexSegments(cmd)) {
    if (segmentIsGitCommit(seg, depth)) return true;
  }
  return false;
}

export function isGitCommit(command) {
  return anySegmentIsCommit(command, 0);
}
