---
name: qa
version: 2.0.0
description: |
  系统地对Web应用进行QA测试并修复发现的bug。运行QA测试，
  然后迭代修复源代码中的bug，每次修复都进行原子提交并重新验证。
  当用户要求"qa"、"QA"、"测试这个网站"、"找bug"、"测试并修复"或"修复坏了的部分"时使用。
  三个级别：快速（仅关键/高优先级）、标准（+中优先级）、全面（+低优先级/美化）。
  生成前后健康评分、修复证据和发布就绪摘要。如需仅报告模式，请使用/qa-only。
allowed-tools:
  - RunCommand
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---
<!-- AUTO-GENERATED from SKILL.cn.md.tmpl — do not edit directly -->
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

## Step 0: Detect base branch

Determine which branch this PR targets. Use the result as "the base branch" in all subsequent steps.

1. Check if a PR already exists for this branch:
   `gh pr view --json baseRefName -q .baseRefName`
   If this succeeds, use the printed branch name as the base branch.

2. If no PR exists (command fails), detect the repo's default branch:
   `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`

3. If both commands fail, fall back to `main`.

Print the detected base branch name. In every subsequent `git diff`, `git log`,
`git fetch`, `git merge`, and `gh pr create` command, substitute the detected
branch name wherever the instructions say "the base branch."

---

# /qa: 测试 → 修复 → 验证

您是一名QA工程师和bug修复工程师。像真实用户一样测试Web应用——点击所有内容、填写所有表单、检查所有状态。
当发现bug时，在源代码中修复它们并进行原子提交，然后重新验证。生成包含前后证据的结构化报告。

## 设置

**解析用户请求中的这些参数：**

| 参数 | 默认值 | 覆盖示例 |
|------|---------|---------:|
| 目标URL | (自动检测或必填) | `https://myapp.com`, `http://localhost:3000` |
| 级别 | 标准 | `--quick`, `--exhaustive` |
| 模式 | 完整 | `--regression .trae/qa-reports/baseline.json` |
| 输出目录 | `.trae/qa-reports/` | `输出到 /tmp/qa` |
| 范围 | 完整应用（或基于差异） | `专注于 billing 页面` |
| 认证 | 无 | `以user@example.com登录`, `从cookies.json导入cookies` |

**不同级别决定修复哪些问题：**
- **快速：** 仅修复关键和高优先级问题
- **标准：** + 中优先级（默认）
- **全面：** + 低优先级/美化问题

**如果未提供URL且您在功能分支上：** 自动进入**差异感知模式**（见下方模式）。
这是最常见的情况——用户刚在分支上提交了代码并想要验证它是否工作正常。

**开始前要求工作目录干净：**
```bash
if [ -n "$(git status --porcelain)" ]; then
  echo "错误：工作目录不干净。运行/qa前请提交或暂存更改。"
  exit 1
fi
```

**创建输出目录：**

```bash
mkdir -p .trae/qa-reports/screenshots
```

---

## 测试计划上下文

在回退到git差异启发式之前，检查更丰富的测试计划来源：

1. **项目范围的测试计划：** 检查项目中是否有最近的`*-test-plan-*.md`文件
   ```bash
   ls -t ./.trae/test-plans/*-test-plan-*.md 2>/dev/null | head -1
   ```
2. **对话上下文：** 检查是否有之前的计划审查在本次对话中产生了测试计划输出
3. **使用更丰富的来源。** 只有当两者都不可用时，才回退到git差异分析。

---

## 阶段1-6：QA基线

## Modes

### Diff-aware (automatic when on a feature branch with no URL)

This is the **primary mode** for developers verifying their work. When the user says `/qa` without a URL and the repo is on a feature branch, automatically:

1. **Analyze the branch diff** to understand what changed:
   ```bash
   git diff main...HEAD --name-only
   git log main..HEAD --oneline
   ```

2. **Identify affected pages/routes** from the changed files:
   - Controller/route files → which URL paths they serve
   - View/template/component files → which pages render them
   - Model/service files → which pages use those models (check controllers that reference them)
   - CSS/style files → which pages include those stylesheets
   - API endpoints → test them directly with `$B js "await fetch('/api/...')"`
   - Static pages (markdown, HTML) → navigate to them directly

3. **Detect the running app** — check common local dev ports:
   ```bash
   $B goto http://localhost:3000 2>/dev/null && echo "Found app on :3000" || \
   $B goto http://localhost:4000 2>/dev/null && echo "Found app on :4000" || \
   $B goto http://localhost:8080 2>/dev/null && echo "Found app on :8080"
   ```
   If no local app is found, check for a staging/preview URL in the PR or environment. If nothing works, ask the user for the URL.

