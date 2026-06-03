# AGENTS.md

本项目的设计与产品规格见 `docs/SPEC.md`，技术选型以其「技术选型」表格为准。本文件补充 **组件（Component）编写要求**，所有 AI 与人工编码都需遵守。

## 规格优先流程

- 涉及产品口径、计算规则、界面结构、交互流程或数据模型的变更，必须先更新 `docs/SPEC.md`，再修改代码。
- 代码实现、测试用例与界面文案必须与 `docs/SPEC.md` 保持一致；发现冲突时，以 `docs/SPEC.md` 为准并先修正规格。
- 若需求尚未写入 `docs/SPEC.md`，不得直接进入实现；应先补齐规格，再执行代码改动。

## 通用原则

- **TypeScript 严格模式**，禁止 `any`；组件 props 一律用 `interface` 显式定义并导出。
- **函数组件 + Hooks**，不写 class 组件。
- 单个组件文件 **不超过 ~200 行**，超出则拆分子组件或抽 hook。
- 组件**只负责渲染与交互**，业务计算放 `src/lib/`（纯函数，可测试），配置放 `src/config/`。
- 严禁在组件内硬编码营养系数 / 生命因子等魔法数字，必须从 `src/config/nutrition.ts` 读取。

## 目录与命名

- 组件文件 `PascalCase.tsx`，与默认导出的组件同名（如 `WeightChart.tsx` → `WeightChart`）。
- 通用、可复用的基础组件放 `src/components/`；页面级容器放 `src/pages/`。
- 复杂交互逻辑抽成 `useXxx` hook，放 `src/hooks/`，与 UI 解耦。

## 样式（TailwindCSS v4）

- **只用 Tailwind 工具类**，不写独立 CSS 文件 / `style={{}}` 内联样式（动态计算值除外）。
- 颜色、圆角、间距尽量用语义 token；进度配色遵循 SPEC：**青 / 翠绿 / 翡翠绿**体系，禁用黄 / 橙 / 红等警告色。
- 移动端优先，默认按小屏布局，必要时再加响应式断点。
- 触控目标 **≥ 44×44pt**，按压态需有即时视觉反馈。

## 图标

- 统一使用 `@fluentui/react-icons`，禁止引入其他图标库或裸 SVG。
- 按需具名导入（如 `import { Target24Regular } from '@fluentui/react-icons'`），避免全量导入。

## 数值输入组件（重点）

数字输入**禁止**直接用 `<input type="number">` 的浏览器原生加减箭头 / 滚轮调值。统一用项目内自定义组件：

- **步进器 `<Stepper>`**：＋/－ 长按连增（先慢后快）、中间可点击文本框直接键盘输入。
  - 文本框用 `type="text"` + `inputMode="decimal"`（小数）或 `"numeric"`（整数）唤起数字键盘。
  - 用 CSS 去除原生 spin button（`appearance: textfield` / `::-webkit-*-spin-button`）。
  - props 至少包含 `value / onChange / step / min / max / decimals / unit / inputMode`。
- **滚轮选择器 `<WheelPicker>`**：范围有限、需快速选定的场景，基于 CSS `scroll-snap` 实现自动吸附居中。
- 数值变化、吸附完成等关键交互触发轻震动 `navigator.vibrate`（需判空兼容）。
- 参考实现见根目录 `demo-stepper.html`。

## 切换类输入

- 食物类型、热量输入方式等离散切换，使用 Segment / bordered button group，**禁止用 `<select>` 下拉**。

## 图表（Recharts）

- 折线图统一使用圆润平滑曲线 `type="natural"`（或 `monotone`），不用折线 `linear`。
- 图表组件接收已处理好的数据数组，不在图表组件内做数据计算。

## 状态管理（Zustand）

- 全局共享状态（猫咪信息、猫粮配置）走 store；组件局部状态用 `useState`。
- 组件通过选择器订阅 store 切片（`useCatStore(s => s.weight)`），避免订阅整个 store 造成多余重渲染。
- 持久化数据经 Dexie.js 读写 IndexedDB，不在组件内直接操作 IndexedDB API。

## 可访问性与质量

- 交互元素提供 `aria-label`；按钮用 `<button>` 而非 `<div onClick>`。
- 提交前通过 **Biome** lint/format，无报错。
- 纯逻辑（`src/lib/`）需有 **Vitest** 单元测试；组件优先保证逻辑已被 lib 测试覆盖。

## 本地运行约束

- **禁止启动 dev server**（`npm run dev` / `vite` 等）。验证改动只用 `tsc -b`（类型检查）、`biome check`（lint）、`vitest`（测试），不要拉起开发服务器或预览服务。
