
## 产品方案

### 信息架构

```
App
├── 宠物信息（首次引导 / 设置入口）
│   ├── 物种切换（猫 / 狗，Segment）
│   ├── 名字、体重(kg)、年龄段、是否绝育、活动量（系数随物种从 `nutrition.ts` 读取）
│   └── 存 IndexedDB，全局共享
│
├── Tab 1：热量计算
│   ├── 食物类型切换（干粮 / 湿粮）
│   ├── 热量输入方式切换（bordered button group，默认 kcal/kg）
│   │   ├── 直填 kcal/kg
│   │   └── 成分反算（蛋白% 脂肪% 灰分% 纤维% 水分%）
│   ├── 计算结果：每日可喂 g 数
│   └── 可保存为「常用猫粮」
│
└── Tab 2：减肥计划
    ├── 顶部 Card：当前阶段 + 总进度条（分段配色）+ 本周目标
    ├── 每日喂食克数（干粮 / 湿粮 分别显示）
    └── 体重记录（时间线 + 圆润曲线折线图）
```

---

## UX 设计

### 导航

底部悬浮胶囊 Tabs，两个按钮：`热量计算` / `减肥计划`，固定在屏幕底部，背景模糊 blur。

### 输入交互原则（移动端优先）

所有数值/选项输入均按**移动端原生触感**设计，**禁止**直接套用桌面浏览器交互方式：

- 数字（kcal/kg、成分百分比、体重）→ 大号步进器（＋/－ 长按连增）或滚轮选择器，配合 `inputMode="decimal"` 唤起数字键盘，**不使用** `<input type=number>` 的浏览器原生加减箭头与滚轮调值。
- 切换类（食物类型、热量输入方式）→ Segment / bordered button group，点击切换，非下拉 `<select>`。
- 触控目标 ≥ 44×44pt，反馈即时（按压态 + 轻震动 haptics）。

表单控件选择规则：

- `体重` / `kcal/kg` / `成分百分比` → 使用项目内自定义 `<Stepper>`，中间输入框为 `type="text"` + `inputMode="decimal"`，左右按钮支持长按连增；适合需要精确微调的连续数值。
- `成分反算` 表单 → 默认展开为一组成分 `<Stepper>`：蛋白、脂肪、灰分、纤维、水分；输入过程中实时计算 NFE / kcal/kg。
- `年龄段` / `是否绝育` / `活动量` / `食物类型` / `热量输入方式` → 使用 Segment 或 bordered button group；选项少、决策明确，禁止使用 `<select>`。
- `体重记录` → 默认使用底部面板里的大号 `<Stepper>` 录入今日体重；若需要在有限范围内快速选择，可使用 `<WheelPicker>`。
- `名字` → 使用普通文本输入，但高度、间距与按压区域仍需满足移动端触控目标。
- `日期` → 默认今天，提供“今天 / 昨天”快捷按钮；需要补录历史记录时再进入日期选择，避免打断主流程。

`<Stepper>` / `<WheelPicker>` 参考同目录 `docs/demo-stepper.html` 实现，组件化时需保留以下行为：

- Stepper 布局为「减号按钮 / 数值输入 / 加号按钮」，按钮触控尺寸不小于 56px，按下态需有缩放或底色变化。
- Stepper 中间输入框使用大字号、居中、等宽数字；宽度随内容长度自适应，单位紧跟数值显示。
- Stepper 输入框必须使用 `type="text"`，按字段设置 `inputMode="decimal"` 或 `inputMode="numeric"`；禁止使用 `<input type="number">`。
- Stepper 输入过程中只保留数字和小数点；失焦时按 `min / max / decimals` 夹取并格式化。
- Stepper 单击 `+ / -` 立即变化；长按 400ms 后开始连续变化，并逐步加速；每次有效变化触发轻震动。
- WheelPicker 基于 `scroll-snap` 实现吸附居中，显示 5 行，首尾留白保证边界值可滚到中央。
- WheelPicker 当前项需高亮并轻微放大；滚动停止后触发轻震动。
- 所有震动调用均需先判断 `navigator.vibrate` 是否存在，保证非支持环境正常运行。

### 热量计算 Tab

```
┌─────────────────────────────┐
│  🐱 小橘 · 4.2kg            │  ← 顶部宠物信息条（猫/狗图标，点击进设置）
├─────────────────────────────┤
│  [干粮]  [湿粮]              │  ← Segment Control
├─────────────────────────────┤
│  热量输入方式                │
│  ┌───────────┬───────────┐  │  ← bordered button group
│  │ ▣ kcal/kg │  成分反算  │  │     默认选中 kcal/kg
│  └───────────┴───────────┘  │
├─────────────────────────────┤
│  3500  kcal/kg              │  ← 大号步进输入（移动端）
│  （或展开成分表单）           │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │  每日可喂：85 g        │  ← 结果卡片，大字显示
│  │  约合 2.5 汤匙        │  │
│  └───────────────────────┘  │
│  [保存为常用猫粮]            │
└─────────────────────────────┘
```

### 减肥计划 Tab

