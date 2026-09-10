# 参与贡献

感谢你愿意帮助改进 Daily Todos。无论是问题反馈、功能建议、文档完善还是代码贡献，都很欢迎。

## 提交问题

- 提交前请先搜索现有 Issues，避免重复。
- 请描述操作系统、应用版本、复现步骤、预期行为和实际行为。
- 日志和截图中请移除个人数据、令牌、邮箱及其他敏感信息。
- 安全漏洞不要直接发布完整细节，请按照 [SECURITY.md](SECURITY.md) 报告。

## 本地开发

请先安装 Node.js LTS、Rust stable，以及 Tauri 对应平台的系统依赖。

```bash
npm ci
npm run tauri dev
```

提交更改前请运行：

```bash
npm test
node scripts/check-release-branding.mjs
```

## Pull Request

- 一个 Pull Request 尽量只解决一个明确问题。
- 说明改动目的、验证方式和可能的兼容性影响。
- 功能变更应同步补充或更新测试。
- 不要提交构建产物、个人数据、未授权素材或保密信息。
- 用户可见的变更请补充到 `CHANGELOG.md` 的 `Unreleased` 部分。

除非另有明确说明，提交到本项目的贡献将按项目的 [MIT License](LICENSE) 授权。
