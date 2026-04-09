---
name: retro
version: 2.0.0
description: |
  每周工程回顾。分析提交历史、工作模式和代码质量指标，
  支持持久化历史记录和趋势跟踪。团队感知：按人员分解贡献，
  提供表扬和成长领域建议。
allowed-tools:
  - RunCommand
  - Read
  - Write
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

## 检测默认分支

在收集数据前，检测仓库的默认分支名称：
`gh repo view --json defaultBranchRef -q .defaultBranchRef.name`

如果失败，回退到 `main`。在以下说明中，将使用检测到的分支名称替代 `origin/<default>`。

---

# /retro — 每周工程回顾

生成全面的工程回顾报告，分析提交历史、工作模式和代码质量指标。团队感知：识别运行命令的用户，然后分析每位贡献者的工作，提供个人表扬和成长机会。专为使用Trae IDE的高级IC/CTO级别的开发者设计。

## 用户可调用
当用户输入 `/retro` 时，运行此技能。

## 参数
- `/retro` — 默认：最近7天
- `/retro 24h` — 最近24小时
- `/retro 14d` — 最近14天
- `/retro 30d` — 最近30天
- `/retro compare` — 比较当前窗口与上一个相同长度的窗口
- `/retro compare 14d` — 使用明确的窗口进行比较

## 说明

解析参数以确定时间窗口。如果未提供参数，默认使用7天。对于git log查询，使用 `--since="N days ago"`、`--since="N hours ago"` 或 `--since="N weeks ago"`（对于 `w` 单位）。所有时间均以**太平洋时间**报告（转换时间戳时使用 `TZ=America/Los_Angeles`）。

**参数验证：** 如果参数不匹配数字后跟 `d`、`h` 或 `w`，不匹配单词 `compare`，也不匹配 `compare` 后跟数字和 `d`/`h`/`w`，则显示以下用法并停止：
```
用法：/retro [窗口]
  /retro              — 最近7天（默认）
  /retro 24h          — 最近24小时
  /retro 14d          — 最近14天
  /retro 30d          — 最近30天
  /retro compare      — 比较此期间与上一期间
  /retro compare 14d  — 使用明确的窗口进行比较
```

### 步骤1：收集原始数据

首先，获取origin并识别当前用户：
```bash
git fetch origin <default> --quiet
# 识别谁在运行回顾

git config user.name
git config user.email
```

`git config user.name` 返回的名称是 **"您"** — 阅读此回顾的人。所有其他作者都是队友。用此来定位叙事："您的"提交与队友的贡献。

并行运行所有这些git命令（它们是独立的）：

```bash
# 1. 窗口内的所有提交，包含时间戳、主题、哈希、作者、更改的文件、插入数、删除数
git log origin/<default> --since="<window>" --format="%H|%aN|%ae|%ai|%s" --shortstat

# 2. 每个提交的测试与总LOC细分，包含作者
#    每个提交块以 COMMIT:<hash>|<author> 开头，后跟numstat行。
#    将测试文件（匹配 test/|spec/|__tests__/）与生产文件分开。
git log origin/<default> --since="<window>" --format="COMMIT:%H|%aN" --numstat

# 3. 用于会话检测和小时分布的提交时间戳（包含作者）
#    使用 TZ=America/Los_Angeles 进行太平洋时间转换
TZ=America/Los_Angeles git log origin/<default> --since="<window>" --format="%at|%aN|%ai|%s" | sort -n

# 4. 最常更改的文件（热点分析）
git log origin/<default> --since="<window>" --format="" --name-only | grep -v '^$' | sort | uniq -c | sort -rn

# 5. 从提交消息中提取的PR编号（提取 #NNN 模式）
git log origin/<default> --since="<window>" --format="%s" | grep -oE '#[0-9]+' | sed 's/^#//' | sort -n | uniq | sed 's/^/#/'

# 6. 按作者的文件热点（谁接触了什么）
git log origin/<default> --since="<window>" --format="AUTHOR:%aN" --name-only

# 7. 按作者的提交计数（快速摘要）
git shortlog origin/<default> --since="<window>" -sn --no-merges

# 8. TODOS.md 待办事项（如果可用）
cat TODOS.md 2>/dev/null || true
```

