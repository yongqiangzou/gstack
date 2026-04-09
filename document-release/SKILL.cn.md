---
name: document-release
version: 1.0.0
description: |
  发布后文档更新。读取所有项目文档，与差异交叉引用，
  更新README/ARCHITECTURE/CONTRIBUTING/CLAUDE.md以匹配已发布内容，
  润色CHANGELOG语气，清理TODOS，并可选择升级VERSION。
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
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

# Document Release：发布后文档更新

你正在运行 `/document-release` 工作流。此工作流在 `/ship` **之后**运行（代码已提交，PR已存在或即将存在），但在**PR合并之前**。你的任务：确保项目中的每个文档文件都是准确的、最新的，并以友好、以用户为中心的语气编写。

你大部分是自动化的。直接进行明显的事实性更新。只在有风险或主观性决策时停下来询问。

**只在以下情况停止：**
- 有风险/有疑问的文档变更（叙述、理念、安全、删除、大规模重写）
- VERSION升级决策（如果尚未升级）
- 需要添加的新TODOS项目
- 叙述性（非事实性）的跨文档矛盾

**永远不要停止：**
- 差异中明确的事实性更正
- 向表格/列表添加项目
- 更新路径、数量、版本号
- 修复过时的交叉引用
- CHANGELOG语气润色（轻微措辞调整）
- 标记TODOS为已完成
- 跨文档事实性不一致（例如版本号不匹配）

**绝对不要：**
- 覆盖、替换或重新生成CHANGELOG条目 — 只润色措辞，保留所有内容
- 不询问就升级VERSION — 版本变更始终使用AskUserQuestion
- 对CHANGELOG.md使用 `Write` 工具 — 始终使用带精确 `old_string` 匹配的 `Edit`

---

## 步骤1：预检与差异分析

1. 检查当前分支。如果在基础分支上，**中止**："你在基础分支上。请从功能分支运行。"

2. 收集变更内容的上下文：

```bash
git diff <base>...HEAD --stat
```

```bash
git log <base>..HEAD --oneline
```

```bash
git diff <base>...HEAD --name-only
```

3. 发现仓库中的所有文档文件：

```bash
find . -maxdepth 2 -name "*.md" -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./.gstack/*" -not -path "./.context/*" | sort
```

4. 将变更分类为与文档相关的类别：
   - **新功能** — 新文件、新命令、新技能、新能力
   - **行为变更** — 修改的服务、更新的API、配置变更
   - **移除的功能** — 删除的文件、移除的命令
   - **基础设施** — 构建系统、测试基础设施、CI

5. 输出简短摘要："正在分析N个变更文件，跨M个提交。发现K个文档文件需要审查。"

---

## 步骤2：逐文件文档审计

读取每个文档文件并与差异交叉引用。使用以下通用启发式方法（适应你所在的任何项目 — 这些不是gstack特定的）：

**README.md：**
- 它是否描述了差异中可见的所有功能和能力？
- 安装/设置说明是否与变更一致？
- 示例、演示和使用说明是否仍然有效？
- 故障排除步骤是否仍然准确？

**ARCHITECTURE.md：**
- ASCII图表和组件描述是否与当前代码匹配？
- 设计决策和"为什么"的解释是否仍然准确？
- 保守处理 — 只更新差异明确矛盾的内容。

**CONTRIBUTING.md — 新贡献者冒烟测试：**
- 像全新贡献者一样逐步执行设置说明。
- 列出的命令是否准确？每个步骤是否会成功？
- 测试层描述是否与当前测试基础设施匹配？
- 工作流描述（开发设置、贡献者模式等）是否是最新的？

**CLAUDE.md / 项目说明：**
- 项目结构部分是否与实际文件树匹配？
- 列出的命令和脚本是否准确？
- 构建/测试说明是否与package.json（或等效文件）中的内容匹配？

**任何其他.md文件：**
- 读取文件，确定其目的和受众。
- 与差异交叉引用，检查是否与文件所说的内容有矛盾。

对每个文件，将所需更新分类为：

- **自动更新** — 差异明确需要的事实性更正：向表格添加项目、更新文件路径、修复数量、更新项目结构树。
- **询问用户** — 叙述性变更、删除部分、安全模型变更、大规模重写（一个部分超过约10行）、相关性不明确、添加全新部分。

---

## 步骤3：应用自动更新

使用Edit工具直接进行所有明确的事实性更新。

对每个修改的文件，输出一行摘要描述**具体变更内容** — 不只是"更新了README.md"，而是"README.md：将/new-skill添加到技能表，将技能数量从9更新为10。"

**永远不要自动更新：**
- README介绍或项目定位
- ARCHITECTURE理念或设计原理
- 安全模型描述
- 不要从任何文档中删除整个部分

---

## 步骤4：询问有风险/有疑问的变更

对步骤2中识别的每个有风险或有疑问的更新，使用AskUserQuestion：
- 上下文：项目名称、分支、哪个文档文件、我们在审查什么
- 具体的文档决策
- `建议：选择[X]，因为[一行原因]`
- 选项包括C) 跳过 — 保持原样

每次回答后立即应用已批准的变更。

---

## 步骤5：CHANGELOG语气润色

**关键 — 永远不要覆盖CHANGELOG条目。**

此步骤润色语气。它不重写、替换或重新生成CHANGELOG内容。

**规则：**
1. 首先读取整个CHANGELOG.md。了解已有的内容。
2. 只修改现有条目中的措辞。永远不要删除、重新排序或替换条目。
3. 永远不要从头重新生成CHANGELOG条目。
4. 如果条目看起来有误或不完整，使用AskUserQuestion — 不要静默修复。
5. 使用带精确 `old_string` 匹配的Edit工具 — 永远不要使用Write覆盖CHANGELOG.md。

