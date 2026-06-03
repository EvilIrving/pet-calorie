
## 产品方案

### 信息架构

```
App
├── 宠物信息（首次引导 / 设置入口）
│   ├── 物种切换（猫 / 狗，Segment）
│   ├── 名字、体重(kg)、目标体重(kg)、年龄段、是否绝育、活动量（系数随物种从 `nutrition.ts` 读取）
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
    ├── 顶部 Card：第 N 周目标 + 总进度条 + 固定每周目标区间
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
- `体重记录` → 任意日期均可记录、**不限制每周一条**（「建议每周称一次」仅作文案提示）；底部面板默认今天，用自定义 `<Calendar>` 选日期（禁选未来日期），体重用 `<DecimalWheelPicker>`（双列滚轮，整数 + 小数），**不使用** `<Stepper>`。同一日期仅保留一条记录（再次保存即覆盖），历史记录可点击编辑或删除。
- `名字` → 使用普通文本输入，但高度、间距与按压区域仍需满足移动端触控目标。
- `日期` → 默认今天；体重记录面板直接展示 `<Calendar>` 选日期。

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
│  第 3 周目标                 │  ← 周目标卡片
│  ▓▓▓▓░░░░░░░░░░░░░░░░ 总进度 │  ← 总进度条
│  固定速率 0.5–1.0%/周        │
│  🎯 239–270 kcal/天 ⚖ 5.45–5.47kg│ ← 图标替换文本
│  📊 MER 300 · 缺口 30–61 kcal │
├─────────────────────────────┤
│  今日喂食量                  │
│  🥣 干粮  60 g              │
│  🥫 湿粮  — （未配置）       │
├─────────────────────────────┤
│  体重记录            [＋ 记录]│  ← 趋势优先卡片
│  4.3 kg   ↓0.1kg            │  ← 大号当前体重 + 较上次变化
│  最近称重 6/3               │
│  ╭───── 圆润曲线折线图 ─────╮│  ← Recharts type="natural"
│  │      ●╮                  ││
│  │        ╰●╮               ││
│  │           ╰●             ││
│  ╰──────────────────────────╯│
│  历史记录（3）            ⌄  │  ← 可展开，单条可编辑 / 删除
└─────────────────────────────┘
```

> 周目标卡片含**总进度条**（按计划总周数百分比填充）。进度色使用青 / 翠绿 / 翡翠绿体系中的语义色，避免使用黄 / 橙 / 红等警告色。
> 图标统一取自 `@fluentui/react-icons`（如 `Target24Regular`、`Scales24Regular`、`DataTrending24Regular`、`Bowl24Regular`）。
> 热量与缺口使用区间展示；热量区间由 `MER - 每日热量缺口` 得出，不用目标体重 RER 近似。
> 目标体重区间固定显示 2 位小数。
> 折线图使用圆润平滑曲线（Recharts `type="natural"` / `monotone`）。
> **不显示**「零食不计入」等辅助提示文字，保持卡片简洁。

---

## 计算逻辑（配置化）

### 科学依据与产品口径

本项目只提供家庭喂食估算与体重追踪，不替代兽医诊疗。对 BCS ≥ 7/9、已有疾病、幼龄/妊娠/哺乳、明显厌食或需要喂到 RER 以下的宠物，界面应提示在兽医指导下执行减重计划。

