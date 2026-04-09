---
name: gstack
preamble-tier: 1
version: 1.1.0
description: |
  Fast headless browser for QA testing and site dogfooding. Navigate pages, interact with
  elements, verify state, diff before/after, take annotated screenshots, test responsive
  layouts, forms, uploads, dialogs, and capture bug evidence. Use when asked to open or
  test a site, verify a deployment, dogfood a user flow, or file a bug with screenshots. (gstack)
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion

---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

## Preamble (run first)

```bash
_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || .claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
mkdir -p ~/.gstack/sessions
touch ~/.gstack/sessions/"$PPID"
_SESSIONS=$(find ~/.gstack/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find ~/.gstack/sessions -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=$(~/.claude/skills/gstack/bin/gstack-config get gstack_contributor 2>/dev/null || true)
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"
```

If output shows `UPGRADE_AVAILABLE <old> <new>`: read `~/.claude/skills/gstack/gstack-upgrade/SKILL.md` and follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise AskUserQuestion with 4 options, write snooze state if declined). If `JUST_UPGRADED <from> <to>`: tell user "Running gstack v{to} (just updated!)" and continue.

## AskUserQuestion Format

**ALWAYS follow this structure for every AskUserQuestion call:**
1. **Re-ground:** State the project, the current branch (use the `_BRANCH` value printed by the preamble — NOT any branch from conversation history or gitStatus), and the current plan/task. (1-2 sentences)
2. **Simplify:** Explain the problem in plain English a smart 16-year-old could follow. No raw function names, no internal jargon, no implementation details. Use concrete examples and analogies. Say what it DOES, not what it's called.
3. **Recommend:** `RECOMMENDATION: Choose [X] because [one-line reason]`
4. **Options:** Lettered options: `A) ... B) ... C) ...`

Assume the user hasn't looked at this window in 20 minutes and doesn't have the code open. If you'd need to read the source to understand your own explanation, it's too complex.

Per-skill instructions may add additional formatting rules on top of this baseline.

## Contributor Mode

If `_CONTRIB` is `true`: you are in **contributor mode**. You're a gstack user who also helps make it better.

**At the end of each major workflow step** (not after every single command), reflect on the gstack tooling you used. Rate your experience 0 to 10. If it wasn't a 10, think about why. If there is an obvious, actionable bug OR an insightful, interesting thing that could have been done better by gstack code or skill markdown — file a field report. Maybe our contributor will help make us better!

**Calibration — this is the bar:** For example, `$B js "await fetch(...)"` used to fail with `SyntaxError: await is only valid in async functions` because gstack didn't wrap expressions in async context. Small, but the input was reasonable and gstack should have handled it — that's the kind of thing worth filing. Things less consequential than this, ignore.

**NOT worth filing:** user's app bugs, network errors to user's URL, auth failures on user's site, user's own JS logic bugs.

**To file:** write `~/.gstack/contributor-logs/{slug}.md` with **all sections below** (do not truncate — include every section through the Date/Version footer):

```
# {Title}

Hey gstack team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**My rating:** {0-10} — {one sentence on why it wasn't a 10}

## Steps to reproduce
1. {step}

## Raw output
```
{paste the actual error or unexpected output here}
```

## What would make this a 10
{one sentence: what gstack should have done differently}

**Date:** {YYYY-MM-DD} | **Version:** {gstack version} | **Skill:** /{skill}
```

Slug: lowercase, hyphens, max 60 chars (e.g. `browse-js-no-await`). Skip if file already exists. Max 3 reports per session. File inline and continue — don't stop the workflow. Tell user: "Filed gstack field report: {title}"

If `PROACTIVE` is `false`: do NOT proactively invoke or suggest other gstack skills during
this session. Only run skills the user explicitly invokes. This preference persists across
sessions via `gstack-config`.

If `PROACTIVE` is `true` (default): **invoke the Skill tool** when the user's request
matches a skill's purpose. Do NOT answer directly when a skill exists for the task.
Use the Skill tool to invoke it. The skill has specialized workflows, checklists, and
quality gates that produce better results than answering inline.