4. **Test each affected page/route:**
   - Navigate to the page
   - Take a screenshot
   - Check console for errors
   - If the change was interactive (forms, buttons, flows), test the interaction end-to-end
   - Use `snapshot -D` before and after actions to verify the change had the expected effect

5. **Cross-reference with commit messages and PR description** to understand *intent* — what should the change do? Verify it actually does that.

6. **Check TODOS.md** (if it exists) for known bugs or issues related to the changed files. If a TODO describes a bug that this branch should fix, add it to your test plan. If you find a new bug during QA that isn't in TODOS.md, note it in the report.

7. **Report findings** scoped to the branch changes:
   - "Changes tested: N pages/routes affected by this branch"
   - For each: does it work? Screenshot evidence.
   - Any regressions on adjacent pages?

**If the user provides a URL with diff-aware mode:** Use that URL as the base but still scope testing to the changed files.

### Full (default when URL is provided)
Systematic exploration. Visit every reachable page. Document 5-10 well-evidenced issues. Produce health score. Takes 5-15 minutes depending on app size.

### Quick (`--quick`)
30-second smoke test. Visit homepage + top 5 navigation targets. Check: page loads? Console errors? Broken links? Produce health score. No detailed issue documentation.

### Regression (`--regression <baseline>`)
Run full mode, then load `baseline.json` from a previous run. Diff: which issues are fixed? Which are new? What's the score delta? Append regression section to report.

---

## Workflow

### Phase 1: Initialize

1. Find browse binary (see Setup above)
2. Create output directories
3. Copy report template from `qa/templates/qa-report-template.md` to output dir
4. Start timer for duration tracking

### Phase 2: Authenticate (if needed)

**If the user specified auth credentials:**

```bash
$B goto <login-url>
$B snapshot -i                    # find the login form
$B fill @e3 "user@example.com"
$B fill @e4 "[REDACTED]"         # NEVER include real passwords in report
$B click @e5                      # submit
$B snapshot -D                    # verify login succeeded
```

**If the user provided a cookie file:**

```bash
$B cookie-import cookies.json
$B goto <target-url>
```

**If 2FA/OTP is required:** Ask the user for the code and wait.

**If CAPTCHA blocks you:** Tell the user: "Please complete the CAPTCHA in the browser, then tell me to continue."

### Phase 3: Orient

Get a map of the application:

```bash
$B goto <target-url>
$B snapshot -i -a -o "$REPORT_DIR/screenshots/initial.png"
$B links                          # map navigation structure
$B console --errors               # any errors on landing?
```

**Detect framework** (note in report metadata):
- `__next` in HTML or `_next/data` requests → Next.js
- `csrf-token` meta tag → Rails
- `wp-content` in URLs → WordPress
- Client-side routing with no page reloads → SPA

**For SPAs:** The `links` command may return few results because navigation is client-side. Use `snapshot -i` to find nav elements (buttons, menu items) instead.

### Phase 4: Explore

Visit pages systematically. At each page:

```bash
$B goto <page-url>
$B snapshot -i -a -o "$REPORT_DIR/screenshots/page-name.png"
$B console --errors
```

Then follow the **per-page exploration checklist** (see `qa/references/issue-taxonomy.md`):

1. **Visual scan** — Look at the annotated screenshot for layout issues
2. **Interactive elements** — Click buttons, links, controls. Do they work?
3. **Forms** — Fill and submit. Test empty, invalid, edge cases
4. **Navigation** — Check all paths in and out
5. **States** — Empty state, loading, error, overflow
6. **Console** — Any new JS errors after interactions?
7. **Responsiveness** — Check mobile viewport if relevant:
   ```bash
   $B viewport 375x812
   $B screenshot "$REPORT_DIR/screenshots/page-mobile.png"
   $B viewport 1280x720
   ```

**Depth judgment:** Spend more time on core features (homepage, dashboard, checkout, search) and less on secondary pages (about, terms, privacy).

**Quick mode:** Only visit homepage + top 5 navigation targets from the Orient phase. Skip the per-page checklist — just check: loads? Console errors? Broken links visible?

### Phase 5: Document

Document each issue **immediately when found** — don't batch them.

**Two evidence tiers:**

**Interactive bugs** (broken flows, dead buttons, form failures):
1. Take a screenshot before the action
2. Perform the action
3. Take a screenshot showing the result
4. Use `snapshot -D` to show what changed
5. Write repro steps referencing screenshots

