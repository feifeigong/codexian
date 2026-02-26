# Codexian - Obsidian Plugin

一个强大的 Obsidian 插件脚手架，提供侧边栏视图和丰富的设置选项。

## ✨ 特性

- 📊 右侧侧边栏 `Codexian` 视图（本地消息回显）
- ⚙️ 完整的插件设置页面
  - `codexPath`: Codex CLI 路径配置
  - `timeoutMs`: 超时时间设置
  - `maxContextChars`: 最大上下文字符数
  - `contextMode`: 上下文模式选择
- 🎨 现代化的用户界面
- 🔧 TypeScript 开发支持

## 📦 安装

### 方法 1: 手动安装

1. 从 [Releases](https://github.com/feifeigong/obsidian-codexian/releases) 下载最新版本
2. 解压文件到 Obsidian 插件目录: `<vault>/.obsidian/plugins/codexian/`
3. 重启 Obsidian
4. 在设置中启用 `Codexian` 插件

### 方法 2: 从源码构建

```bash
# 克隆仓库
git clone https://github.com/feifeigong/obsidian-codexian.git
cd obsidian-codexian

# 安装依赖
npm install

# 构建插件
npm run build

# 复制文件到 Obsidian 插件目录
# 将 manifest.json、main.js、styles.css 复制到 
# <vault>/.obsidian/plugins/codexian/
```

## 🛠️ 开发

```bash
# 开发模式（监听文件变化并自动构建）
npm run dev

# 生产构建
npm run build
```

## 📖 使用说明

1. 安装并启用插件后，点击右侧边栏的 Codexian 图标
2. 在设置页面配置相关参数
3. 开始使用插件功能

## 🔄 路线图

- [ ] 实现 Codex CLI 调用逻辑
- [ ] 增强消息处理功能
- [ ] 添加更多自定义选项
- [ ] 改进用户界面和交互体验

## 📝 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 👤 作者

**Codexian Team**

- GitHub: [@feifeigong](https://github.com/feifeigong)

## 🙏 致谢

感谢 Obsidian 社区的支持和贡献。

---

**Note**: 此项目正在积极开发中，欢迎反馈和建议！
