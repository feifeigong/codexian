# Codexian 架构升级计划：从 exec 一次性模式 → JSON流式智能模式

## 目标
让Codexian像Claudian一样能智能操作Obsidian vault（创建文件夹、写笔记、执行命令），同时保持现有UI不变。

## 核心发现

Codex CLI v0.101.0 支持：
- `codex exec --json` → JSONL流式事件输出
- `codex exec resume <SESSION_ID>` → 会话恢复（多轮对话上下文）
- `--full-auto` → 自动审批工具调用（对应YOLO模式）
- `-C <DIR>` → 设置工作目录
- `--add-dir <DIR>` → 额外可写目录

### JSONL事件格式
```
thread.started  → {"type":"thread.started","thread_id":"UUID"}
turn.started    → {"type":"turn.started"}
item.completed  → {"type":"item.completed","item":{"type":"reasoning|agent_message|command_execution",...}}
item.started    → {"type":"item.started","item":{"type":"command_execution","command":"...","status":"in_progress"}}
turn.completed  → {"type":"turn.completed","usage":{...}}
```

## 修改范围

### 1. CodexRunner.ts — 完全重写

**新增 `runCodexStream()` 函数**，替代原来的 `runCodex()`：
- 使用 `codex exec --json` 启动
- 首次对话：`codex exec --json --skip-git-repo-check -C <vaultPath> -m <model> "<prompt>"`
- 后续对话：`codex exec resume --json --skip-git-repo-check -m <model> <threadId> "<prompt>"`
- YOLO开启时加 `--full-auto`，关闭时不加
- 逐行解析stdout的JSONL事件
- 通过回调函数实时推送事件给UI

**接口设计：**
```typescript
interface CodexEvent {
  type: "thread_started" | "turn_started" | "reasoning" | "agent_message" |
        "command_started" | "command_completed" | "turn_completed" | "error";
  threadId?: string;
  text?: string;
  command?: string;
  exitCode?: number;
  output?: string;
  usage?: { input_tokens: number; output_tokens: number };
}

function runCodexStream(opts: {
  codexPath: string;
  timeoutMs: number;
  promptText: string;
  model: string;
  threadId?: string;    // 有值则走resume
  yolo: boolean;
  cwd?: string;
  onEvent: (event: CodexEvent) => void;
}): Promise<{ ok: boolean; threadId: string | null }>;
```

### 2. main.ts — ChatSession增加threadId

```typescript
export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  threadId?: string;      // 新增：Codex会话ID，用于resume
}

export type ChatRole = "user" | "assistant" | "error" | "tool";  // 新增 tool 角色
```

### 3. CodexView.ts — onSend() 改为流式处理

**修改 `onSend()`：**
- 调用 `runCodexStream()` 替代 `runCodex()`
- 通过 `onEvent` 回调实时更新UI：
  - `thread_started` → 保存threadId到ChatSession
  - `reasoning` → 更新"Thinking..."为思考内容（可选显示）
  - `agent_message` → 实时追加文本到assistant消息气泡
  - `command_started` → 在消息区域显示"▶ Bash: ls xxx"工具调用条
  - `command_completed` → 更新工具状态为✓或✗
  - `turn_completed` → 结束加载状态

**修改 `renderMessages()`：**
- 支持渲染 `role: "tool"` 类型的消息（显示命令执行条）

**Obsidian上下文：**
- 保留 `buildObsidianPrompt()` 给首次对话的prompt加上下文
- resume对话不需要重复加上下文（Codex会记住）

### 4. styles.css — 新增工具调用样式

```css
.codexian-tool-call     — 工具调用容器
.codexian-tool-icon     — 终端图标
.codexian-tool-label    — "Bash: ls xxx" 文字
.codexian-tool-status   — ✓/✗ 状态图标
```

### 5. 存入笔记按钮 — 移除

移除上一轮添加的"Save to note"按钮，只保留复制按钮。

## 不改动的内容
- 整体UI布局（header、tabs、composer、controls bar）
- 历史记录功能
- 文件夹选择器（External Contexts）
- 样式/主题
- 设置页面

## 执行顺序
1. 修改 main.ts（ChatSession类型、ChatRole类型）
2. 重写 CodexRunner.ts（runCodexStream）
3. 修改 CodexView.ts（onSend流式化、renderMessages支持tool、移除save按钮）
4. 新增 styles.css 工具调用样式
5. 构建测试
