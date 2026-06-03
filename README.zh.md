# react-cat

[English](README.md) · **简体中文**

面向移动端的宠物热量估算与减肥计划 Web 应用。支持猫 / 狗，依据 RER / MER 与 AAFCO 成分反算估算每日喂食克数，并提供固定速率（0.5–1%/周）的减重计划与体重趋势追踪。

> **免责声明**：本应用仅用于家庭喂食估算与体重记录，不能替代兽医诊疗。对 BCS ≥ 7/9、已有疾病、幼龄/妊娠/哺乳或需严格限热的宠物，请在兽医指导下调整方案。

## 功能概览

| 模块 | 能力 |
|------|------|
| **宠物档案** | 物种、名字、体重、目标体重、年龄段、绝育状态、活动量；数据持久化至 IndexedDB |
| **热量计算** | 干粮 / 湿粮切换；直填 kcal/kg 或按标签成分反算；输出每日可喂克数；可保存为常用猫粮 |
| **减肥计划** | 周目标卡片、总进度、MER / 热量缺口区间；干湿粮每日克数；体重时间线与圆润曲线图 |
| **体重记录** | 日历选日、双列滚轮录入体重；同日期覆盖；历史可编辑 / 删除 |

交互按移动端优先设计：自定义步进器 / 滚轮选择器、Segment 切换、触控目标 ≥ 44pt、关键操作轻震动反馈。详见 [`docs/SPEC.md`](docs/SPEC.md)。

## 技术栈

| 用途 | 选型 |
|------|------|
| 框架 | React 19 + Vite 8 + TypeScript |
| 包管理 | pnpm |
| 样式 | Tailwind CSS v4 |
| 状态 | Zustand |
| 持久化 | Dexie.js（IndexedDB） |
| 数据请求 | TanStack Query v5 |
| 图表 | Recharts（`type="natural"` 平滑曲线） |
| 图标 | @fluentui/react-icons |
| 质量 | Biome（lint/format）、Vitest（`src/lib/` 单元测试） |

营养系数、生命因子、减重速率等**禁止在组件内硬编码**，统一从 `src/config/nutrition.ts` 读取；计算逻辑在 `src/lib/`（如 `calculator.ts`、`feeding.ts`、`weightLog.ts`）。

## 快速开始

```bash
pnpm install
pnpm dev      # 本地开发（默认 http://localhost:5173）
pnpm build    # tsc + 生产构建
pnpm preview  # 预览构建产物
```

## 常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | Vite 开发服务器 |
| `pnpm build` | `tsc -b` 类型检查 + `vite build` |
| `pnpm preview` | 预览 `dist/` |
| `pnpm test` | 运行 Vitest（单次） |
| `pnpm test:watch` | Vitest 监听模式 |
| `pnpm lint` | Biome 检查 |
| `pnpm lint:fix` | Biome 检查并自动修复 |
| `pnpm format` | Biome 格式化 |

## 目录结构

```
react-cat/
├── docs/
│   ├── SPEC.md              # 产品、UX、计算口径（实现以本文件为准）
│   └── demo-stepper.html    # 步进器 / 滚轮交互参考
├── public/
├── src/
│   ├── config/              # 营养系数等配置（nutrition.ts）
│   ├── db/                  # Dexie schema 与数据库访问
│   ├── stores/              # Zustand 全局状态
│   ├── lib/                 # 纯函数业务逻辑 + Vitest 测试
│   ├── components/          # 可复用 UI（Stepper、WheelPicker 等）
│   └── pages/               # 页面级容器（CalcTab、DietTab 等）
├── AGENTS.md                # AI / 贡献者组件与编码约定
└── CLAUDE.md                # 同 AGENTS.md，供 Claude 使用
```

## 计算逻辑摘要

完整公式、科学依据与产品口径见 [`docs/SPEC.md`「计算逻辑」](docs/SPEC.md#计算逻辑配置化)。

- **RER**：`70 × 体重kg^0.75`（猫狗通用）
- **MER**：`RER × 生命因子 × 活动系数`（日常喂食用当前体重）
- **成分反算**：AAFCO 修正 Atwater，`NFE = 100 - 蛋白 - 脂肪 - 纤维 - 水分 - 灰分`
- **减重**：固定 0.5–1%/周目标体重区间；热量目标 = `MER - ((参考体重 - 本周目标体重) × 7700 / 7)`

## 参与开发

1. **规格优先**：涉及界面、交互、计算规则或数据模型的变更，须先更新 `docs/SPEC.md`，再改代码。
2. **组件规范**：函数组件 + Hooks、TypeScript 严格模式、Tailwind 工具类、数字输入使用项目内 `<Stepper>` / `<WheelPicker>`，详见 [`AGENTS.md`](AGENTS.md)。
3. **验证**：提交前建议执行：

```bash
pnpm exec tsc -b
pnpm lint
pnpm test
```

## 相关文档

- [`docs/SPEC.md`](docs/SPEC.md) — 信息架构、UX、计算逻辑、技术选型
- [`AGENTS.md`](AGENTS.md) — 组件编写与仓库约束