**Routing rules — when you see these patterns, INVOKE the skill via the Skill tool:**
- User describes a new idea, asks "is this worth building", wants to brainstorm → invoke `/office-hours`
- User asks about strategy, scope, ambition, "think bigger" → invoke `/plan-ceo-review`
- User asks to review architecture, lock in the plan → invoke `/plan-eng-review`
- User asks about design system, brand, visual identity → invoke `/design-consultation`
- User asks to review design of a plan → invoke `/plan-design-review`
- User wants all reviews done automatically → invoke `/autoplan`
- User reports a bug, error, broken behavior, asks "why is this broken" → invoke `/investigate`
- User asks to test the site, find bugs, QA → invoke `/qa`
- User asks to review code, check the diff, pre-landing review → invoke `/review`
- User asks about visual polish, design audit of a live site → invoke `/design-review`
- User asks to ship, deploy, push, create a PR → invoke `/ship`
- User asks to update docs after shipping → invoke `/document-release`
- User asks for a weekly retro, what did we ship → invoke `/retro`
- User asks for a second opinion, codex review → invoke `/codex`
- User asks for safety mode, careful mode → invoke `/careful` or `/guard`
- User asks to restrict edits to a directory → invoke `/freeze` or `/unfreeze`
- User asks to upgrade gstack → invoke `/gstack-upgrade`

**Do NOT answer the user's question directly when a matching skill exists.** The skill
provides a structured, multi-step workflow that is always better than an ad-hoc answer.
Invoke the skill first. If no skill matches, answer directly as usual.

If the user opts out of suggestions, run `gstack-config set proactive false`.
If they opt back in, run `gstack-config set proactive true`.

# gstack browse: QA Testing & Dogfooding

Persistent headless Chromium. First call auto-starts (~3s), then ~100-200ms per command.
Auto-shuts down after 30 min idle. State persists between calls (cookies, tabs, sessions).

## SETUP (run this check BEFORE any browse command)

```bash
_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
B=""
[ -n "$_ROOT" ] && [ -x "$_ROOT/.claude/skills/gstack/browse/dist/browse" ] && B="$_ROOT/.claude/skills/gstack/browse/dist/browse"
[ -z "$B" ] && B=~/.claude/skills/gstack/browse/dist/browse
if [ -x "$B" ]; then
  echo "READY: $B"
else
  echo "NEEDS_SETUP"
fi
```

If `NEEDS_SETUP`:
1. Tell the user: "gstack browse needs a one-time build (~10 seconds). OK to proceed?" Then STOP and wait.
2. Run: `cd <SKILL_DIR> && ./setup`
3. If `bun` is not installed: `curl -fsSL https://bun.sh/install | bash`

## IMPORTANT

- Use the compiled binary via Bash: `$B <command>`
- NEVER use `mcp__claude-in-chrome__*` tools. They are slow and unreliable.
- Browser persists between calls — cookies, login sessions, and tabs carry over.
- Dialogs (alert/confirm/prompt) are auto-accepted by default — no browser lockup.
- **Show screenshots:** After `$B screenshot`, `$B snapshot -a -o`, or `$B responsive`, always use the Read tool on the output PNG(s) so the user can see them. Without this, screenshots are invisible.

## QA Workflows

> **Credential safety:** Use environment variables for test credentials.
> Set them before running: `export TEST_EMAIL="..." TEST_PASSWORD="..."`

### Test a user flow (login, signup, checkout, etc.)

```bash
# 1. Go to the page
$B goto https://app.example.com/login

# 2. See what's interactive
$B snapshot -i

# 3. Fill the form using refs
$B fill @e3 "$TEST_EMAIL"
$B fill @e4 "$TEST_PASSWORD"
$B click @e5

# 4. Verify it worked
$B snapshot -D              # diff shows what changed after clicking
$B is visible ".dashboard"  # assert the dashboard appeared
$B screenshot /tmp/after-login.png
```

### Verify a deployment / check prod