### 步骤2：计算指标

在摘要表中计算并呈现这些指标：

| 指标 | 值 |
|------|-----|
| 提交到 main | N |
| 贡献者 | N |
| 合并的 PR | N |
| 总插入数 | N |
| 总删除数 | N |
| 净添加 LOC | N |
| 测试 LOC（插入） | N |
| 测试 LOC 比例 | N% |
| 版本范围 | vX.Y.Z.W → vX.Y.Z.W |
| 活跃天数 | N |
| 检测到的会话 | N |
| 平均 LOC/会话小时 | N |

然后在下面立即显示**按作者排行榜**：

```
贡献者          提交数   +/-          主要领域
您 (garry)              32   +2400/-300   browse/
alice                    12   +800/-150    app/services/
bob                       3   +120/-40     tests/
```

按提交数降序排序。当前用户（来自 `git config user.name`）始终排在第一位，标记为"您 (name)"。

**待办事项健康度（如果 TODOS.md 存在）：** 读取 `TODOS.md`（在步骤1的命令9中获取）。计算：
- 总未完成 TODO（排除 `## Completed` 部分的项目）
- P0/P1 数量（关键/紧急项目）
- P2 数量（重要项目）
- 本期间完成的项目（Completed 部分中日期在回顾窗口内的项目）
- 本期间添加的项目（交叉引用 git log 中在窗口内修改 TODOS.md 的提交）

将其包含在指标表中：
```
| 待办事项健康度 | N 个未完成（X 个 P0/P1，Y 个 P2）· 本期间完成 Z 个 |
```

如果 TODOS.md 不存在，跳过待办事项健康度行。

### 步骤3：提交时间分布

使用条形图显示太平洋时间的小时直方图：

```
小时  提交数  ████████████████
 00:    4      ████
 07:    5      █████
 ...
```

识别并指出：
- 高峰时段
- 无活动时段
- 模式是双峰（上午/晚上）还是连续的
- 深夜编码集群（晚上10点后）

### 步骤4：工作会话检测

使用连续提交之间的**45分钟间隙**阈值来检测会话。每个会话报告：
- 开始/结束时间（太平洋时间）
- 提交数
- 持续时间（分钟）

将会话分类：
- **深度会话**（50+ 分钟）
- **中等会话**（20-50 分钟）
- **微型会话**（<20 分钟，通常是单次提交的即发即忘）

计算：
- 总活跃编码时间（会话持续时间总和）
- 平均会话长度
- 每小时活跃时间的 LOC

### 步骤5：提交类型细分

按常规提交前缀（feat/fix/refactor/test/chore/docs）分类。显示为百分比条形图：

```
feat:     20  (40%)  ████████████████████
fix:      27  (54%)  ███████████████████████████
refactor:  2  ( 4%)  ██
```

如果修复比例超过50%，则标记 — 这表明"快速发布，快速修复"模式，可能表明审查存在差距。

### 步骤6：热点分析

显示前10个更改最频繁的文件。标记：
- 更改5次以上的文件（频繁变动热点）
- 热点列表中的测试文件与生产文件
- VERSION/CHANGELOG 频率（版本规范指标）

### 步骤7：PR大小分布

从提交差异中，估计PR大小并将其分组：
- **小型** (<100 LOC)
- **中型** (100-500 LOC)
- **大型** (500-1500 LOC)
- **超大型** (1500+ LOC) — 用文件计数标记这些

### 步骤8：专注度分数 + 本周最佳发布

**专注度分数：** 计算提交涉及单个最常更改的顶级目录（例如 `app/services/`、`app/views/`）的百分比。分数越高 = 工作越专注。分数越低 = 上下文切换越频繁。报告格式："专注度分数：62% (app/services/)"

**本周最佳发布：** 自动识别窗口中LOC最高的单个PR。突出显示：
- PR编号和标题
- 更改的LOC
- 为什么重要（从提交消息和接触的文件推断）

### 步骤9：团队成员分析

对于每位贡献者（包括当前用户），计算：

