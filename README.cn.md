# gstack

**gstack 将 Claude Code 从一个通用助手转变为一支按需召唤的专业团队。**

10 个带有强烈观点的工作流技能，适用于 [Claude Code](https://docs.anthropic.com/en/docs/claude-code)。计划审查、代码审查、一键发布、浏览器自动化、QA 测试、工程回顾以及发布后文档——全部以斜杠命令的形式呈现。

### 没有 gstack

- AI 助手会按字面意思理解你的请求——它从不问你是否在构建正确的东西
- 它会精确实现你所说的，即使实际产品需求更复杂
- "审查我的 PR" 每次提供的深度都不一致
- "发布这个" 会变成关于具体要做什么的漫长来回
- AI 助手可以写代码，但看不到你的应用——它就像半个盲人
- 你仍然手工做 QA：打开浏览器、点击检查页面、查看布局

### 有 gstack

| 技能 | 模式 | 功能 |
|-------|------|--------------|
| `/plan-ceo-review` | 创始人 / CEO | 重新思考问题。找出请求中隐藏的 10 星产品。 |
| `/plan-eng-review` | 工程经理 / 技术负责人 | 锁定架构、数据流、图表、边界情况和测试。 |
| `/review` | 偏执的高级工程师 | 找出那些通过 CI 但在生产环境中爆炸的 bug。整理 Greptile 审查评论。 |
| `/ship` | 发布工程师 | 同步 main、运行测试、解决 Greptile 审查、推送、打开 PR。针对已准备好的分支，不用于决定要构建什么。 |
| `/browse` | QA 工程师 | 给 AI 助手一双眼睛。它登录、点击你的应用、截图、捕捉故障。60 秒内完成完整 QA 流程。 |
| `/qa` | QA + 修复工程师 | 测试应用、找出 bug、用原子提交修复、重新验证。修复前后的健康分数和发布就绪摘要。三个层级：快速、标准、全面。 |
| `/qa-only` | QA 报告员 | 仅报告的 QA 测试。与 /qa 方法相同，但从不修复任何内容。当你想要纯 bug 报告而不想要代码更改时使用。 |
| `/setup-browser-cookies` | 会话管理器 | 将你真实浏览器（Comet、Chrome、Arc、Brave、Edge）的 cookie 导入到无头会话中。测试需要登录的页面无需手动登录。 |
| `/retro` | 工程经理 | 团队感知的回顾：你的深度分析 + 对每位贡献者的具体表扬和成长机会。 |
| `/document-release` | 技术写作者 | 更新 README、ARCHITECTURE、CONTRIBUTING 和项目文档以匹配你刚发布的内容。 |

## 演示：一个功能，五种模式

我几乎每个功能都从计划模式开始。我描述我想构建的内容，然后使用 `/plan-ceo-review` 来压力测试我是否真的在构建正确的东西。只有在产品方向确定后，我才会转向工程、审查、发布和测试。

```
你：   [进入计划模式，描述功能]
       我想给列表应用添加卖家照片上传功能。卖家应该能够
       上传他们商品的照片，然后我们从中创建列表。

你：   /plan-ceo-review

Claude："照片上传"不是功能。真正的工作是帮助卖家
        创建真正能卖出去的列表。10 星版本是这样的：
        从照片自动识别商品、从网上抓取规格和价格对比、
        起草标题和描述、建议最佳主图...

你：   /plan-eng-review

Claude：[架构图表、上传→分类→丰富→起草流水线的状态机、
        异步任务边界、故障模式、测试矩阵]

你：   [退出计划模式，实现计划]

你：   /review

Claude：竞态条件：两个标签页可以覆盖封面照片选择。
        信任边界：将网络数据拉入草稿生成会产生
        提示注入向量。遗漏：失败上传的孤立文件清理。

你：   （修复这些问题）

你：   /ship

Claude：[同步 main、运行测试、推送分支、打开 PR — 6 次工具调用，完成]

你：   /qa

Claude：分析分支差异... 8 个文件更改，3 个路由受影响。
        [针对 localhost:3000 测试 /listings/new、/listings/:id、/api/listings]
        3 个路由全部正常。上传 + 丰富流程端到端通过。

你：   /setup-browser-cookies staging.myapp.com

Claude：从 Chrome 为 staging.myapp.com 导入了 8 个 cookie。

你：   /qa https://staging.myapp.com --quick

Claude：[冒烟测试：首页 + 5 个页面，30 秒]
        健康分数：91/100。没有关键问题。1 个中等：移动端导航重叠。
```

## 适用人群

你已经在重度使用 Claude Code，想要一致、高标准的工作流，而不是一种模糊的通用模式。你想告诉模型现在应该使用哪种思维方式——创始人品味、工程严谨性、偏执审查或快速执行。

这不是给初学者的提示包。这是给经常发布产品的人的操作系统。

## 如何使用：同时 10 个会话

gstack 在一个 Claude Code 会话中就很强大。在 10 个会话中，它能带来变革。

[Conductor](https://conductor.build) 并行运行多个 Claude Code 会话——每个都在自己独立的工作空间中。这意味着你可以让一个会话在 staging 上运行 `/qa`，另一个在 PR 上做 `/review`，第三个实现功能，还有七个在其它分支上工作。所有这些都是同时进行的。

每个工作空间自动获得自己独立的浏览器实例——独立的 Chromium 进程、cookie、标签页和日志存储在每个项目根目录的 `.gstack/` 中。没有端口冲突、没有共享状态、无需配置。`/browse` 和 `/qa` 会话永远不会相互干扰，即使在十个并行工作空间中也是如此。

这就是我的设置方式。一个、十 个并行代理，每个都有适合其任务的认知模式。这不是渐进式的改进。这是构建软件的另一种方式。

## 安装

**要求：** [Claude Code](https://docs.anthropic.com/en/docs/claude-code)、[Git](https://git-scm.com/)、[Bun](https://bun.sh/) v1.0+。`/browse` 编译一个原生二进制文件——适用于 macOS 和 Linux（x64 和 arm64）。

### 步骤 1：安装到你的机器

打开 Claude Code 并粘贴这个。Claude 会完成剩下的工作。

> 安装 gstack：运行 `git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup` 然后在 CLAUDE.md 中添加一个 "gstack" 部分，说明使用 gstack 的 /browse 技能进行所有网页浏览，从不使用 mcp\_\_claude-in-chrome\_\_\* 工具，并列出可用的技能：/plan-ceo-review、/plan-eng-review、/review、/ship、/browse、/qa、/qa-only、/setup-browser-cookies、/retro、/document-release。然后询问用户是否也想将 gstack 添加到当前项目，以便团队成员也能使用。

### 步骤 2：添加到你的仓库以便团队成员使用（可选）

> 将 gstack 添加到本项目：运行 `cp -Rf ~/.claude/skills/gstack .claude/skills/gstack && rm -rf .claude/skills/gstack/.git && cd .claude/skills/gstack && ./setup` 然后在这个项目的 CLAUDE.md 中添加一个 "gstack" 部分，说明使用 gstack 的 /browse 技能进行所有网页浏览，从不使用 mcp\_\_claude-in-chrome\_\_\* 工具，列出可用的技能：/plan-ceo-review、/plan-eng-review、/review、/ship、/browse、/qa、/setup-browser-cookies、/retro、/document-release，并告诉 Claude 如果 gstack 技能不工作，运行 `cd .claude/skills/gstack && ./setup` 来构建二进制文件并注册技能。

真实文件会被提交到你的仓库（不是子模块），所以 `git clone` 直接可用。二进制文件和 node_modules 会被 gitignore——团队成员只需要运行一次 `cd .claude/skills/gstack && ./setup` 来构建（或者 `/browse` 在首次使用时自动处理）。

### 安装内容

- 技能文件（Markdown 提示）在 `~/.claude/skills/gstack/`（或项目安装的 `.claude/skills/gstack/`）
- 指向 gstack 目录的符号链接：`~/.claude/skills/browse`、`~/.claude/skills/qa`、`~/.claude/skills/review` 等
- 浏览器二进制文件在 `browse/dist/browse`（约 58MB，gitignore）
- `node_modules/`（gitignore）
- `/retro` 将 JSON 快照保存到项目的 `.context/retros/` 用于趋势跟踪

一切都在 `.claude/` 中。没有东西会修改你的 PATH 或在后台运行。

---

```
+----------------------------------------------------------------------------+
|                                                                            |
|   Are you a great software engineer who loves to write 10K LOC/day         |
|   and land 10 PRs a day like Garry?                                        |
|                                                                            |
|   Come work at YC: ycombinator.com/software                                |
|                                                                            |
|   Extremely competitive salary and equity.                                 |
|   Now hiring in San Francisco, Dogpatch District.                          |
|   Come join the revolution.                                                |
|                                                                            |
+----------------------------------------------------------------------------+
```

---

## 我如何使用这些技能

由 [Garry Tan](https://x.com/garrytan) 创建，[Y Combinator](https://www.ycombinator.com/) 总裁兼首席执行官。

我构建 gstack 是因为我不想要 AI 编码工具困在一种模糊的模式中。

计划不是审查。审查不是发布。创始人品味不是工程严谨性。如果把所有这些混在一起，你通常会得到一个四者的平庸混合体。

我想要明确的档位。

这些技能让我告诉模型现在我想要什么样的思维方式。我可以按需切换认知模式——创始人、工程经理、偏执审查者、发布机器。这就是解锁点。

---

## `/plan-ceo-review`

这是我的**创始人模式**。

这是我希望模型用品味、雄心、用户同理心和长远的时间视角来思考的地方。我不希望它按字面意思理解请求。我希望它首先问一个更重要的问题：

**这个产品到底是做什么的？**

我想这是 **Brian Chesky 模式**。

关键不是实现明显的工单。关键是从用户的角度重新思考问题，找到那个感觉必然存在、令人愉悦、甚至有点神奇的版本。

### 示例

假设我正在构建一个 Craigslist 风格的列表应用，我说：

> "让卖家上传他们商品的照片。"

一个弱的助手会添加一个文件选择器并保存图片。

那不是真正的产品。

在 `/plan-ceo-review` 中，我希望模型问"照片上传"是否真的是功能。也许真正的功能是帮助某人创建一个真正能卖出去的列表。

如果那是真正的工作，整个计划就变了。

现在模型应该问：

* 我们能从照片中识别产品吗？
* 我们能推断出 SKU 或型号吗？
* 我们能自动搜索网络并起草标题和描述吗？
* 我们能拉取规格、类别和价格对比吗？
* 我们能建议哪张照片作为主图转化效果最好吗？
* 我们能检测上传的照片是否丑陋、黑暗、杂乱或低可信度吗？
* 我们能让体验感觉高级而不是像 2007 年的死表格？

这就是 `/plan-ceo-review` 为我做的。

它不只是问，"我如何添加这个功能？"
它问，**"这个请求中隐藏的 10 星产品是什么？"**

这是一种非常不同的力量。

---

## `/plan-eng-review`

这是我的**工程经理模式**。

一旦产品方向正确，我想要一种完全不同的智能。我不想要更多发散的想法。我不想要更多"如果这也很酷呢"。我希望模型成为我最好的技术负责人。

这个模式应该搞定：

* 架构
* 系统边界
* 数据流
* 状态转换
* 故障模式
* 边界情况
* 信任边界
* 测试覆盖

还有对我来说出奇大的一个解锁：**图表**。

当你强制 LLM 绘制系统时，它们会变得更完整。序列图、状态图、组件图、数据流图，甚至测试矩阵。图表迫使隐藏的假设浮出水面。它们让模糊的计划变得更加困难。

所以 `/plan-eng-review` 是我希望模型构建能够承载产品愿景的技术脊柱的地方。

### 示例

以同样的列表应用为例。

假设 `/plan-ceo-review` 已经完成了它的工作。我们决定真正的功能不只是照片上传。这是一个智能列表流程：

* 上传照片
* 识别产品
* 从网络丰富列表
* 起草强有力的标题和描述
* 建议最佳主图

现在 `/plan-eng-review` 接管了。

现在我希望模型回答这样的问题：

* 上传、分类、丰富和草稿生成的架构是什么？
* 哪些步骤同步进行，哪些进入后台任务？
* 应用服务器、对象存储、视觉模型、搜索/丰富 API 和列表数据库之间的边界在哪里？
* 如果上传成功但丰富失败会发生什么？
* 如果产品识别置信度低怎么办？
* 重试如何工作？
* 我们如何防止重复任务？
* 什么时候持久化什么，什么可以安全地重新计算？

这就是我想要图表的地方——架构图、状态模型、数据流图、测试矩阵。图表迫使隐藏的假设浮出水面。它们让模糊的计划变得更加困难。

那是 `/plan-eng-review`。

不是"让想法变小。"
**让想法可构建。**

---

## `/review`

这是我的**偏执高级工程师模式**。

通过测试不意味着分支是安全的。

`/review` 存在是因为有一整类 bug 可以躲过 CI 并在生产环境中给你致命一击。这个模式不是关于梦想更大。不是关于让计划更漂亮。是关于问：

**什么还会出问题？**

这是一个结构性审计，不是风格挑剔。我希望模型寻找诸如：

* N+1 查询
* 陈旧读取
* 竞态条件
* 糟糕的信任边界
* 缺失索引
* 转义 bug
* 不变量破坏
* 糟糕的重试逻辑
* 通过测试但错过真正失败模式的测试

### 示例

假设智能列表流程已实施，测试是绿色的。

`/review` 仍然应该问：

* 在渲染列表照片或草稿建议时是否引入了 N+1 查询？
* 我是否信任客户端提供的文件元数据而不是验证实际文件？
* 两个标签页是否可能竞态并覆盖封面照片选择或商品详情？
* 失败的上传是否会在存储中留下永久的孤立文件？
* "恰好一张主图"规则在并发下会破裂吗？
* 如果丰富 API 部分失败，我是优雅降级还是保存垃圾？
* 我是否通过将网络数据拉入草稿生成意外创建了提示注入或信任边界问题？

这就是 `/review` 的意义。

我不想要奉承。
我希望模型在生产事故发生之前想象它。

---

## `/ship`

这是我的**发布机器模式**。

一旦我决定了要构建什么，搞定了技术计划，并进行了严肃的审查，我不想要更多讨论。我想要执行。

`/ship` 用于最后一步。它用于一个已准备好的分支，不是用于决定要构建什么。

这是模型应该停止像头脑风暴伙伴一样行事，开始像 disciplined 的发布工程师一样行事的时刻：与 main 同步，运行正确的测试，确保分支状态正常，如果仓库需要则更新 changelog 或版本控制，推送，并创建或更新 PR。

这里势能很重要。

很多分支在有趣的工作完成后死去，只剩下无聊的发布工作。人类会拖延那部分。AI 不应该。

### 示例

假设智能列表流程完成了。

产品思维完成了。
架构完成了。
审查通过了。
现在分支只需要落地。

这就是 `/ship` 的用途。

它处理重复的发布杂务，这样我就不会在以下方面流失精力：

* 与 main 同步
* 重新运行测试
* 检查奇怪的分支状态
* 更新 changelog/版本元数据
* 推送分支
* 打开或更新 PR

此时我不想要更多想法。
我希望飞机落地。

---

## Greptile 集成

[Greptile](https://greptile.com) 是一家 YC 公司，自动审查你的 PR。它捕捉真正的 bug——竞态条件、安全问题、那些通过 CI 但在生产环境中爆炸的问题。它真的不止一次救了我。我喜欢这些家伙。

**设置：** 在 [greptile.com](https://greptile.com) 为你的 GitHub 仓库安装 Greptile——大约需要 30 秒。一旦它正在审查你的 PR，gstack 会自动获取它的评论。不需要额外配置。

任何自动审查器的问题都是分类。Greptile 很好，但并不是每条评论都是真正的问题。有些是误报。有些标记了你三 commits 前就已经修复的东西。没有分类层，评论会堆积起来，你开始忽略它们——这违背了目的。

gstack 解决了这个问题。`/review` 和 `/ship` 现在支持 Greptile。它们读取 Greptile 的评论，对每条进行分类，并采取行动：

- **有效问题** 被添加到关键发现中，并在发布前修复
- **已修复问题** 得到自动回复确认
- **误报** 被推回——你确认后，回复会解释为什么它是错误的

结果是两层审查：Greptile 在 PR 上异步捕捉东西，然后 `/review` 和 `/ship` 作为正常工作流的一部分对这些发现进行分类。没有什么会漏掉。

它还会学习。每条你确认的误报都会保存到 `~/.gstack/greptile-history.md`。未来的运行会自动跳过你的代码库的已知误报模式。`/retro` 跟踪 Greptile 的长期表现——所以你可以看到信噪比是否在改善。

### 示例

```
你：   /ship

Claude：[同步 main、运行测试、发布前审查...]

        Greptile 在这个 PR 上发现了 3 条评论：

        [有效] app/services/payment_service.rb:47 — 竞态条件：
        并发扣款可以双重扣款。建议在扣款块周围使用
        数据库级咨询锁。
        → https://github.com/you/app/pull/42#discussion_r123

        [已修复] app/models/user.rb:12 — 在 downcase 之前
        缺少空检查。
        → 已在 commit abc1234 中修复。自动回复。

        [误报] lib/auth.rb:88 — "Token 比较应该
        使用常量时间比较。" 我们这里已经使用了
        ActiveSupport::SecurityUtils.secure_compare。
        → https://github.com/you/app/pull/42#discussion_r125

        正在修复 payment_service.rb 中的竞态条件...
        应用了咨询锁。提交：fix: address Greptile
        review — advisory lock on concurrent charges

        auth token 评论是误报——我们已经
        使用了 secure_compare。

        误报选项：
          A) 回复 Greptile 解释（推荐）
          B) 无论如何修复
          C) 忽略

你：    A

Claude：回复了 Greptile。修复后重新运行测试...
        所有测试通过。继续版本更新。

        [创建 PR，正文包含 Greptile 审查部分]
        PR: https://github.com/you/app/pull/42
```

三条 Greptile 评论。一个真正的修复。一个自动确认。一个误报被推回并回复。额外时间总计：大约 30 秒。PR 正文有完整的审计追踪。

---

## `/browse`

这是我的**QA 工程师模式**。

`/browse` 是关闭循环的技能。在此之前，AI 助手可以思考和编码，但仍然是半个盲人。它必须猜测 UI 状态、认证流程、重定向、控制台错误、空状态和破损的布局。现在它可以直接去看。

这是一个真正的阶段性改变。完整周期变成：计划、代码、运行应用、检查 UI、复现 bug、验证修复、发布。QA 不再是"去手动点击"，而是成为同一个代理循环的一部分。它给 AI 助手眼睛。现在它可以做那些乏味、高上下文的 QA 工作：点击应用、捕捉破损、验证修复、继续前进。这感觉就像有一个真正的操作员在机器里。

这是一个编译的二进制文件，与持久的 Chromium 守护进程通信——基于 Microsoft 的 [Playwright](https://playwright.dev/)。首次调用启动浏览器（~3s）。之后的每次调用：~100-200ms。浏览器在命令之间保持运行，所以 cookie、标签页和 localStorage 都会保留。

在我推送一个分支后，我告诉 Claude 去检查 staging。它为我做整个 QA 流程：

```
你：   /browse staging.myapp.com — 登录，测试注册流程，并检查
       我在这个分支中更改的每个页面

Claude: [18 次工具调用，约 60 秒]

        > browse goto https://staging.myapp.com/signup
        > browse snapshot -i
        > browse fill @e2 "test@example.com"
        > browse fill @e3 "password123"
        > browse click @e5                    (提交)
        > browse screenshot /tmp/signup.png
        > Read /tmp/signup.png

        注册成功。重定向到 onboarding。现在检查更改的页面。

        > browse goto https://staging.myapp.com/dashboard
        > browse screenshot /tmp/dashboard.png
        > Read /tmp/dashboard.png
        > browse console

        Dashboard 加载正常。没有控制台错误。图表用示例数据渲染。

        > browse goto https://staging.myapp.com/settings/billing
        > browse screenshot /tmp/billing.png
        > Read /tmp/billing.png

        Billing 页面加载正常。计划选择器显示 Free/Pro/Enterprise。
        Stripe 元素渲染正确。

        > browse goto https://staging.myapp.com/api/health
        > browse text

        API health 端点返回 {"status":"ok","version":"2.4.1"}。

        4 个页面全部加载正常。没有控制台错误。没有破损的布局。
        注册 → onboarding → dashboard 流程端到端正常工作。
```

18 次工具调用，大约一分钟。它注册了一个测试用户、导航到我更改的每个页面、截屏、读取、检查控制台错误并验证了 API。那是一个完整的 QA 流程。我没有打开浏览器。

它适用于读取文档、验证部署、填写表单、截图、跨环境比较页面，以及 Claude 需要关注任何其它需要眼睛看现场 URL 的事情。

**安全注意：** `/browse` 运行持久的 Chromium 会话。Cookie、localStorage 和会话状态在命令之间保留。除非你打算这样做，否则不要在敏感的生产环境上使用它——它是一个有真实状态的真实浏览器。会话在空闲 30 分钟后自动关闭。

完整命令参考、技术内部结构和架构细节，请参阅 [BROWSER.md](BROWSER.md)。

---

## `/qa`

这是我的**QA 负责人模式**。

`/browse` 给 AI 助手眼睛。`/qa` 给它测试方法论。

最常见的用例：你在一个功能分支上，刚完成编码，想要验证一切是否正常工作。只要说 `/qa`——它读取你的 git diff，识别你的更改影响的页面和路由，启动浏览器，测试每一个。不需要 URL。不需要手工测试计划。它从你更改的代码中找出要测试什么。

```
你：   /qa

Claude: 分析分支差异针对 main...
        12 个文件更改：3 个控制器、2 个视图、4 个服务、3 个测试

        受影响的路由：/listings/new、/listings/:id、/api/listings
        检测到应用运行在 localhost:3000。

        [测试每个受影响的页面——导航、填写表单、点击按钮、
        截图、检查控制台错误]

        QA 报告：3 个路由测试，全部正常。
        - /listings/new: 上传 + 丰富流程端到端正常
        - /listings/:id: 详情页面渲染正确
        - /api/listings: 返回 200 且形状符合预期
        没有控制台错误。相邻页面没有回归。
```

四种模式：

- **差异感知**（功能分支自动启用）——读取 `git diff main`，识别受影响的页面，专门测试它们。从"我刚写完代码"到"它能工作"的最快路径。
- **完整**——系统地探索整个应用。5-15 分钟取决于应用大小。记录 5-10 个有充分证据的问题。
- **快速** (`--quick`)——30 秒冒烟测试。首页 + 前 5 个导航目标。能加载吗？控制台错误？链接断开？
- **回归** (`--regression baseline.json`)——运行完整模式，然后与之前的基线对比。哪些问题修复了？哪些是新的？分数差异是多少？

```
你：   /qa https://staging.myapp.com

Claude: [探索 12 个页面、填写 3 个表单、测试 2 个流程]

        QA 报告：staging.myapp.com — 健康分数：72/100

        前 3 个问题：
        1. 关键：结账表单提交时空必填字段
        2. 高：移动端导航菜单选择项目后不关闭
        3. 中：仪表板图表在 1024px 以下与侧边栏重叠

        [完整报告和截图保存到 .gstack/qa-reports/]
```

报告和截图积累在 `.gstack/qa-reports/` 中，这样你可以跟踪质量随时间的变化并比较运行。

**测试需要认证的页面：** 先使用 `/setup-browser-cookies` 导入你的真实浏览器会话，然后 `/qa` 就可以测试登录后的页面。

---

## `/setup-browser-cookies`

这是我的**会话管理器模式**。

在 `/qa` 或 `/browse` 可以测试需要认证的页面之前，它们需要 cookie。`/setup-browser-cookies` 不是每次都通过无头浏览器手动登录，而是直接从你的日常浏览器导入真实会话。

它自动检测已安装的 Chromium 浏览器（Comet、Chrome、Arc、Brave、Edge），通过 macOS Keychain 解密 cookie，并将它们加载到 Playwright 会话中。交互式选择器 UI 让你精确选择要导入的域名——永远不会显示任何 cookie 值。

```
你：   /setup-browser-cookies

Claude: Cookie 选择器已打开——在你想要导入的域名上
        选择，然后告诉我你完成了。

        [你在浏览器 UI 中选择 github.com、myapp.com]

你：    完成了

Claude: 导入了 2 个域名（47 个 cookie）。会话已就绪。
```

或者完全跳过 UI：

```
你：   /setup-browser-cookies github.com

Claude: 从 Comet 为 github.com 导入了 12 个 cookie。
```

每个浏览器首次导入会触发 macOS Keychain 提示——点击"允许"或"始终允许"。

---

## `/retro`

这是我的**工程经理模式**。

周末结束时我想知道实际发生了什么。不是感觉——是数据。`/retro` 分析提交历史、工作模式和发布速度，并写出坦率的回顾。

它是团队感知的。它识别谁在运行命令，对你自己的工作进行最深入的分析，然后分解每个贡献者给出具体表扬和成长机会——那种你会在 1:1 中真正给出的反馈。它计算提交、LOC、测试比率、PR 大小和修复比率等指标。它从提交时间戳检测编码会话、找到热点文件、跟踪发布连续剧，并识别本周最大的发布。

```
你：   /retro

Claude: 3 月 1 日这周：47 次提交（3 位贡献者），3.2k LOC，38% 测试，12 个 PR，高峰：晚上 10 点 | 连续：47 天

        ## 你的本周
        32 次提交，+2.4k LOC，41% 测试。高峰时段：晚上 9-11 点。
        最大发布：cookie 导入系统（浏览器解密 + 选择器 UI）。
        你做得好的地方：一个专注的推进中发布了完整功能，包括加密、UI 和
        18 个单元测试...

        ## 团队分解

        ### Alice
        12 次提交专注于 app/services/。每个 PR 都低于 200 LOC——有纪律。
        机会：测试比率 12%——值得在支付变得复杂之前投入。

        ### Bob
        3 次提交——修复了仪表板上的 N+1 查询。小但高影响。
        机会：本周只有 1 天活跃——检查是否被阻止了任何事情。

        [团队前 3 名胜利、3 件需要改进的事、下周 3 个习惯]
```

它将 JSON 快照保存到 `.context/retros/`，这样下次运行可以显示趋势。运行 `/retro compare` 查看本周与上周的对比。

---

## `/document-release`

这是我的**技术写作者模式**。

在 `/ship` 创建 PR 之后但在合并之前，`/document-release` 读取项目中的每个文档文件并将其与差异进行交叉引用。它更新文件路径、命令列表、项目结构树以及任何漂移的东西。风险或主观更改被作为问题提出——其它一切都是自动处理的。

```
你：   /document-release

Claude: 分析 3 次提交中 21 个文件更改。找到 8 个文档文件。

        README.md: 将技能计数从 9 更新到 10，将新技能添加到表格
        CLAUDE.md: 将新目录添加到项目结构
        CONTRIBUTING.md: 当前—无需更改
        TODOS.md: 标记 2 项完成，添加 1 个新项目

        所有文档已更新并提交。PR 正文已更新包含文档差异。
```

它还润色 CHANGELOG 语气（从不覆盖条目）、清理已完成的 TODO、检查跨文档一致性，并在适当的时候只问关于 VERSION 升级的问题。

---

## 故障排除

**技能没有在 Claude Code 中显示？**
运行 `cd ~/.claude/skills/gstack && ./setup`（或项目安装的 `cd .claude/skills/gstack && ./setup`）。这会重建符号链接，这样 Claude 就能发现技能。

**`/browse` 失败或找不到二进制文件？**
运行 `cd ~/.claude/skills/gstack && bun install && bun run build`。这会编译浏览器二进制文件。需要 Bun v1.0+。

**项目副本过时？**
运行 `/gstack-upgrade`——它会自动更新全局安装和任何 vendored 项目副本。

**`bun` 没安装？**
安装它：`curl -fsSL https://bun.sh/install | bash`

## 升级

在 Claude Code 中运行 `/gstack-upgrade`。它检测你的安装类型（全局或 vendored）、升级、同步任何项目副本，并显示新增内容。

或者在 `~/.gstack/config.yaml` 中设置 `auto_upgrade: true`，这样 whenever 有新版本可用时自动升级。

## 卸载

粘贴这个到 Claude Code：

> 卸载 gstack：运行 `for s in browse plan-ceo-review plan-eng-review review ship retro qa qa-only setup-browser-cookies document-release; do rm -f ~/.claude/skills/$s; done` 删除技能符号链接，然后运行 `rm -rf ~/.claude/skills/gstack` 并从 CLAUDE.md 中移除 gstack 部分。如果这个项目也有 gstack 在 .claude/skills/gstack，也通过运行 `for s in browse plan-ceo-review plan-eng-review review ship retro qa qa-only setup-browser-cookies document-release; do rm -f .claude/skills/$s; done && rm -rf .claude/skills/gstack` 删除它，并从项目 CLAUDE.md 中移除 gstack 部分。

## 开发

有关设置、测试和开发模式，请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)。有关设计决策和系统内部结构，请参阅 [ARCHITECTURE.md](ARCHITECTURE.md)。有关 browse 命令参考，请参阅 [BROWSER.md](BROWSER.md)。

### 测试

```bash
bun test                     # 免费静态测试（<5s）
EVALS=1 bun run test:evals   # 完整 E2E + LLM 评估（~$4，约 20 分钟）
bun run eval:watch            # E2E 运行期间的实时仪表板
```

E2E 测试流式传输实时进度，编写机器可读的诊断信息，并保存部分结果 survive kills。参见 CONTRIBUTING.md 了解完整的评估基础设施。

## 许可证

MIT