```bash
$B screenshot "$REPORT_DIR/screenshots/issue-001-step-1.png"
$B click @e5
$B screenshot "$REPORT_DIR/screenshots/issue-001-result.png"
$B snapshot -D
```

**Static bugs** (typos, layout issues, missing images):
1. Take a single annotated screenshot showing the problem
2. Describe what's wrong

```bash
$B snapshot -i -a -o "$REPORT_DIR/screenshots/issue-002.png"
```

**Write each issue to the report immediately** using the template format from `qa/templates/qa-report-template.md`.

### Phase 6: Wrap Up

1. **Compute health score** using the rubric below
2. **Write "Top 3 Things to Fix"** — the 3 highest-severity issues
3. **Write console health summary** — aggregate all console errors seen across pages
4. **Update severity counts** in the summary table
5. **Fill in report metadata** — date, duration, pages visited, screenshot count, framework
6. **Save baseline** — write `baseline.json` with:
   ```json
   {
     "date": "YYYY-MM-DD",
     "url": "<target>",
     "healthScore": N,
     "issues": [{ "id": "ISSUE-001", "title": "...", "severity": "...", "category": "..." }],
     "categoryScores": { "console": N, "links": N, ... }
   }
   ```

**Regression mode:** After writing the report, load the baseline file. Compare:
- Health score delta
- Issues fixed (in baseline but not current)
- New issues (in current but not baseline)
- Append the regression section to the report

---

## Health Score Rubric

Compute each category score (0-100), then take the weighted average.

### Console (weight: 15%)
- 0 errors → 100
- 1-3 errors → 70
- 4-10 errors → 40
- 10+ errors → 10

### Links (weight: 10%)
- 0 broken → 100
- Each broken link → -15 (minimum 0)

### Per-Category Scoring (Visual, Functional, UX, Content, Performance, Accessibility)
Each category starts at 100. Deduct per finding:
- Critical issue → -25
- High issue → -15
- Medium issue → -8
- Low issue → -3
Minimum 0 per category.

### Weights
| Category | Weight |
|----------|--------|
| Console | 15% |
| Links | 10% |
| Visual | 10% |
| Functional | 20% |
| UX | 15% |
| Performance | 10% |
| Content | 5% |
| Accessibility | 15% |

### Final Score
`score = Σ (category_score × weight)`

---

## Framework-Specific Guidance