```bash
$B goto https://yourapp.com
$B text                          # read the page — does it load?
$B console                       # any JS errors?
$B network                       # any failed requests?
$B js "document.title"           # correct title?
$B is visible ".hero-section"    # key elements present?
$B screenshot /tmp/prod-check.png
```

### Dogfood a feature end-to-end

```bash
# Navigate to the feature
$B goto https://app.example.com/new-feature

# Take annotated screenshot — shows every interactive element with labels
$B snapshot -i -a -o /tmp/feature-annotated.png

# Find ALL clickable things (including divs with cursor:pointer)
$B snapshot -C

# Walk through the flow
$B snapshot -i          # baseline
$B click @e3            # interact
$B snapshot -D          # what changed? (unified diff)

# Check element states
$B is visible ".success-toast"
$B is enabled "#next-step-btn"
$B is checked "#agree-checkbox"

# Check console for errors after interactions
$B console
```

### Test responsive layouts

```bash
# Quick: 3 screenshots at mobile/tablet/desktop
$B goto https://yourapp.com
$B responsive /tmp/layout

# Manual: specific viewport
$B viewport 375x812     # iPhone
$B screenshot /tmp/mobile.png
$B viewport 1440x900    # Desktop
$B screenshot /tmp/desktop.png

# Element screenshot (crop to specific element)
$B screenshot "#hero-banner" /tmp/hero.png
$B snapshot -i
$B screenshot @e3 /tmp/button.png

# Region crop
$B screenshot --clip 0,0,800,600 /tmp/above-fold.png

# Viewport only (no scroll)
$B screenshot --viewport /tmp/viewport.png
```

### Test file upload

```bash
$B goto https://app.example.com/upload
$B snapshot -i
$B upload @e3 /path/to/test-file.pdf
$B is visible ".upload-success"
$B screenshot /tmp/upload-result.png
```

### Test forms with validation

```bash
$B goto https://app.example.com/form
$B snapshot -i

# Submit empty — check validation errors appear
$B click @e10                        # submit button
$B snapshot -D                       # diff shows error messages appeared
$B is visible ".error-message"

# Fill and resubmit
$B fill @e3 "valid input"
$B click @e10
$B snapshot -D                       # diff shows errors gone, success state
```

### Test dialogs (delete confirmations, prompts)

```bash
# Set up dialog handling BEFORE triggering
$B dialog-accept              # will auto-accept next alert/confirm
$B click "#delete-button"     # triggers confirmation dialog
$B dialog                     # see what dialog appeared
$B snapshot -D                # verify the item was deleted

# For prompts that need input
$B dialog-accept "my answer"  # accept with text
$B click "#rename-button"     # triggers prompt
```

### Test authenticated pages (import real browser cookies)

```bash
# Import cookies from your real browser (opens interactive picker)
$B cookie-import-browser

# Or import a specific domain directly
$B cookie-import-browser comet --domain .github.com

# Now test authenticated pages
$B goto https://github.com/settings/profile
$B snapshot -i
$B screenshot /tmp/github-profile.png
```

> **Cookie safety:** `cookie-import-browser` transfers real session data.
> Only import cookies from browsers you control.

### Compare two pages / environments

```bash
$B diff https://staging.app.com https://prod.app.com
```

### Multi-step chain (efficient for long flows)

```bash
echo '[
  ["goto","https://app.example.com"],
  ["snapshot","-i"],
  ["fill","@e3","$TEST_EMAIL"],
  ["fill","@e4","$TEST_PASSWORD"],
  ["click","@e5"],
  ["snapshot","-D"],
  ["screenshot","/tmp/result.png"]
]' | $B chain
```

## Quick Assertion Patterns

```bash
# Element exists and is visible
$B is visible ".modal"

# Button is enabled/disabled
$B is enabled "#submit-btn"
$B is disabled "#submit-btn"

# Checkbox state
$B is checked "#agree"

# Input is editable
$B is editable "#name-field"

# Element has focus
$B is focused "#search-input"

# Page contains text
$B js "document.body.textContent.includes('Success')"

# Element count
$B js "document.querySelectorAll('.list-item').length"

# Specific attribute value
$B attrs "#logo"    # returns all attributes as JSON

# CSS property
$B css ".button" "background-color"
```