```
┌─────────────────────────────┐
│  第 1-2 周：过渡控量         │  ← 阶段卡片
│  ▓▓▓▓░░░░░░░░░░░░░░░░ 总进度 │  ← 总进度条，分段不同颜色
│  🟡过渡 → 🟠主控 → 🔴强化    │     当前段高亮
│  🎯 210 kcal/天  ⚖ 1.0×RER  │  ← 图标替换文本
│  📊 当前 RER：210 kcal       │
├─────────────────────────────┤
│  今日喂食量                  │
│  🥣 干粮  60 g              │
│  🥫 湿粮  — （未配置）       │
├─────────────────────────────┤
│  体重记录                    │
│  [＋ 录入今日体重]           │  ← 唤起移动端数字滚轮/步进器
│  ╭───── 圆润曲线折线图 ─────╮│  ← Recharts type="natural"
│  │      ●╮                  ││
│  │        ╰●╮               ││
│  │           ╰●             ││
│  ╰──────────────────────────╯│
│  📅 5/20 4.5kg              │
│  📅 5/27 4.4kg              │
│  📅 6/3  4.3kg  ↓          │
└─────────────────────────────┘
```

> 阶段卡片含**总进度条**（按周数百分比填充），过渡 / 主控 / 强化三段采用「越接近目标越鼓舞」的进阶渐变——青 / 翠绿 / 翡翠绿（由浅入深，象征逐步靠近目标），当前阶段高亮。避免使用黄 / 橙 / 红等警告色。
> 图标统一取自 `@fluentui/react-icons`（如 `Target24Regular`、`Scales24Regular`、`DataTrending24Regular`、`Bowl24Regular`）。
> 折线图使用圆润平滑曲线（Recharts `type="natural"` / `monotone`）。
> **不显示**「零食不计入」等辅助提示文字，保持卡片简洁。

---

## 计算逻辑（配置化）

所有系数放 `src/config/nutrition.ts`：

```ts
// RER 静息能量 (kcal/day) = 70 × 体重kg^0.75   ← 猫狗通用的标准异速生长公式

// 维持能量 MER = RER × lifeFactor × activity   ← 用于「热量计算 Tab」日常喂养量
// 生命因子（按物种，× RER）：符合 WSAVA / NRC 标准 DER 倍数
lifeFactor: {
  cat: { kitten: 2.0, adult_neutered: 1.2, adult_intact: 1.4, senior: 1.1 },
  dog: { kitten: 2.0, adult_neutered: 1.6, adult_intact: 1.8, senior: 1.4 },
}

// 活动系数（× RER）：狗活动差异远大于猫，high 段上调以覆盖运动犬/工作犬
activity: { low: 1.0, moderate: 1.2, high: 1.4 }

// Atwater 修正系数 (kcal/g)：宠物食品标准值，与物种无关
atwater: { protein: 3.5, fat: 8.5, nfe: 3.5 }

// 减肥目标 = RER × dietRatio   ← 直接锚定 RER，按物种区分；
// 不再用 MER×折扣（狗维持倍数高，折扣后仍远超 RER，无法形成热量缺口）。
// 猫：掉秤须慢、防肝脂沉积，限饲较保守；狗：可耐受更强限饲。
dietPhases: {
  cat: {
    transition: { weeks: [1, 2],  ratio: 1.0  },
    main:       { weeks: [3, 6],  ratio: 0.85 },
    intensive:  { weeks: [7, +∞], ratio: 0.8  },
  },
  dog: {
    transition: { weeks: [1, 2],  ratio: 1.0  },
    main:       { weeks: [3, 6],  ratio: 0.8  },
    intensive:  { weeks: [7, +∞], ratio: 0.65 },
  },
}

// RER 下限保护（防限饲过度，按物种；猫肝脂沉积风险高，下限更保守）
minRerRatio: { cat: 0.8, dog: 0.6 }
```

> **减肥口径说明**：目标热量按「当前体重的 RER × 当前阶段 ratio」计算。`ratio = 1.0` 表示喂到 RER 维持静息所需（过渡期不制造缺口），随阶段推进逐步降低形成热量缺口。最终结果以 `minRerRatio` 对应物种值兜底，不会低于安全下限。安全减重速率：猫约 0.5–1%/周，狗约 1–2%/周。

---

## 技术选型

| 用途 | 包 |
|------|---|
| 框架 | React 19 + Vite 7 |
| 状态管理 | Zustand |
| 样式 | TailwindCSS v4 |
| Lint/Format | Biome |
| 测试 | Vitest |
| 数据查询 | TanStack Query v5 |
| 图标 | @fluentui/react-icons |
| IndexedDB | **Dexie.js**（schema 迁移、TypeScript 友好） |
| 图表 | **Recharts**（轻量，折线图用圆润曲线 `type="natural"`） |
| 数字输入 | 自定义**移动端步进器 / 滚轮选择器**，禁用桌面浏览器原生 input 交互（不弹软键盘上下箭头、不依赖 `<input type=number>` 滚轮行为） |

---

## 目录结构

```
src/
├── config/
│   └── nutrition.ts       ← 所有系数配置
├── db/
│   └── index.ts           ← Dexie schema
├── stores/
│   ├── catStore.ts        ← 宠物信息（含物种 cat | dog）
│   └── foodStore.ts       ← 猫粮配置
├── lib/
│   └── calculator.ts      ← 纯函数计算逻辑（含测试）
├── components/
│   ├── BottomTabs.tsx
│   ├── CatInfoBar.tsx
│   └── WeightChart.tsx
├── pages/
│   ├── CalcTab.tsx
│   └── DietTab.tsx
└── App.tsx
```
