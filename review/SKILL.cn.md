---
name: review
version: 1.0.0
description: |
  预上线PR审查。分析与基础分支的差异，检查SQL安全性、
  信任边界违规、条件副作用和其他结构性问题。
allowed-tools:
  - RunCommand
  - Read
  - Edit
  - Write
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

# 预上线PR审查

您正在运行 `/review` 工作流。分析当前分支与基础分支的差异，检查测试无法捕获的结构性问题。

---

## 步骤1：检查分支

1. 运行 `git branch --show-current` 获取当前分支。
2. 如果在基础分支上，输出：**"没有需要审查的内容 — 您在基础分支上或与基础分支没有差异。"** 并停止。
3. 运行 `git fetch origin <base> --quiet && git diff origin/<base> --stat` 检查是否有差异。如果没有差异，输出相同的消息并停止。

---

## 步骤2：读取检查清单

读取 `.trae/skills/review/checklist.md`。

**如果无法读取该文件，停止并报告错误。** 没有检查清单不得继续。

---

## 步骤3：获取差异

获取最新的基础分支以避免过时本地状态导致的误报：

```bash
git fetch origin <base> --quiet
```

运行 `git diff origin/<base>` 获取完整差异。这包括相对于最新基础分支的已提交和未提交更改。

---

## 步骤4：两次审查

针对差异应用检查清单，分两次进行：

1. **第一次（关键）：** SQL与数据安全、竞态条件与并发、信任边界、枚举与值完整性
2. **第二次（信息性）：** 条件副作用、魔术数字与字符串耦合、死代码与一致性、提示问题、测试缺口、视图/前端

**枚举与值完整性需要读取差异外的代码。** 当差异引入新的枚举值、状态、层级或类型常量时，使用Grep查找引用兄弟值的所有文件，然后读取这些文件以检查新值是否被处理。这是唯一需要超出差异范围审查的类别。

遵循检查清单中指定的输出格式。尊重抑制列表 — 不要标记"不要标记"部分列出的项目。

---

## 步骤5：输出发现

**始终输出所有发现** — 无论是关键的还是信息性的。用户必须看到每个问题。

- 如果发现关键问题：输出所有发现，然后对每个关键问题使用单独的AskUserQuestion，包含问题、`RECOMMENDATION: 选择A因为[一行理由]`以及选项（A：立即修复，B：确认，C：误报 — 跳过）。
  在回答所有关键问题后，输出用户对每个问题的选择摘要。如果用户在任何问题上选择A（修复），则应用建议的修复。如果只选择了B/C，则无需操作。
- 如果仅发现非关键问题：输出发现。无需进一步操作。
- 如果没有发现问题：输出 `预上线审查：未发现问题。`

---

## 步骤5.5：TODOS交叉引用

读取仓库根目录下的 `TODOS.md`（如果存在）。将PR与未完成的TODO交叉引用：

- **此PR是否关闭任何未完成的TODO？** 如果是，在输出中注明："此PR解决了TODO：<标题>"
- **此PR是否创建了应成为TODO的工作？** 如果是，将其标记为信息性发现。
- **是否有提供此审查上下文的相关TODO？** 如果是，在讨论相关发现时引用它们。

如果TODOS.md不存在，静默跳过此步骤。

---

## 步骤5.6：文档陈旧性检查

将差异与文档文件交叉引用。对于仓库根目录中的每个 `.md` 文件（README.md、ARCHITECTURE.md、CONTRIBUTING.md等）：

1. 检查差异中的代码更改是否影响该文档中描述的功能、组件或工作流。
2. 如果该文档文件在此分支中未更新，但其描述的代码已更改，则将其标记为信息性发现：
   "文档可能过时：[文件]描述了[功能/组件]，但此分支中的代码已更改。请考虑运行 `/document-release`。"

这仅为信息性 — 永远不会是关键问题。修复操作是 `/document-release`。

如果没有文档文件，静默跳过此步骤。

---

## 重要规则

- **在评论前阅读完整差异。** 不要标记差异中已解决的问题。
- **默认只读。** 只有当用户明确选择对关键问题"立即修复"时，才修改文件。永远不要提交、推送或创建PR。
- **简洁明了。** 一行问题，一行修复。没有前言。
- **只标记真正的问题。** 跳过一切正常的内容。