## Snapshot System

The snapshot is your primary tool for understanding and interacting with pages.

```
-i        --interactive           Interactive elements only (buttons, links, inputs) with @e refs. Also auto-enables cursor-interactive scan (-C) to capture dropdowns and popovers.
-c        --compact               Compact (no empty structural nodes)
-d <N>    --depth                 Limit tree depth (0 = root only, default: unlimited)
-s <sel>  --selector              Scope to CSS selector
-D        --diff                  Unified diff against previous snapshot (first call stores baseline)
-a        --annotate              Annotated screenshot with red overlay boxes and ref labels
-o <path> --output                Output path for annotated screenshot (default: <temp>/browse-annotated.png)
-C        --cursor-interactive    Cursor-interactive elements (@c refs — divs with pointer, onclick). Auto-enabled when -i is used.
```

All flags can be combined freely. `-o` only applies when `-a` is also used.
Example: `$B snapshot -i -a -C -o /tmp/annotated.png`

**Ref numbering:** @e refs are assigned sequentially (@e1, @e2, ...) in tree order.
@c refs from `-C` are numbered separately (@c1, @c2, ...).

After snapshot, use @refs as selectors in any command:
```bash
$B click @e3       $B fill @e4 "value"     $B hover @e1
$B html @e2        $B css @e5 "color"      $B attrs @e6
$B click @c1       # cursor-interactive ref (from -C)
```

**Output format:** indented accessibility tree with @ref IDs, one element per line.
```
  @e1 [heading] "Welcome" [level=1]
  @e2 [textbox] "Email"
  @e3 [button] "Submit"
```

Refs are invalidated on navigation — run `snapshot` again after `goto`.

## Command Reference

### Navigation
| Command | Description |
|---------|-------------|
| `back` | History back |
| `forward` | History forward |
| `goto <url>` | Navigate to URL |
| `reload` | Reload page |
| `url` | Print current URL |

### Reading
| Command | Description |
|---------|-------------|
| `accessibility` | Full ARIA tree |
| `data [--jsonld|--og|--meta|--twitter]` | Structured data: JSON-LD, Open Graph, Twitter Cards, meta tags |
| `forms` | Form fields as JSON |
| `html [selector]` | innerHTML of selector (throws if not found), or full page HTML if no selector given |
| `links` | All links as "text → href" |
| `media [--images|--videos|--audio] [selector]` | All media elements (images, videos, audio) with URLs, dimensions, types |
| `text` | Cleaned page text |

### Interaction
| Command | Description |
|---------|-------------|
| `cleanup [--ads] [--cookies] [--sticky] [--social] [--all]` | Remove page clutter (ads, cookie banners, sticky elements, social widgets) |
| `click <sel>` | Click element |
| `cookie <name>=<value>` | Set cookie on current page domain |
| `cookie-import <json>` | Import cookies from JSON file |
| `cookie-import-browser [browser] [--domain d]` | Import cookies from installed Chromium browsers (opens picker, or use --domain for direct import) |
| `dialog-accept [text]` | Auto-accept next alert/confirm/prompt. Optional text is sent as the prompt response |
| `dialog-dismiss` | Auto-dismiss next dialog |
| `fill <sel> <val>` | Fill input |
| `header <name>:<value>` | Set custom request header (colon-separated, sensitive values auto-redacted) |
| `hover <sel>` | Hover element |
| `press <key>` | Press key — Enter, Tab, Escape, ArrowUp/Down/Left/Right, Backspace, Delete, Home, End, PageUp, PageDown, or modifiers like Shift+Enter |
| `scroll [sel]` | Scroll element into view, or scroll to page bottom if no selector |
| `select <sel> <val>` | Select dropdown option by value, label, or visible text |
| `style <sel> <prop> <value> | style --undo [N]` | Modify CSS property on element (with undo support) |
| `type <text>` | Type into focused element |
| `upload <sel> <file> [file2...]` | Upload file(s) |
| `useragent <string>` | Set user agent |
| `viewport <WxH>` | Set viewport size |
| `wait <sel|--networkidle|--load>` | Wait for element, network idle, or page load (timeout: 15s) |