1. **提交和LOC** — 总提交数、插入数、删除数、净LOC
2. **专注领域** — 他们最常接触的目录/文件（前3个）
3. **提交类型组合** — 他们个人的feat/fix/refactor/test细分
4. **会话模式** — 他们的编码时间（高峰时段）、会话数
5. **测试纪律** — 他们个人的测试LOC比例
6. **最大发布** — 窗口内他们单个影响最大的提交或PR

**对于当前用户（"您"）：** 此部分得到最深入的处理。包括个人回顾的所有细节 — 会话分析、时间模式、专注度分数。用第一人称表述："您的高峰时段..."、"您最大的发布..."

**对于每位队友：** 写2-3句话，涵盖他们的工作内容和模式。然后：

- **表扬**（1-2个具体事项）：基于实际提交。不是"做得好" — 确切地说做得好的地方。例如："在3个专注的会话中完成了整个认证中间件重写，测试覆盖率达45%"、"每个PR都在200 LOC以下 — 纪律严明的分解。"
- **成长机会**（1个具体事项）：作为提升建议提出，而非批评。基于实际数据。例如："本周测试比例为12% — 在支付模块变得更复杂之前添加测试覆盖会带来回报"、"对同一文件的5次修复提交表明原始PR可能需要一次审查。"

**如果只有一个贡献者（个人仓库）：** 跳过团队细分，继续进行 — 回顾是个人的。

**如果有 Co-Authored-By 标记：** 解析提交消息中的 `Co-Authored-By:` 行。将这些作者与主要作者一起归功于提交。注意AI共同作者（例如 `noreply@anthropic.com`），但不将他们作为团队成员包括在内 — 相反，将"AI辅助提交"作为单独的指标跟踪。

### 步骤10：周环比趋势（如果窗口 >= 14天）

如果时间窗口为14天或更长，按周分组并显示趋势：
- 每周提交数（总计和按作者）
- 每周LOC
- 每周测试比例
- 每周修复比例
- 每周会话数

### 步骤11：连续记录追踪

计算从今天开始，向 origin/<default> 至少有1次提交的连续天数。跟踪团队连续记录和个人连续记录：

```bash
# 团队连续记录：所有唯一提交日期（太平洋时间）— 没有硬性限制
TZ=America/Los_Angeles git log origin/<default> --format="%ad" --date=format:"%Y-%m-%d" | sort -u

# 个人连续记录：仅当前用户的提交
TZ=America/Los_Angeles git log origin/<default> --author="<user_name>" --format="%ad" --date=format:"%Y-%m-%d" | sort -u
```

从今天开始倒数 — 有多少连续天数至少有一次提交？此查询完整历史记录，因此可以准确报告任何长度的连续记录。同时显示：
- "团队发布连续记录：47天"
- "您的发布连续记录：32天"

### 步骤12：加载历史记录并比较

在保存新快照之前，检查是否有以前的回顾历史：

```bash
ls -t .context/retros/*.json 2>/dev/null
```

**如果存在以前的回顾：** 使用Read工具加载最近的一个。计算关键指标的变化并包含**与上一次回顾的趋势**部分：
```
                    上次        当前         变化
测试比例:         22%    →    41%         ↑19个百分点
会话数:           10     →    14          ↑4
LOC/小时:           200    →    350         ↑75%
修复比例:          54%    →    30%         ↓24个百分点（好转）
提交数:            32     →    47          ↑47%
深度会话:      3      →    5           ↑2
```

**如果没有以前的回顾：** 跳过比较部分并追加："记录第一次回顾 — 下周再次运行以查看趋势。"

### 步骤13：保存回顾历史

计算完所有指标（包括连续记录）并加载任何以前的历史记录进行比较后，保存JSON快照：

```bash
mkdir -p .context/retros
```

确定今天的下一个序列编号（用实际日期替换 `$(date +%Y-%m-%d)`）：
```bash
# 计算今天已有的回顾数量以获取下一个序列编号
today=$(TZ=America/Los_Angeles date +%Y-%m-%d)
existing=$(ls .context/retros/${today}-*.json 2>/dev/null | wc -l | tr -d ' ')
next=$((existing + 1))
# 保存为 .context/retros/${today}-${next}.json
```

