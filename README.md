# react-cat

猫咪热量计算与减肥计划（移动端 PWA 风格 Web App）。

## 技术栈

- React 19 + Vite 8 + TypeScript
- pnpm
- Tailwind CSS v4、Zustand、Dexie、Recharts、TanStack Query
- Biome（lint/format）、Vitest（单元测试）

产品与设计规格见 [`docs/SPEC.md`](docs/SPEC.md)。

## 开发

```bash
pnpm install
pnpm dev
```

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 本地开发 |
| `pnpm build` | 类型检查 + 生产构建 |
| `pnpm test` | 运行 Vitest |
| `pnpm lint` | Biome 检查 |
| `pnpm lint:fix` | Biome 自动修复 |