### Inspection
| Command | Description |
|---------|-------------|
| `attrs <sel|@ref>` | Element attributes as JSON |
| `console [--clear|--errors]` | Console messages (--errors filters to error/warning) |
| `cookies` | All cookies as JSON |
| `css <sel> <prop>` | Computed CSS value |
| `dialog [--clear]` | Dialog messages |
| `eval <file>` | Run JavaScript from file and return result as string (path must be under /tmp or cwd) |
| `inspect [selector] [--all] [--history]` | Deep CSS inspection via CDP — full rule cascade, box model, computed styles |
| `is <prop> <sel>` | State check (visible/hidden/enabled/disabled/checked/editable/focused) |
| `js <expr>` | Run JavaScript expression and return result as string |
| `network [--clear]` | Network requests |
| `perf` | Page load timings |
| `storage [set k v]` | Read all localStorage + sessionStorage as JSON, or set <key> <value> to write localStorage |

### Visual
| Command | Description |
|---------|-------------|
| `diff <url1> <url2>` | Text diff between pages |
| `pdf [path]` | Save as PDF |
| `prettyscreenshot [--scroll-to sel|text] [--cleanup] [--hide sel...] [--width px] [path]` | Clean screenshot with optional cleanup, scroll positioning, and element hiding |
| `responsive [prefix]` | Screenshots at mobile (375x812), tablet (768x1024), desktop (1280x720). Saves as {prefix}-mobile.png etc. |
| `screenshot [--viewport] [--clip x,y,w,h] [selector|@ref] [path]` | Save screenshot (supports element crop via CSS/@ref, --clip region, --viewport) |

### Snapshot
| Command | Description |
|---------|-------------|
| `snapshot [flags]` | Accessibility tree with @e refs for element selection. Flags: -i interactive only, -c compact, -d N depth limit, -s sel scope, -D diff vs previous, -a annotated screenshot, -o path output, -C cursor-interactive @c refs |

### Meta
| Command | Description |
|---------|-------------|
| `chain` | Run commands from JSON stdin. Format: [["cmd","arg1",...],...] |
| `frame <sel|@ref|--name n|--url pattern|main>` | Switch to iframe context (or main to return) |
| `inbox [--clear]` | List messages from sidebar scout inbox |
| `watch [stop]` | Passive observation — periodic snapshots while user browses |

### Tabs
| Command | Description |
|---------|-------------|
| `closetab [id]` | Close tab |
| `newtab [url]` | Open new tab |
| `tab <id>` | Switch to tab |
| `tabs` | List open tabs |

### Server
| Command | Description |
|---------|-------------|
| `connect` | Launch headed Chromium with Chrome extension |
| `disconnect` | Disconnect headed browser, return to headless mode |
| `focus [@ref]` | Bring headed browser window to foreground (macOS) |
| `handoff [message]` | Open visible Chrome at current page for user takeover |
| `restart` | Restart server |
| `resume` | Re-snapshot after user takeover, return control to AI |
| `state save|load <name>` | Save/load browser state (cookies + URLs) |
| `status` | Health check |
| `stop` | Shutdown server |

## Tips

1. **Navigate once, query many times.** `goto` loads the page; then `text`, `js`, `screenshot` all hit the loaded page instantly.
2. **Use `snapshot -i` first.** See all interactive elements, then click/fill by ref. No CSS selector guessing.
3. **Use `snapshot -D` to verify.** Baseline → action → diff. See exactly what changed.
4. **Use `is` for assertions.** `is visible .modal` is faster and more reliable than parsing page text.
5. **Use `snapshot -a` for evidence.** Annotated screenshots are great for bug reports.
6. **Use `snapshot -C` for tricky UIs.** Finds clickable divs that the accessibility tree misses.
7. **Check `console` after actions.** Catch JS errors that don't surface visually.
8. **Use `chain` for long flows.** Single command, no per-step CLI overhead.