### Next.js
- Check console for hydration errors (`Hydration failed`, `Text content did not match`)
- Monitor `_next/data` requests in network — 404s indicate broken data fetching
- Test client-side navigation (click links, don't just `goto`) — catches routing issues
- Check for CLS (Cumulative Layout Shift) on pages with dynamic content

### Rails
- Check for N+1 query warnings in console (if development mode)
- Verify CSRF token presence in forms
- Test Turbo/Stimulus integration — do page transitions work smoothly?
- Check for flash messages appearing and dismissing correctly

### WordPress
- Check for plugin conflicts (JS errors from different plugins)
- Verify admin bar visibility for logged-in users
- Test REST API endpoints (`/wp-json/`)
- Check for mixed content warnings (common with WP)

### General SPA (React, Vue, Angular)
- Use `snapshot -i` for navigation — `links` command misses client-side routes
- Check for stale state (navigate away and back — does data refresh?)
- Test browser back/forward — does the app handle history correctly?
- Check for memory leaks (monitor console after extended use)

---

## Important Rules

1. **Repro is everything.** Every issue needs at least one screenshot. No exceptions.
2. **Verify before documenting.** Retry the issue once to confirm it's reproducible, not a fluke.
3. **Never include credentials.** Write `[REDACTED]` for passwords in repro steps.
4. **Write incrementally.** Append each issue to the report as you find it. Don't batch.
5. **Never read source code.** Test as a user, not a developer.
6. **Check console after every interaction.** JS errors that don't surface visually are still bugs.
7. **Test like a user.** Use realistic data. Walk through complete workflows end-to-end.
8. **Depth over breadth.** 5-10 well-documented issues with evidence > 20 vague descriptions.
9. **Never delete output files.** Screenshots and reports accumulate — that's intentional.
10. **Use `snapshot -C` for tricky UIs.** Finds clickable divs that the accessibility tree misses.

在阶段6结束时记录基线健康评分。

---

## 输出结构

```
.trae/qa-reports/
├── qa-report-{domain}-{YYYY-MM-DD}.md    # 结构化报告
├── screenshots/
│   ├── initial.png                        # 登录页面带注释截图
│   ├── issue-001-step-1.png               # 每个问题的证据
│   ├── issue-001-result.png
│   ├── issue-001-before.png               # 修复前（如果已修复）
│   ├── issue-001-after.png                # 修复后（如果已修复）
│   └── ...
└── baseline.json                          # 用于回归模式
```

报告文件名使用域名和日期：`qa-report-myapp-com-2026-03-12.md`

---

## 阶段7：分类

按严重程度对所有发现的问题进行排序，然后根据选定的级别决定修复哪些问题：

- **快速：** 仅修复关键+高优先级问题。将中/低优先级标记为"延后"。
- **标准：** 修复关键+高+中优先级问题。将低优先级标记为"延后"。
- **全面：** 修复所有问题，包括美化/低优先级问题。

将无法从源代码修复的问题（例如第三方小部件bug、基础设施问题）无论级别如何都标记为"延后"。

---

## 阶段8：修复循环

按严重程度顺序处理每个可修复的问题：

### 8a. 定位源代码

```bash
# 搜索错误消息、组件名称、路由定义
# 根据受影响页面的文件模式进行搜索
```

- 找到负责bug的源文件
- 仅修改与问题直接相关的文件

### 8b. 修复

- 阅读源代码，理解上下文
- 进行**最小修复**——解决问题的最小更改
- 不要重构周围代码、添加功能或"改进"不相关的内容

### 8c. 提交

```bash
git add <仅修改的文件>
git commit -m "fix(qa): ISSUE-NNN — 简短描述"
```

- 每个修复一个提交。永远不要将多个修复捆绑在一起。
- 消息格式：`fix(qa): ISSUE-NNN — 简短描述`

### 8d. 重新测试

- 导航回受影响的页面
- 拍摄**修复前后的截图对**
- 检查控制台是否有错误
- 使用适当的快照工具验证更改是否达到预期效果

### 8e. 分类

- **已验证：** 重新测试确认修复有效，未引入新错误
- **尽力修复：** 应用了修复但无法完全验证（例如需要认证状态、外部服务）
- **已回退：** 检测到回归 → `git revert HEAD` → 将问题标记为"延后"

### 8f. 自我调节（停止并评估）

每修复5个问题（或任何回退之后），计算WTF可能性：

```
WTF可能性：
  初始值：0%
  每次回退：+15%
  每次修复涉及>3个文件：+5%
  第15个修复后：每个额外修复+1%
  所有剩余低优先级问题：+10%
  修改不相关文件：+20%
```

**如果WTF > 20%：** 立即停止。向用户展示迄今为止的工作。询问是否继续。

**硬上限：50个修复。** 修复50个问题后，无论剩余多少问题都停止。

---

## 阶段9：最终QA

应用所有修复后：

1. 重新运行所有受影响页面的QA
2. 计算最终健康评分
3. **如果最终评分比基线差：** 突出警告——出现了回归

---

## 阶段10：报告

将报告写入本地位置：

**本地：** `.trae/qa-reports/qa-report-{domain}-{YYYY-MM-DD}.md`

**每个问题的补充信息**（标准报告模板之外）：
- 修复状态：已验证 / 尽力修复 / 已回退 / 延后
- 提交SHA（如果已修复）
- 更改的文件（如果已修复）
- 修复前后截图（如果已修复）

**摘要部分：**
- 发现的问题总数
- 应用的修复（已验证：X，尽力修复：Y，已回退：Z）
- 延后的问题
- 健康评分变化：基线 → 最终

**PR摘要：** 包含一个适合PR描述的单行摘要：
> "QA发现了N个问题，修复了M个，健康评分从X提升到Y。"

---

## 阶段11：TODOS.md更新

如果仓库有`TODOS.md`：

1. **新的延后bug** → 添加为TODO，包含严重性、类别和重现步骤
2. **已修复的TODOS.md中的bug** → 标注"由/qa在{分支}上修复，{日期}"

---

## 附加规则（qa特定）

11. **需要干净的工作目录。** 如果`git status --porcelain`非空，拒绝开始。
12. **每个修复一个提交。** 永远不要将多个修复合并到一个提交中。
13. **永远不要修改测试或CI配置。** 只修复应用程序源代码。
14. **回归时回退。** 如果修复使情况更糟，立即`git revert HEAD`。
15. **自我调节。** 遵循WTF可能性启发式。如有疑问，停止并询问。