**如果CHANGELOG在此分支中未被修改：** 跳过此步骤。

**如果CHANGELOG在此分支中被修改**，审查条目的语气：

- **销售测试：** 用户读到每个要点时会想"哦不错，我想试试"吗？如果不会，重写措辞（不是内容）。
- 以用户现在**能做什么**为开头 — 不是实现细节。
- "你现在可以..." 而不是 "重构了..."
- 内部/贡献者变更属于单独的"### 贡献者"子部分。

---

## 步骤6：跨文档一致性与可发现性检查

逐个审计每个文件后，进行跨文档一致性检查：

1. README的功能/能力列表是否与CLAUDE.md（或项目说明）描述的内容匹配？
2. ARCHITECTURE的组件列表是否与CONTRIBUTING的项目结构描述匹配？
3. CHANGELOG的最新版本是否与VERSION文件匹配？
4. **可发现性：** 每个文档文件是否可以从README.md或CLAUDE.md访问到？如果ARCHITECTURE.md存在但README和CLAUDE.md都没有链接到它，标记出来。
5. 标记文档之间的任何矛盾。自动修复明确的事实性不一致（例如版本号不匹配）。对叙述性矛盾使用AskUserQuestion。

---

## 步骤7：TODOS.md清理

如果TODOS.md不存在，跳过此步骤。

1. **尚未标记的已完成项目：** 将差异与未完成的TODO项目交叉引用。如果TODO被此分支的变更明确完成，将其移到Completed部分，追加 `**Completed:** vX.Y.Z.W (YYYY-MM-DD)`。保守处理。

2. **需要描述更新的项目：** 如果TODO引用了被重大修改的文件或组件，使用AskUserQuestion确认是否应该更新、完成或保持原样。

3. **新的延期工作：** 检查差异中的 `TODO`、`FIXME`、`HACK` 和 `XXX` 注释。对于代表有意义的延期工作的注释，使用AskUserQuestion询问是否应该在TODOS.md中记录。

---

## 步骤8：VERSION升级问题

**关键 — 永远不要不询问就升级VERSION。**

1. **如果VERSION不存在：** 静默跳过。

2. 检查VERSION是否已在此分支上修改：

```bash
git diff <base>...HEAD -- VERSION
```

3. **如果VERSION未升级：** 使用AskUserQuestion：
   - 建议：选择C（跳过），因为纯文档变更很少需要版本升级
   - A) 升级PATCH (X.Y.Z+1) — 如果文档变更与代码变更一起发布
   - B) 升级MINOR (X.Y+1.0) — 如果这是重要的独立发布
   - C) 跳过 — 不需要版本升级

4. **如果VERSION已升级：** 检查升级是否涵盖了此分支上变更的完整范围。如果有重大未覆盖的变更，使用AskUserQuestion。

---

## 步骤9：提交与输出

**首先检查是否为空：** 运行 `git status`（不要使用 `-uall`）。如果前面步骤没有修改任何文档文件，输出"所有文档都是最新的。"并退出，不提交。

**提交：**

1. 按名称暂存修改的文档文件（不要使用 `git add -A` 或 `git add .`）。
2. 创建单个提交：

```bash
git commit -m "$(cat <<'EOF'
docs: update project documentation for vX.Y.Z.W

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

3. 推送到当前分支：

```bash
git push
```

**PR正文更新（幂等，竞争安全）：**

1. 将现有PR正文读入临时文件：

```bash
gh pr view --json body -q .body > /tmp/gstack-pr-body-$$.md
```

2. 如果临时文件已包含 `## Documentation` 部分，用更新内容替换该部分。如果不包含，在末尾追加 `## Documentation` 部分。

3. Documentation部分应包含**文档差异预览** — 对每个修改的文件，描述具体变更内容。

4. 将更新后的正文写回：

```bash
gh pr edit --body-file /tmp/gstack-pr-body-$$.md
```

5. 清理临时文件：

```bash
rm -f /tmp/gstack-pr-body-$$.md
```

6. 如果 `gh pr view` 失败（没有PR）：跳过并提示"未找到PR — 跳过正文更新。"
7. 如果 `gh pr edit` 失败：警告"无法更新PR正文 — 文档变更在提交中。"并继续。

**结构化文档健康摘要（最终输出）：**

输出显示每个文档文件状态的可扫描摘要：

```
文档健康状况：
  README.md       [状态] ([详情])
  ARCHITECTURE.md [状态] ([详情])
  CONTRIBUTING.md [状态] ([详情])
  CHANGELOG.md    [状态] ([详情])
  TODOS.md        [状态] ([详情])
  VERSION         [状态] ([详情])
```

状态为以下之一：
- 已更新 — 描述变更内容
- 当前 — 无需变更
- 语气已润色 — 措辞已调整
- 未升级 — 用户选择跳过
- 已升级 — 版本由/ship设置
- 已跳过 — 文件不存在

---

## 重要规则

- **编辑前先读取。** 修改文件前始终读取其完整内容。
- **永远不要覆盖CHANGELOG。** 只润色措辞。永远不要删除、替换或重新生成条目。
- **永远不要静默升级VERSION。** 始终询问。即使已升级，也要检查是否涵盖了变更的完整范围。
- **明确说明变更内容。** 每次编辑都有一行摘要。
- **通用启发式，不是项目特定的。** 审计检查适用于任何仓库。
- **可发现性很重要。** 每个文档文件都应该可以从README或CLAUDE.md访问到。
- **语气：友好、以用户为中心，不晦涩。** 像向没有看过代码的聪明人解释一样写作。
