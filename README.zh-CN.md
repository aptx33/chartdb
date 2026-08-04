<h1 align="center">
  <a href="https://chartdb.io#gh-light-mode-only">
    <img src="https://github.com/chartdb/chartdb/blob/main/src/assets/logo-light.png" width="400" height="70" alt="ChartDB">
  </a>
  <a href="https://chartdb.io##gh-dark-mode-only">
    <img src="https://github.com/chartdb/chartdb/blob/main/src/assets/logo-dark.png" width="400" height="70" alt="ChartDB">
  </a>
  <br>
</h1>

<p align="center">
  <a href="./README.md">English</a> | <strong>简体中文</strong>
</p>

<p align="center">
  <b>开源数据库关系图编辑器</b><br />
  <b>无需安装云端服务，也不需要提供数据库密码</b>
</p>

<h3 align="center">
  <a href="https://discord.gg/QeFwyWSKwC">社区</a> &bull;
  <a href="https://www.chartdb.io?ref=github_readme">网站</a> &bull;
  <a href="https://chartdb.io/templates?ref=github_readme">示例</a> &bull;
  <a href="https://app.chartdb.io?ref=github_readme">在线体验</a>
</h3>

---

<p align="center">
  <img width="700px" src="./public/chartdb.png">
</p>

## ChartDB

ChartDB 是一个功能强大的 Web 数据库关系图编辑器。它可以通过一段“Smart Query”快速生成数据库结构图，并支持编辑关系图、导出 SQL，以及在无需注册账号的情况下使用主要功能。

主要能力：

- **快速导入数据库结构**：运行项目提供的查询并导入结果，即可生成数据库关系图。
- **AI 辅助导出和迁移**：按照目标数据库方言生成 DDL，辅助不同数据库之间的迁移。
- **交互式编辑**：调整表、字段、关系、布局和注释，便于设计和理解数据库结构。

## 项目状态

ChartDB 当前处于公开测试阶段。上游项目的最新状态请以 [chartdb/chartdb](https://github.com/chartdb/chartdb) 为准。

## 本 Fork 的改动

本 Fork 保持与上游 ChartDB 的基本兼容，并增加了以下通用改进：

- 增加基于 Electron 的 macOS 桌面应用和 DMG 打包脚本。
- 改进表与字段注释展示、表节点初始尺寸和侧边栏交互。
- DBML 导入发生非语法类转换错误时展示具体原因，避免导入失败后页面没有提示。

README 只记录适合公开复用的功能和构建方式，不包含私有数据库结构、账号凭证、本地绝对路径或特定组织配置。

## 支持的数据库

- PostgreSQL（包括 Supabase 和 Timescale）
- MySQL
- SQL Server
- MariaDB
- SQLite（包括 Cloudflare D1）
- CockroachDB
- ClickHouse

## 开始使用

安装依赖并启动本地 Web 开发服务：

```bash
npm install
npm run dev
```

默认访问地址为 `http://localhost:5173`。终端会在端口变化时显示实际地址。

## 构建 Web 版本

```bash
npm install
npm run build
```

如需启用 OpenAI 能力，可在构建时提供 API Key：

```bash
VITE_OPENAI_API_KEY=<YOUR_OPEN_AI_KEY> npm run build
```

构建结果位于 `dist/`。

## 构建 macOS 桌面应用

桌面端基于 Electron。以下命令会先执行 Web 构建，再启动或打包桌面应用。

只在本地启动 Electron，不生成安装包：

```bash
npm run desktop:dev
```

为 Apple Silicon Mac 构建 DMG：

```bash
npm run desktop:build:mac
```

为 Intel Mac 构建 DMG：

```bash
npm run desktop:build:mac:x64
```

同时构建 Apple Silicon 和 Intel 两种 DMG：

```bash
npm run desktop:build:mac:all
```

安装包及相关产物位于 `release/`。

当前配置未包含 Apple Developer 签名和公证。将 DMG 分发给其他用户时，macOS Gatekeeper 可能提示无法验证开发者；正式公开分发前应配置签名和公证。

## 使用 Docker

运行官方镜像：

```bash
docker run -e OPENAI_API_KEY=<YOUR_OPEN_AI_KEY> -p 8080:80 ghcr.io/chartdb/chartdb:latest
```

本地构建并运行：

```bash
docker build -t chartdb .
docker run -e OPENAI_API_KEY=<YOUR_OPEN_AI_KEY> -p 8080:80 chartdb
```

浏览器访问 `http://localhost:8080`。

使用自定义推理服务：

```bash
docker build \
  --build-arg VITE_OPENAI_API_ENDPOINT=<YOUR_ENDPOINT> \
  --build-arg VITE_LLM_MODEL_NAME=<YOUR_MODEL_NAME> \
  -t chartdb .

docker run \
  -e OPENAI_API_ENDPOINT=<YOUR_ENDPOINT> \
  -e LLM_MODEL_NAME=<YOUR_MODEL_NAME> \
  -p 8080:80 chartdb
```

如需关闭分析统计，可在运行时增加 `-e DISABLE_ANALYTICS=true`，或在构建时增加 `--build-arg VITE_DISABLE_ANALYTICS=true`。

AI 能力应在 OpenAI API Key 和自定义推理服务两种方式中选择一种，不要同时配置。

## 测试与代码检查

运行测试：

```bash
npm run test:ci
```

运行 ESLint：

```bash
npm run lint
```

执行 TypeScript 类型检查：

```bash
npx tsc -b --pretty false
```

## 在线体验

1. 打开 [ChartDB.io](https://chartdb.io?ref=github_readme_2)。
2. 点击“Go to app”。
3. 选择数据库类型。
4. 在数据库中运行页面提供的查询。
5. 将查询结果复制到 ChartDB。
6. 查看并编辑数据库关系图。

## 社区与支持

- [Discord](https://discord.gg/QeFwyWSKwC)
- [GitHub Issues](https://github.com/chartdb/chartdb/issues)
- [Twitter](https://x.com/intent/follow?screen_name=jonathanfishner)

## 参与贡献

欢迎向上游或本 Fork 提交通用改进。参与前请阅读上游的 [贡献指南](./CONTRIBUTING.md) 和 [贡献者行为准则](./CODE_OF_CONDUCT.md)。

## 许可证

ChartDB 使用 [GNU Affero General Public License v3.0](./LICENSE) 开源。本 Fork 延续相同许可证，使用和分发时应遵守相应条款。