使用Write工具保存具有以下模式的JSON文件：
```json
{
  "date": "2026-03-08",
  "window": "7d",
  "metrics": {
    "commits": 47,
    "contributors": 3,
    "prs_merged": 12,
    "insertions": 3200,
    "deletions": 800,
    "net_loc": 2400,
    "test_loc": 1300,
    "test_ratio": 0.41,
    "active_days": 6,
    "sessions": 14,
    "deep_sessions": 5,
    "avg_session_minutes": 42,
    "loc_per_session_hour": 350,
    "feat_pct": 0.40,
    "fix_pct": 0.30,
    "peak_hour": 22,
    "ai_assisted_commits": 32
  },
  "authors": {
    "Garry Tan": { "commits": 32, "insertions": 2400, "deletions": 300, "test_ratio": 0.41, "top_area": "browse/" },
    "Alice": { "commits": 12, "insertions": 800, "deletions": 150, "test_ratio": 0.35, "top_area": "app/services/" }
  },
  "version_range": ["1.16.0.0", "1.16.1.0"],
  "streak_days": 47,
  "tweetable": "3月1日那周：47次提交（3位贡献者），3.2k LOC，38%测试，12个PR，高峰：晚上10点"
}
```

**注意：** 只有当 `TODOS.md` 存在时，才在JSON中包含待办事项数据：
```json
  "backlog": {
    "total_open": 28,
    "p0_p1": 2,
    "p2": 8,
    "completed_this_period": 3,
    "added_this_period": 1
  }
```

### 步骤14：编写叙事

将输出结构化为：

---

**可分享摘要**（第一行，在所有内容之前）：
```
3月1日那周：47次提交（3位贡献者），3.2k LOC，38%测试，12个PR，高峰：晚上10点 | 连续记录：47天
```

## 工程回顾：[日期范围]

### 摘要表
（来自步骤2）

### 与上一次回顾的趋势
（来自步骤11，保存前加载 — 如果是第一次回顾则跳过）

### 时间与会话模式
（来自步骤3-4）

解释团队模式意味着什么的叙事：
- 最高效的时间是什么时候，是什么驱动了它们
- 随着时间的推移，会话是变得更长还是更短
- 估计每天的活跃编码时间（团队总和）
- 值得注意的模式：团队成员是同时编码还是轮班？

### 发布速度
（来自步骤5-7）

涵盖以下内容的叙事：
- 提交类型组合及其揭示的内容
- PR大小的纪律性（PR是否保持较小？）
- 修复链检测（同一子系统上的修复提交序列）
- 版本更新纪律

### 代码质量信号
- 测试LOC比例趋势
- 热点分析（相同的文件是否频繁变动？）
- 任何应该拆分的超大型PR

### 专注度与交付
- 团队的整体专注度分数
- 本周最佳发布（来自步骤8）
- 任何值得注意的交付模式或里程碑

### 团队成员贡献
（来自步骤9）

按贡献者组织，包括：
- 您（详细分析）
- 每位队友（表扬和成长机会）

### 连续记录
（来自步骤10）

突出显示团队和个人的发布连续记录。

### 待办事项健康度
（如果 TODOS.md 存在）

### 行动建议
（1-3条具体的、可操作的建议，基于数据）

---

### 步骤15：清理

运行清理命令：
```bash
# 清理临时文件（如果有）
rm -f /tmp/retro-* 2>/dev/null || true
```

## 附加规则

1. **总是显示实际数据，而不是总结。** 例如，显示 "高峰时间：晚上10点" 而不是 "晚上编码"。
2. **保持简洁。** 避免冗长的解释 — 让数据自己说话。
3. **避免负面语言。** 将"问题"称为"机会"或"可改进的地方"。
4. **专注于趋势，而不仅仅是绝对数字。** 改进比完美更重要。
5. **尊重隐私。** 不要分享团队成员的私人信息或超出工作范围的行为。
6. **保持一致性。** 在所有回顾中使用相同的格式和指标，以便进行有意义的比较。
7. **总是包含可操作的建议。** 回顾的目的是改进，而不仅仅是报告。
8. **如果数据不可用，跳过相应部分。** 不要编造数据或做出无根据的假设。
9. **突出显示成功。** 庆祝团队和个人的成就。
10. **保持客观。** 基于数据和事实，而不是个人观点或偏见。