| 来源 | 本项目采用方式 |
|------|----------------|
| [Pet Nutrition Alliance: Calculating Calories Based on Pet Needs](https://petnutritionalliance.org/wp-content/uploads/2023/03/MER.RER_.PNA_.pdf) | 使用 `RER = 70 × BWkg^0.75`；MER 用 `RER × 系数`，系数按物种、生命阶段、绝育/完整状态和活动量估算；PNA 明确 MER 只是起点，需按 BCS、当前摄入和复评调整。 |
| [Pet Nutrition Alliance Calorie Calculator](https://petnutritionalliance.org/resources/calorie-calculator/) | 减重按理想/目标体重和 BCS 评估；本项目每周目标统一采用 0.5–1% 固定区间；零食不超过每日总热量 10%。 |
| [AAHA 2021 Nutrition and Weight Management Guidelines](https://www.aaha.org/wp-content/uploads/2021/06/new-2021-aaha-nutrition-and-weight-management-guidelines-with-ref.pdf) | 营养评估应结合 BW、BCS、MCS、饮食史、活动与环境；超重/肥胖时基于理想体重计算并持续复评；显著限热时应考虑兽医处方减重粮，避免营养不足。 |
| [AAFCO Calorie Content](https://www.aafco.org/resources/startups/calorie-content/) | 成分反算使用宠物食品修正 Atwater：`NFE = 100 - 蛋白 - 脂肪 - 纤维 - 水分 - 灰分`，`ME kcal/kg = [(3.5×蛋白) + (8.5×脂肪) + (3.5×NFE)] × 10`，按标签原样百分比计算。 |
| [APOP Veterinary RER/MER Calculator](https://www.petobesityprevention.org/veterinary-der-calculator-1) | 作为 RER/MER 公式一致性的交叉参考；同样把 RER 作为基础，再乘活动/生命阶段系数得到 MER。 |

实现优先级：食品热量密度以包装标注 kcal/kg 为准；没有标注时才使用 AAFCO 成分反算。日常喂食用当前体重 MER 估算。减肥计划在开始时记录起始体重；第 1 周按起始体重生成目标体重区间，第 2 周起按上一计划周体重记录平均值生成目标体重区间；若上一计划周没有体重记录，则回退为计划起始体重。目标体重区间使用固定 0.5–1%/周速率递减，并以目标体重兜底；目标热量按 `MER - ((参考体重 - 本周目标体重) × 7700 / 7)` 计算区间。每次体重记录用于复评趋势，不自动替代兽医诊断。

所有系数放 `src/config/nutrition.ts`：

```ts
// RER 静息能量 (kcal/day) = 70 × 体重kg^0.75
// 来源：PNA / APOP；猫狗通用，用作热量估算底座。

// 维持能量 MER = RER × lifeFactor × activity
// 来源：PNA / AAHA；用于「热量计算 Tab」日常喂养量，属于起始估算，需按 BCS、实际摄入和体重趋势复评。
// 生命因子（按物种，× RER）：PNA 常用 MER 系数；幼龄统一取保守 2.0×RER，实际幼龄需求可随月龄变化。
lifeFactor: {
  cat: { kitten: 2.0, adult_neutered: 1.2, adult_intact: 1.4, senior: 1.1 },
  dog: { kitten: 2.0, adult_neutered: 1.6, adult_intact: 1.8, senior: 1.4 },
}

// 活动系数（× RER）：狗活动差异远大于猫，high 段上调以覆盖运动犬/工作犬
activity: { low: 1.0, moderate: 1.2, high: 1.4 }

// Atwater 修正系数 (kcal/g)：AAFCO 宠物食品标准值，与物种无关；
// NFE = 100 - 蛋白 - 脂肪 - 灰分 - 纤维 - 水分；
// kcal/kg = [(3.5×蛋白) + (8.5×脂肪) + (3.5×NFE)] × 10，按标签原样百分比计算。
atwater: { protein: 3.5, fat: 8.5, nfe: 3.5 }

// 固定减重速率（每周体重百分比）：0.5–1%。
// 体重目标 = 参考体重按 0.5–1%/周下降后的区间；
// 热量目标 = MER - ((参考体重 - 本周目标体重) × weightLossEnergyKcalPerKg / 7)；
// 第 1 周从减肥起始体重计算；第 2 周起从上一计划周体重记录平均值计算。
// 本周目标体重按 safeWeightLossRate 下降，并以用户填写的目标体重兜底。
safeWeightLossRate: {
  cat: { min: 0.005, max: 0.01 },
  dog: { min: 0.005, max: 0.01 },
}

// 体重变化热量折算粗估值，用于从周减重 kg 推算每日热量缺口。
weightLossEnergyKcalPerKg: 7700
```

> **减肥口径说明**：开始计划时记录起始体重。第 1 周以起始体重为参考，第 2 周起以上一计划周体重记录平均值为参考；未填写目标体重时回退为当前体重。目标热量按「MER 扣除 0.5–1%/周对应的每日热量缺口」计算。喂食克数建议与记录对比默认使用热量区间上限，避免自动给出更激进的限热量。

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
react-cat/
├── docs/
├── public/
└── src/
    ├── config/
    ├── db/
    ├── stores/
    ├── lib/
    ├── components/
    └── pages/
```
