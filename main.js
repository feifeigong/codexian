"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => CodexianPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  codexPath: "codex",
  timeoutMs: 6e5,
  maxContextChars: 8e3,
  contextMode: "selection",
  models: [
    "gpt-5.3-codex",
    "gpt-5.2-codex",
    "gpt-5.1-codex-max",
    "gpt-5.2",
    "gpt-5.1-codex-mini"
  ].join("\n"),
  defaultModel: "gpt-5.3-codex",
  reasoningLevel: "medium",
  permissionMode: "default",
  reasoningArgsLow: '-c model_reasoning_effort="low"',
  reasoningArgsMedium: '-c model_reasoning_effort="medium"',
  reasoningArgsHigh: '-c model_reasoning_effort="high"',
  reasoningArgsExtraHigh: '-c model_reasoning_effort="high"',
  permissionArgsReadOnly: "--sandbox read-only",
  permissionArgsDefault: "--sandbox workspace-write",
  permissionArgsFullAccess: "--sandbox danger-full-access",
  extraArgs: "--skip-git-repo-check"
};
var CodexianSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Codexian Settings" });
    new import_obsidian.Setting(containerEl).setName("Codex executable path").setDesc("Use codex or an absolute path").addText(
      (text) => text.setPlaceholder("codex").setValue(this.plugin.settings.codexPath).onChange(async (value) => {
        this.plugin.settings.codexPath = value.trim() || "codex";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Timeout (ms)").setDesc("Execution timeout in milliseconds").addText(
      (text) => text.setValue(String(this.plugin.settings.timeoutMs)).onChange(async (value) => {
        const parsed = Number(value);
        this.plugin.settings.timeoutMs = Number.isFinite(parsed) && parsed > 0 ? parsed : 12e4;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Max context chars").setDesc("Reserved for context truncation logic").addText(
      (text) => text.setValue(String(this.plugin.settings.maxContextChars)).onChange(async (value) => {
        const parsed = Number(value);
        this.plugin.settings.maxContextChars = Number.isFinite(parsed) && parsed > 0 ? parsed : 8e3;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Context mode").setDesc("selection / note / selection+note").addDropdown(
      (dropdown) => dropdown.addOption("selection", "selection").addOption("note", "note").addOption("selection+note", "selection+note").setValue(this.plugin.settings.contextMode).onChange(async (value) => {
        this.plugin.settings.contextMode = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Models").setDesc("One model per line, used by the sidebar model selector").addTextArea(
      (text) => text.setValue(this.plugin.settings.models).onChange(async (value) => {
        this.plugin.settings.models = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Default model").setDesc("Example: gpt-5.3-codex").addText(
      (text) => text.setValue(this.plugin.settings.defaultModel).onChange(async (value) => {
        this.plugin.settings.defaultModel = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Reasoning level default").setDesc("low / medium / high / extra_high").addDropdown(
      (dropdown) => dropdown.addOption("low", "low").addOption("medium", "medium").addOption("high", "high").addOption("extra_high", "extra_high").setValue(this.plugin.settings.reasoningLevel).onChange(async (value) => {
        this.plugin.settings.reasoningLevel = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Permission mode default").setDesc("read_only / default / full_access").addDropdown(
      (dropdown) => dropdown.addOption("read_only", "read_only").addOption("default", "default").addOption("full_access", "full_access").setValue(this.plugin.settings.permissionMode).onChange(async (value) => {
        this.plugin.settings.permissionMode = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Reasoning args: low").setDesc('Space-separated string, split(" ") at runtime').addText(
      (text) => text.setValue(this.plugin.settings.reasoningArgsLow).onChange(async (value) => {
        this.plugin.settings.reasoningArgsLow = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Reasoning args: medium").setDesc('Space-separated string, split(" ") at runtime').addText(
      (text) => text.setValue(this.plugin.settings.reasoningArgsMedium).onChange(async (value) => {
        this.plugin.settings.reasoningArgsMedium = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Reasoning args: high").setDesc('Space-separated string, split(" ") at runtime').addText(
      (text) => text.setValue(this.plugin.settings.reasoningArgsHigh).onChange(async (value) => {
        this.plugin.settings.reasoningArgsHigh = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Reasoning args: extra_high").setDesc('Space-separated string, split(" ") at runtime').addText(
      (text) => text.setValue(this.plugin.settings.reasoningArgsExtraHigh).onChange(async (value) => {
        this.plugin.settings.reasoningArgsExtraHigh = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Permission args: read_only").setDesc('Space-separated string, split(" ") at runtime').addText(
      (text) => text.setValue(this.plugin.settings.permissionArgsReadOnly).onChange(async (value) => {
        this.plugin.settings.permissionArgsReadOnly = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Permission args: default").setDesc('Space-separated string, split(" ") at runtime').addText(
      (text) => text.setValue(this.plugin.settings.permissionArgsDefault).onChange(async (value) => {
        this.plugin.settings.permissionArgsDefault = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Permission args: full_access").setDesc('Space-separated string, split(" ") at runtime').addText(
      (text) => text.setValue(this.plugin.settings.permissionArgsFullAccess).onChange(async (value) => {
        this.plugin.settings.permissionArgsFullAccess = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Extra args").setDesc('Space-separated string, split(" ") at runtime').addText(
      (text) => text.setValue(this.plugin.settings.extraArgs).onChange(async (value) => {
        this.plugin.settings.extraArgs = value;
        await this.plugin.saveSettings();
      })
    );
  }
};

// src/view/CodexView.ts
var import_obsidian2 = require("obsidian");

// src/core/CodexRunner.ts
var import_child_process = require("child_process");
var import_fs = require("fs");
var import_os = require("os");
var import_path = require("path");
function forceKill(child) {
  if (child.pid == null) return;
  try {
    if (process.platform === "win32") {
      (0, import_child_process.exec)(`taskkill /F /T /PID ${child.pid}`);
    } else {
      child.kill("SIGKILL");
    }
  } catch (e) {
  }
}
function psQuote(s) {
  return `'${s.replace(/'/g, "''")}'`;
}
async function runCodexStream(opts) {
  const timeout = Number.isFinite(opts.timeoutMs) && opts.timeoutMs > 0 ? opts.timeoutMs : 6e5;
  const cmdArgs = [];
  if (opts.threadId) {
    cmdArgs.push("exec", "resume");
  } else {
    cmdArgs.push("exec");
  }
  cmdArgs.push("--json");
  cmdArgs.push("-m", opts.model);
  cmdArgs.push("--full-auto");
  if (opts.reasoningArgs) {
    cmdArgs.push(...opts.reasoningArgs);
  }
  if (opts.extraArgs) {
    cmdArgs.push(...opts.extraArgs);
  }
  if (opts.cwd && !opts.threadId) {
    cmdArgs.push("-C", opts.cwd);
  }
  if (opts.threadId) {
    cmdArgs.push(opts.threadId);
  }
  const tmpFile = (0, import_path.join)((0, import_os.tmpdir)(), `codex-prompt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`);
  (0, import_fs.writeFileSync)(tmpFile, opts.promptText, "utf8");
  const cleanupTmpFile = () => {
    try {
      (0, import_fs.unlinkSync)(tmpFile);
    } catch (e) {
    }
  };
  return new Promise((resolve) => {
    let threadId = null;
    let settled = false;
    let timedOut = false;
    let stderrBuf = "";
    let child;
    if (process.platform === "win32") {
      const psArgs = cmdArgs.map((a) => psQuote(a)).join(" ");
      const psCommand = [
        `$p = [IO.File]::ReadAllText(${psQuote(tmpFile)}, [Text.Encoding]::UTF8).TrimEnd()`,
        `& ${psQuote(opts.codexPath)} ${psArgs} $p`
      ].join("; ");
      child = (0, import_child_process.spawn)("powershell.exe", ["-NoProfile", "-Command", psCommand], {
        env: process.env,
        cwd: opts.cwd || void 0,
        windowsHide: true
      });
    } else {
      const shellArgs = cmdArgs.map((a) => `'${a.replace(/'/g, "'\\''")}'`).join(" ");
      const fullCmd = `'${opts.codexPath.replace(/'/g, "'\\''")}' ${shellArgs} "$(cat '${tmpFile}')"`;
      child = (0, import_child_process.spawn)(fullCmd, [], {
        shell: true,
        env: process.env,
        cwd: opts.cwd || void 0
      });
    }
    const timer = setTimeout(() => {
      timedOut = true;
      forceKill(child);
    }, timeout);
    let aborted = false;
    if (opts.abortSignal) {
      opts.abortSignal.onAbort(() => {
        aborted = true;
        forceKill(child);
      });
    }
    let lineBuf = "";
    child.stdout.on("data", (chunk) => {
      var _a;
      lineBuf += chunk.toString();
      const lines = lineBuf.split("\n");
      lineBuf = (_a = lines.pop()) != null ? _a : "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);
          const event = parseCodexMessage(msg);
          if (event) {
            if (event.type === "thread_started" && event.threadId) {
              threadId = event.threadId;
            }
            opts.onEvent(event);
          }
        } catch (e) {
        }
      }
    });
    child.stderr.on("data", (chunk) => {
      stderrBuf += chunk.toString();
    });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanupTmpFile();
      opts.onEvent({ type: "error", text: error.message });
      resolve({ ok: false, threadId, errorMsg: error.message });
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanupTmpFile();
      if (lineBuf.trim()) {
        try {
          const msg = JSON.parse(lineBuf.trim());
          const event = parseCodexMessage(msg);
          if (event) {
            if (event.type === "thread_started" && event.threadId) {
              threadId = event.threadId;
            }
            opts.onEvent(event);
          }
        } catch (e) {
        }
      }
      if (aborted) {
        resolve({ ok: true, threadId, errorMsg: "Interrupted" });
        return;
      }
      if (timedOut) {
        opts.onEvent({ type: "error", text: `Timeout after ${timeout}ms` });
        resolve({ ok: false, threadId, errorMsg: `Timeout after ${timeout}ms` });
        return;
      }
      const ok = code === 0;
      if (!ok && stderrBuf.trim()) {
        opts.onEvent({ type: "error", text: stderrBuf.trim() });
      }
      resolve({ ok, threadId, errorMsg: ok ? void 0 : stderrBuf.trim() || `Exit code ${code}` });
    });
  });
}
function parseCodexMessage(msg) {
  var _a, _b;
  const type = msg.type;
  switch (type) {
    case "thread.started":
      return { type: "thread_started", threadId: msg.thread_id };
    case "turn.started":
      return { type: "turn_started" };
    case "turn.completed": {
      const usage = msg.usage;
      return {
        type: "turn_completed",
        usage: usage ? { input_tokens: (_a = usage.input_tokens) != null ? _a : 0, output_tokens: (_b = usage.output_tokens) != null ? _b : 0 } : void 0
      };
    }
    case "item.started": {
      const item = msg.item;
      if ((item == null ? void 0 : item.type) === "command_execution") {
        return {
          type: "command_started",
          command: item.command,
          status: "running"
        };
      }
      return null;
    }
    case "item.completed": {
      const item = msg.item;
      if (!item) return null;
      switch (item.type) {
        case "agent_message":
          return { type: "agent_message", text: item.text };
        case "reasoning":
          return { type: "reasoning", text: item.text };
        case "command_execution":
          return {
            type: "command_completed",
            command: item.command,
            exitCode: item.exit_code,
            output: item.aggregated_output,
            status: item.status
          };
        default:
          return null;
      }
    }
    default:
      return null;
  }
}

// src/view/CodexView.ts
var VIEW_TYPE_CODEXIAN = "codexian-view";
var REASONING_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  extra_high: "Extra High"
};
var CodexView = class extends import_obsidian2.ItemView {
  // dismissed file path for current view
  constructor(leaf, plugin) {
    super(leaf);
    this.store = null;
    this.contentEl_ = null;
    this.tabsEl = null;
    this.messagesEl = null;
    this.inputEl = null;
    this.spinnerWrapEl = null;
    this.modelLabelEl = null;
    this.thinkingLabelEl = null;
    this.yoloTrackEl = null;
    this.statusEl = null;
    this.externalContextsEl = null;
    this.folderBtnEl = null;
    this.busy = false;
    this.abortController = null;
    this.currentModel = "";
    this.currentThinking = "medium";
    this.currentYolo = false;
    this.externalContextPaths = [];
    this.persistentPaths = /* @__PURE__ */ new Set();
    this.activeFileContextEl = null;
    this.dismissedFile = null;
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_CODEXIAN;
  }
  getDisplayText() {
    return "Codexian";
  }
  getIcon() {
    return "message-square";
  }
  async onOpen() {
    this.contentEl_ = this.containerEl.children[1];
    this.contentEl_.empty();
    this.contentEl_.addClass("codexian-root");
    this.store = this.plugin.getStore();
    this.initState();
    this.mountUI();
    this.renderAll();
  }
  async onClose() {
    this.closeAllDropups();
    if (this.contentEl_) this.contentEl_.empty();
    this.store = null;
    this.tabsEl = null;
    this.messagesEl = null;
    this.inputEl = null;
    this.spinnerWrapEl = null;
    this.modelLabelEl = null;
    this.thinkingLabelEl = null;
    this.yoloTrackEl = null;
    this.statusEl = null;
    this.externalContextsEl = null;
    this.folderBtnEl = null;
    this.contentEl_ = null;
  }
  /* ───────── Init ───────── */
  initState() {
    if (!this.store) return;
    const models = this.getModelOptions();
    this.currentModel = this.selectInitialModel(models);
    this.currentThinking = this.selectInitialThinking();
    this.currentYolo = this.store.ui.yolo;
  }
  /* ───────── Mount UI ───────── */
  mountUI() {
    if (!this.store || !this.contentEl_) return;
    const root = this.contentEl_.createDiv({ cls: "codexian-ui" });
    const header = root.createDiv({ cls: "codexian-header" });
    const titleRow = header.createDiv({ cls: "codexian-title-row" });
    const iconWrap = titleRow.createDiv({ cls: "codexian-brand-icon" });
    iconWrap.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.28 9.82a5.98 5.98 0 00-.52-4.91A6.05 6.05 0 0015.25 2a6.07 6.07 0 00-10.27 2.18A5.98 5.98 0 00.98 7.08a6.05 6.05 0 00.74 7.1 5.98 5.98 0 00.51 4.91 6.05 6.05 0 006.51 2.9A5.98 5.98 0 0013.26 24a6.06 6.06 0 005.77-4.21 5.99 5.99 0 004-2.9 6.06 6.06 0 00-.75-7.07zM13.26 22.43a4.48 4.48 0 01-2.88-1.04l.14-.08 4.78-2.76a.78.78 0 00.39-.68v-6.74l2.02 1.17a.07.07 0 01.04.05v5.58a4.5 4.5 0 01-4.49 4.5zM3.6 18.6a4.48 4.48 0 01-.54-3.02l.14.08 4.78 2.76a.78.78 0 00.79 0l5.83-3.37v2.33a.07.07 0 01-.03.06l-4.83 2.79a4.5 4.5 0 01-6.14-1.63zM2.34 7.9A4.48 4.48 0 014.68 5.9v5.72a.78.78 0 00.39.68l5.83 3.36-2.02 1.17a.07.07 0 01-.07 0l-4.83-2.79A4.5 4.5 0 012.34 7.9zm17.48 4.07l-5.83-3.37L16 7.44a.07.07 0 01.07 0l4.83 2.79a4.5 4.5 0 01-.7 8.1v-5.68a.78.78 0 00-.39-.68zm2.01-3.02l-.14-.09-4.78-2.76a.78.78 0 00-.79 0L10.3 9.47V7.14a.07.07 0 01.03-.06l4.83-2.79a4.5 4.5 0 016.68 4.66zm-12.64 4.17L7.16 11.95a.07.07 0 01-.04-.06V6.31a4.5 4.5 0 017.38-3.46l-.14.08-4.78 2.76a.78.78 0 00-.4.68zm1.1-2.37l2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5z"/></svg>`;
    titleRow.createDiv({ cls: "codexian-title", text: "Codexian" });
    this.messagesEl = root.createDiv({ cls: "codexian-messages" });
    const composerEl = root.createDiv({ cls: "codexian-composer" });
    const tabsRow = composerEl.createDiv({ cls: "codexian-tabs-bottom" });
    this.tabsEl = tabsRow;
    const actionsDiv = tabsRow.createDiv({ cls: "codexian-tab-actions" });
    const addNewBtn = actionsDiv.createEl("button", {
      cls: "codexian-action-btn",
      attr: { "aria-label": "New chat", title: "New chat" }
    });
    addNewBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
    addNewBtn.addEventListener("click", () => void this.addSession());
    const editBtn = actionsDiv.createEl("button", {
      cls: "codexian-action-btn",
      attr: { "aria-label": "Clear chat", title: "Clear chat" }
    });
    editBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    editBtn.addEventListener("click", () => void this.clearChat());
    const historyBtn = actionsDiv.createEl("button", {
      cls: "codexian-action-btn",
      attr: { "aria-label": "History", title: "History" }
    });
    historyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    historyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showHistoryPopup(historyBtn);
    });
    const inputContainer = composerEl.createDiv({ cls: "codexian-input-container" });
    this.activeFileContextEl = inputContainer.createDiv({ cls: "codexian-active-file-ctx" });
    this.renderActiveFileContext();
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.dismissedFile = null;
        this.renderActiveFileContext();
      })
    );
    this.inputEl = inputContainer.createEl("textarea", {
      cls: "codexian-input",
      attr: { placeholder: "How can I help you today?", rows: "3" }
    });
    this.inputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void this.onSend();
      }
      if (event.key === "Escape" && this.busy && this.abortController) {
        event.preventDefault();
        event.stopPropagation();
        this.abortController.abort();
      }
    });
    this.containerEl.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.busy && this.abortController) {
        event.preventDefault();
        event.stopPropagation();
        this.abortController.abort();
      }
    });
    root.setAttribute("tabindex", "-1");
    this.externalContextsEl = inputContainer.createDiv({ cls: "codexian-external-contexts" });
    this.renderExternalContexts();
    const controlsEl = composerEl.createDiv({ cls: "codexian-controls-bar" });
    const modelDropup = controlsEl.createDiv({ cls: "codexian-dropup-trigger" });
    this.modelLabelEl = modelDropup.createSpan({ cls: "codexian-dropup-label codexian-model-label-brand" });
    this.modelLabelEl.setText(this.shortModelName(this.currentModel));
    modelDropup.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showModelDropup(modelDropup);
    });
    const thinkDropup = controlsEl.createDiv({ cls: "codexian-dropup-trigger" });
    thinkDropup.createSpan({ cls: "codexian-dropup-prefix", text: "Thinking:" });
    this.thinkingLabelEl = thinkDropup.createSpan({ cls: "codexian-dropup-label" });
    this.thinkingLabelEl.setText(REASONING_LABELS[this.currentThinking]);
    thinkDropup.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showThinkingDropup(thinkDropup);
    });
    this.spinnerWrapEl = controlsEl.createDiv({ cls: "codexian-spinner-wrap" });
    this.spinnerWrapEl.innerHTML = `<svg class="codexian-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2a10 10 0 0 1 10 10" opacity="0.9"/><path d="M12 2a10 10 0 0 0-10 10" opacity="0.3"/></svg>`;
    this.folderBtnEl = controlsEl.createEl("button", {
      cls: "codexian-folder-btn",
      attr: { "aria-label": "Add external context", title: "Add external context" }
    });
    this.folderBtnEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
    this.folderBtnEl.addEventListener("click", () => {
      void this.openFolderPicker();
    });
    const yoloWrap = controlsEl.createDiv({ cls: "codexian-toggle-wrap" });
    yoloWrap.createSpan({ cls: "codexian-toggle-label", text: "YOLO" });
    this.yoloTrackEl = yoloWrap.createDiv({
      cls: `codexian-toggle-track${this.currentYolo ? " active" : ""}`
    });
    this.yoloTrackEl.createDiv({ cls: "codexian-toggle-knob" });
    this.yoloTrackEl.addEventListener("click", () => this.toggleYolo());
    this.statusEl = header.createDiv({ cls: "codexian-status", text: "Ready" });
  }
  /* ───────── Render ───────── */
  renderAll() {
    this.renderTabs();
    this.renderMessages();
    this.setStatus("Ready");
  }
  renderTabs() {
    if (!this.tabsEl || !this.store) return;
    this.tabsEl.querySelectorAll(".codexian-tab").forEach((t) => t.remove());
    if (this.store.openTabIds.length < 2) return;
    const actionsDiv = this.tabsEl.querySelector(".codexian-tab-actions");
    this.store.openTabIds.forEach((tabId, index) => {
      const isActive = tabId === this.store.activeChatId;
      const tab = this.tabsEl.createDiv({
        cls: `codexian-tab${isActive ? " active" : ""}`,
        text: String(index + 1)
      });
      tab.addEventListener("click", () => void this.switchSession(tabId));
      const delBtn = tab.createSpan({ cls: "codexian-tab-delete", text: "\xD7" });
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        void this.closeTab(tabId);
      });
      if (actionsDiv) {
        this.tabsEl.insertBefore(tab, actionsDiv);
      }
    });
  }
  renderMessages() {
    if (!this.messagesEl || !this.store) return;
    this.messagesEl.empty();
    const chat = this.getActiveChat();
    if (chat.messages.length === 0) {
      if (!chat.greeting) {
        chat.greeting = this.randomGreeting();
      }
      const empty = this.messagesEl.createDiv({ cls: "codexian-empty-state" });
      empty.createDiv({ cls: "codexian-empty-text", text: chat.greeting });
      return;
    }
    chat.messages.forEach((message) => {
      if (message.role === "tool") {
        const row2 = this.messagesEl.createDiv({ cls: "codexian-message-row tool" });
        const toolCall = row2.createDiv({ cls: `codexian-tool-call ${message.toolStatus || "running"}` });
        const iconEl = toolCall.createSpan({ cls: "codexian-tool-icon" });
        if (message.toolStatus === "running") {
          iconEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2a10 10 0 0 1 10 10" opacity="0.9"/><path d="M12 2a10 10 0 0 0-10 10" opacity="0.3"/></svg>`;
          iconEl.addClass("spinning");
        } else if (message.toolStatus === "completed") {
          iconEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
        } else {
          iconEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        }
        const cmdText = message.command || "command";
        const shortCmd = cmdText.length > 60 ? cmdText.slice(0, 57) + "..." : cmdText;
        toolCall.createSpan({ cls: "codexian-tool-label", text: `Bash: ${shortCmd}` });
        if (message.content && message.toolStatus !== "running") {
          const expandBtn = toolCall.createSpan({ cls: "codexian-tool-expand" });
          expandBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
          const outputEl = row2.createDiv({ cls: "codexian-tool-output" });
          outputEl.style.display = "none";
          const pre = outputEl.createEl("pre");
          pre.setText(message.content.length > 2e3 ? message.content.slice(0, 2e3) + "\n..." : message.content);
          toolCall.style.cursor = "pointer";
          toolCall.addEventListener("click", () => {
            const visible = outputEl.style.display !== "none";
            outputEl.style.display = visible ? "none" : "block";
            expandBtn.toggleClass("expanded", !visible);
          });
        }
        return;
      }
      const row = this.messagesEl.createDiv({ cls: `codexian-message-row ${message.role}` });
      const bubble = row.createDiv({ cls: `codexian-bubble ${message.role}` });
      if (message.role === "user") {
        bubble.setText(message.content);
      } else {
        void import_obsidian2.MarkdownRenderer.render(
          this.app,
          message.content,
          bubble,
          "",
          this
        );
      }
      const actionsWrap = row.createDiv({ cls: "codexian-msg-actions" });
      const copyBtn = actionsWrap.createDiv({ cls: "codexian-msg-action-btn" });
      copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
      copyBtn.setAttribute("title", "Copy");
      copyBtn.addEventListener("click", () => {
        void navigator.clipboard.writeText(message.content);
        copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
        copyBtn.addClass("copied");
        window.setTimeout(() => {
          copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
          copyBtn.removeClass("copied");
        }, 1500);
      });
    });
    this.scrollToBottom();
  }
  /* ───────── Session Management (Claudian-style unified model) ───────── */
  getActiveChat() {
    if (!this.store) throw new Error("Store not initialized");
    const id = this.plugin.ensureActiveChat(this.store);
    const found = this.store.chats.find((chat) => chat.id === id);
    if (found) return found;
    const created = {
      id,
      title: "New Chat",
      createdAt: Date.now(),
      messages: []
    };
    this.store.chats.push(created);
    if (!this.store.openTabIds.includes(id)) {
      this.store.openTabIds.push(id);
    }
    return created;
  }
  async switchSession(id) {
    if (!this.store) return;
    this.store.activeChatId = id;
    await this.plugin.saveStore(this.store);
    this.renderTabs();
    this.renderMessages();
  }
  async addSession() {
    if (!this.store) return;
    if (this.store.openTabIds.length >= 3) {
      new import_obsidian2.Notice("Maximum 3 tabs allowed");
      return;
    }
    const newId = `chat-${Date.now()}`;
    const newChat = {
      id: newId,
      title: "New Chat",
      createdAt: Date.now(),
      messages: []
    };
    this.store.chats.push(newChat);
    this.store.openTabIds.push(newId);
    this.store.activeChatId = newId;
    await this.plugin.saveStore(this.store);
    this.renderTabs();
    this.renderMessages();
  }
  /** Close a tab (remove from openTabIds). Conversation stays in chats. */
  async closeTab(id) {
    if (!this.store || this.store.openTabIds.length <= 1) return;
    this.store.openTabIds = this.store.openTabIds.filter((t) => t !== id);
    if (this.store.activeChatId === id) {
      this.store.activeChatId = this.store.openTabIds[0];
    }
    await this.plugin.saveStore(this.store);
    this.renderTabs();
    this.renderMessages();
  }
  /** Clear current chat: keep old conversation in chats, create new empty one for this tab. */
  async clearChat() {
    if (!this.store) return;
    const oldChat = this.getActiveChat();
    if (oldChat.messages.length > 0 && (oldChat.title === "New Chat" || oldChat.title === "Default Session")) {
      const firstUserMsg = oldChat.messages.find((m) => m.role === "user");
      if (firstUserMsg) {
        oldChat.title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "");
      }
    }
    const newId = `chat-${Date.now()}`;
    const newChat = { id: newId, title: "New Chat", createdAt: Date.now(), messages: [] };
    this.store.chats.push(newChat);
    const tabIdx = this.store.openTabIds.indexOf(oldChat.id);
    if (tabIdx >= 0) {
      this.store.openTabIds[tabIdx] = newId;
    }
    this.store.activeChatId = newId;
    await this.plugin.saveStore(this.store);
    this.renderTabs();
    this.renderMessages();
  }
  /** Delete a conversation entirely from chats. */
  async deleteConversation(id) {
    if (!this.store) return;
    this.store.chats = this.store.chats.filter((c) => c.id !== id);
    const tabIdx = this.store.openTabIds.indexOf(id);
    if (tabIdx >= 0) {
      if (this.store.openTabIds.length <= 1) {
        const newId = `chat-${Date.now()}`;
        this.store.chats.push({ id: newId, title: "New Chat", createdAt: Date.now(), messages: [] });
        this.store.openTabIds[tabIdx] = newId;
        this.store.activeChatId = newId;
      } else {
        this.store.openTabIds.splice(tabIdx, 1);
        if (this.store.activeChatId === id) {
          this.store.activeChatId = this.store.openTabIds[0];
        }
      }
    }
    await this.plugin.saveStore(this.store);
    this.renderTabs();
    this.renderMessages();
  }
  /** Open a conversation: if already in a tab, switch to it; otherwise replace current tab. */
  async openConversation(id) {
    if (!this.store) return;
    if (this.store.openTabIds.includes(id)) {
      this.store.activeChatId = id;
    } else {
      const tabIdx = this.store.openTabIds.indexOf(this.store.activeChatId);
      if (tabIdx >= 0) {
        this.store.openTabIds[tabIdx] = id;
      }
      this.store.activeChatId = id;
    }
    await this.plugin.saveStore(this.store);
    this.renderTabs();
    this.renderMessages();
  }
  showHistoryPopup(anchor) {
    var _a, _b;
    this.closeAllDropups();
    if (!this.store) return;
    const menu = this.createDropupMenu(anchor);
    const panelEl = (_a = this.containerEl) == null ? void 0 : _a.closest(".workspace-leaf");
    if (panelEl) {
      const panelRect = panelEl.getBoundingClientRect();
      menu.style.left = `${panelRect.left + 16}px`;
      menu.style.right = `${window.innerWidth - panelRect.right + 16}px`;
      menu.style.minWidth = "unset";
    } else {
      menu.style.minWidth = "200px";
    }
    menu.createDiv({ cls: "codexian-history-header", text: "Conversations" });
    const list = menu.createDiv({ cls: "codexian-history-list" });
    const conversations = this.store.chats.filter((c) => c.messages.length > 0).sort((a, b) => {
      var _a2, _b2, _c, _d;
      const tsA = (_b2 = (_a2 = a.messages[a.messages.length - 1]) == null ? void 0 : _a2.ts) != null ? _b2 : a.createdAt;
      const tsB = (_d = (_c = b.messages[b.messages.length - 1]) == null ? void 0 : _c.ts) != null ? _d : b.createdAt;
      return tsB - tsA;
    });
    if (conversations.length === 0) {
      list.createDiv({ cls: "codexian-history-empty", text: "No conversations" });
    } else {
      for (const conv of conversations) {
        const isCurrent = conv.id === this.store.activeChatId;
        const row = list.createDiv({ cls: `codexian-history-item${isCurrent ? " active" : ""}` });
        const icon = row.createSpan({ cls: "codexian-history-icon" });
        icon.innerHTML = isCurrent ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>` : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`;
        const textWrap = row.createDiv({ cls: "codexian-history-text" });
        const firstUserMsg = conv.messages.find((m) => m.role === "user");
        const displayTitle = conv.title && conv.title !== "New Chat" && conv.title !== "Default Session" ? conv.title : firstUserMsg ? firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "") : "Untitled";
        const titleEl = textWrap.createDiv({ cls: "codexian-history-title", text: displayTitle });
        const lastMsg = conv.messages[conv.messages.length - 1];
        const timeTs = (_b = lastMsg == null ? void 0 : lastMsg.ts) != null ? _b : conv.createdAt;
        const timeText = isCurrent ? "Current session" : this.formatHistoryTime(timeTs);
        textWrap.createDiv({ cls: `codexian-history-time${isCurrent ? " current" : ""}`, text: timeText });
        const actionsWrap = row.createDiv({ cls: "codexian-history-actions" });
        const renameBtn = actionsWrap.createDiv({ cls: "codexian-history-action-btn" });
        renameBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
        renameBtn.setAttribute("title", "Rename");
        renameBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          titleEl.empty();
          const input = titleEl.createEl("input", {
            cls: "codexian-history-rename-input",
            attr: { type: "text", value: displayTitle }
          });
          input.focus();
          input.select();
          const commitRename = () => {
            const newName = input.value.trim();
            if (newName && newName !== displayTitle) {
              conv.title = newName;
              if (this.store) void this.plugin.saveStore(this.store);
            }
            titleEl.empty();
            titleEl.setText(newName || displayTitle);
          };
          input.addEventListener("keydown", (ke) => {
            if (ke.key === "Enter") {
              ke.preventDefault();
              commitRename();
            }
            if (ke.key === "Escape") {
              titleEl.empty();
              titleEl.setText(displayTitle);
            }
          });
          input.addEventListener("blur", () => commitRename());
        });
        const deleteBtn = actionsWrap.createDiv({ cls: "codexian-history-action-btn codexian-history-delete-btn" });
        deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
        deleteBtn.setAttribute("title", "Delete");
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          void this.deleteConversation(conv.id);
          menu.remove();
        });
        row.addEventListener("click", (e) => {
          e.stopPropagation();
          void this.openConversation(conv.id);
          menu.remove();
        });
      }
    }
    this.setupDropupClickAway(menu);
  }
  formatHistoryTime(ts) {
    const d = new Date(ts);
    const now = /* @__PURE__ */ new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return `${d.getMonth() + 1}\u6708${d.getDate()}\u65E5`;
  }
  /* ───────── Send ───────── */
  async onSend() {
    var _a, _b, _c, _d;
    if (this.busy || !this.store || !this.inputEl) return;
    const text = this.inputEl.value.trim();
    if (!text) return;
    this.busy = true;
    this.setBusy(true);
    this.inputEl.value = "";
    const chat = this.getActiveChat();
    const startTs = Date.now();
    chat.messages.push({ role: "user", content: text, ts: startTs });
    const assistantIdx = chat.messages.length;
    chat.messages.push({ role: "assistant", content: "Thinking...", ts: startTs + 1 });
    this.renderMessages();
    this.startFakeProgress();
    this.setStatus(`Running: ${this.shortModelName(this.currentModel)}`);
    await this.plugin.saveStore(this.store);
    let currentAssistantIdx = assistantIdx;
    let hasAssistantContent = false;
    try {
      const isResume = !!chat.threadId;
      const finalPrompt = isResume ? text : this.buildObsidianPrompt(text);
      const vaultPath = this.getVaultAbsolutePath();
      const settingsExtra = this.splitArgs(this.plugin.settings.extraArgs);
      const sandboxArgs = isResume ? [] : this.currentYolo ? this.splitArgs(this.plugin.settings.permissionArgsFullAccess) : this.splitArgs(this.plugin.settings.permissionArgsDefault);
      const filteredExtra = isResume ? settingsExtra.filter((a) => !a.startsWith("--sandbox") && !a.startsWith("--skip-git-repo")) : settingsExtra;
      const allExtra = [...filteredExtra, ...sandboxArgs];
      let abortFn = null;
      const abortSignal = {
        aborted: false,
        onAbort: (fn) => {
          abortFn = fn;
        }
      };
      this.abortController = {
        aborted: false,
        abort: () => {
          abortSignal.aborted = true;
          if (abortFn) abortFn();
        },
        onAbort: abortSignal.onAbort
      };
      const result = await runCodexStream({
        codexPath: this.plugin.settings.codexPath,
        timeoutMs: this.plugin.settings.timeoutMs,
        promptText: finalPrompt,
        model: this.currentModel,
        threadId: chat.threadId,
        yolo: this.currentYolo,
        cwd: vaultPath || void 0,
        reasoningArgs: this.getReasoningArgs(this.currentThinking),
        extraArgs: allExtra,
        abortSignal,
        onEvent: (event) => {
          var _a2;
          switch (event.type) {
            case "thread_started":
              if (event.threadId) chat.threadId = event.threadId;
              break;
            case "agent_message":
              if (!hasAssistantContent) {
                chat.messages[currentAssistantIdx] = {
                  role: "assistant",
                  content: event.text || "",
                  ts: Date.now()
                };
                hasAssistantContent = true;
              } else {
                currentAssistantIdx = chat.messages.length;
                chat.messages.push({
                  role: "assistant",
                  content: event.text || "",
                  ts: Date.now()
                });
              }
              this.renderMessages();
              break;
            case "reasoning":
              break;
            case "command_started":
              chat.messages.push({
                role: "tool",
                content: "",
                command: event.command,
                toolStatus: "running",
                ts: Date.now()
              });
              hasAssistantContent = true;
              this.renderMessages();
              break;
            case "command_completed":
              for (let i = chat.messages.length - 1; i >= 0; i--) {
                const m = chat.messages[i];
                if (m.role === "tool" && m.command === event.command && m.toolStatus === "running") {
                  m.toolStatus = event.exitCode === 0 ? "completed" : "error";
                  m.exitCode = event.exitCode;
                  m.content = event.output || "";
                  break;
                }
              }
              currentAssistantIdx = chat.messages.length;
              hasAssistantContent = false;
              this.renderMessages();
              break;
            case "error":
              chat.messages.push({
                role: "error",
                content: `**Error:** ${event.text || "Unknown error"}`,
                ts: Date.now()
              });
              this.renderMessages();
              break;
            case "turn_completed":
              if (!hasAssistantContent && ((_a2 = chat.messages[assistantIdx]) == null ? void 0 : _a2.content) === "Thinking...") {
                chat.messages[assistantIdx] = {
                  role: "assistant",
                  content: "Done.",
                  ts: Date.now()
                };
              }
              this.renderMessages();
              break;
          }
        }
      });
      this.store.diag.lastRunAt = startTs;
      this.store.diag.lastDurationMs = Date.now() - startTs;
      this.store.diag.lastExitCode = result.ok ? 0 : 1;
      this.store.diag.lastError = result.ok ? null : result.errorMsg || null;
      if (result.errorMsg === "Interrupted") {
        if (((_a = chat.messages[assistantIdx]) == null ? void 0 : _a.content) === "Thinking...") {
          chat.messages[assistantIdx] = {
            role: "error",
            content: "**Interrupted**",
            ts: Date.now()
          };
        } else {
          chat.messages.push({
            role: "error",
            content: "**Interrupted**",
            ts: Date.now()
          });
        }
      } else if (((_b = chat.messages[assistantIdx]) == null ? void 0 : _b.content) === "Thinking...") {
        chat.messages[assistantIdx] = {
          role: result.ok ? "assistant" : "error",
          content: result.ok ? "No output" : `**Error:** ${result.errorMsg || "Execution failed"}`,
          ts: Date.now()
        };
      }
    } catch (error) {
      const content = `**Error:** ${error instanceof Error ? error.message : "Execution failed"}`;
      if (((_c = chat.messages[assistantIdx]) == null ? void 0 : _c.content) === "Thinking...") {
        chat.messages[assistantIdx] = { role: "error", content, ts: Date.now() };
      } else {
        chat.messages.push({ role: "error", content, ts: Date.now() });
      }
      this.store.diag.lastRunAt = startTs;
      this.store.diag.lastDurationMs = Date.now() - startTs;
      this.store.diag.lastExitCode = 1;
      this.store.diag.lastError = content;
    } finally {
      this.abortController = null;
      this.stopProgress();
      this.renderMessages();
      await this.plugin.saveStore(this.store);
      this.setStatus("Ready");
      this.busy = false;
      this.setBusy(false);
      (_d = this.inputEl) == null ? void 0 : _d.focus();
    }
  }
  /* ───────── Dropup Menus ───────── */
  closeAllDropups() {
    document.querySelectorAll(".codexian-dropup-menu").forEach((el) => el.remove());
  }
  showModelDropup(anchor) {
    this.closeAllDropups();
    const models = this.getModelOptions();
    const menu = this.createDropupMenu(anchor);
    models.forEach((model) => {
      const item = menu.createDiv({
        cls: `codexian-dropup-item${model === this.currentModel ? " active" : ""}`,
        text: model
      });
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        this.currentModel = model;
        if (this.modelLabelEl) this.modelLabelEl.setText(this.shortModelName(model));
        if (this.store) {
          this.store.ui.model = model;
          this.plugin.settings.defaultModel = model;
          void this.plugin.saveStore(this.store);
          void this.plugin.saveSettings();
        }
        menu.remove();
      });
    });
    this.setupDropupClickAway(menu);
  }
  showThinkingDropup(anchor) {
    this.closeAllDropups();
    const menu = this.createDropupMenu(anchor);
    const levels = ["low", "medium", "high", "extra_high"];
    levels.forEach((level) => {
      const item = menu.createDiv({
        cls: `codexian-dropup-item${level === this.currentThinking ? " active" : ""}`,
        text: REASONING_LABELS[level]
      });
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        this.currentThinking = level;
        if (this.thinkingLabelEl) this.thinkingLabelEl.setText(REASONING_LABELS[level]);
        if (this.store) {
          this.store.ui.thinking = level;
          this.plugin.settings.reasoningLevel = level;
          void this.plugin.saveStore(this.store);
          void this.plugin.saveSettings();
        }
        menu.remove();
      });
    });
    this.setupDropupClickAway(menu);
  }
  createDropupMenu(anchor) {
    const menu = document.body.createDiv({ cls: "codexian-dropup-menu" });
    const rect = anchor.getBoundingClientRect();
    menu.style.left = `${rect.left}px`;
    menu.style.bottom = `${window.innerHeight - rect.top + 4}px`;
    menu.style.minWidth = `${rect.width}px`;
    return menu;
  }
  setupDropupClickAway(menu) {
    const handler = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener("click", handler, true);
      }
    };
    window.setTimeout(() => document.addEventListener("click", handler, true), 0);
  }
  /* ───────── External Contexts (Folder Picker) ───────── */
  async openFolderPicker() {
    try {
      const { remote } = require("electron");
      const result = await remote.dialog.showOpenDialog({
        properties: ["openDirectory"],
        title: "Select External Context"
      });
      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        if (this.externalContextPaths.includes(selectedPath)) {
          new import_obsidian2.Notice("This folder is already added as an external context.");
          return;
        }
        this.externalContextPaths.push(selectedPath);
        this.renderExternalContexts();
        this.updateFolderBtnState();
      }
    } catch (e) {
      new import_obsidian2.Notice("Unable to open folder picker.");
    }
  }
  renderActiveFileContext() {
    if (!this.activeFileContextEl) return;
    this.activeFileContextEl.empty();
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile || activeFile.path === this.dismissedFile) {
      this.activeFileContextEl.style.display = "none";
      return;
    }
    this.activeFileContextEl.style.display = "flex";
    const iconEl = this.activeFileContextEl.createSpan({ cls: "codexian-afc-icon" });
    iconEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    this.activeFileContextEl.createSpan({ cls: "codexian-afc-name", text: activeFile.name });
    const closeBtn = this.activeFileContextEl.createSpan({ cls: "codexian-afc-close" });
    closeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.dismissedFile = activeFile.path;
      this.renderActiveFileContext();
    });
  }
  renderExternalContexts() {
    if (!this.externalContextsEl) return;
    this.externalContextsEl.empty();
    if (this.externalContextPaths.length === 0) {
      this.externalContextsEl.style.display = "none";
      return;
    }
    this.externalContextsEl.style.display = "block";
    const headerEl = this.externalContextsEl.createDiv({ cls: "codexian-ec-header" });
    headerEl.setText("External Contexts");
    const listEl = this.externalContextsEl.createDiv({ cls: "codexian-ec-list" });
    for (const pathStr of this.externalContextPaths) {
      const itemEl = listEl.createDiv({ cls: "codexian-ec-item" });
      const pathTextEl = itemEl.createSpan({ cls: "codexian-ec-text" });
      pathTextEl.setText(this.shortenPath(pathStr));
      pathTextEl.setAttribute("title", pathStr);
      const isPersistent = this.persistentPaths.has(pathStr);
      const lockBtn = itemEl.createSpan({ cls: `codexian-ec-lock${isPersistent ? " locked" : ""}` });
      lockBtn.innerHTML = isPersistent ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>` : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;
      lockBtn.setAttribute("title", isPersistent ? "Persistent (click to make session-only)" : "Session-only (click to persist)");
      lockBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.togglePathPersistence(pathStr);
      });
      const removeBtn = itemEl.createSpan({ cls: "codexian-ec-remove" });
      removeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
      removeBtn.setAttribute("title", "Remove path");
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.removeContextPath(pathStr);
      });
    }
  }
  togglePathPersistence(pathStr) {
    if (this.persistentPaths.has(pathStr)) {
      this.persistentPaths.delete(pathStr);
    } else {
      this.persistentPaths.add(pathStr);
    }
    this.renderExternalContexts();
  }
  removeContextPath(pathStr) {
    this.externalContextPaths = this.externalContextPaths.filter((p) => p !== pathStr);
    this.persistentPaths.delete(pathStr);
    this.renderExternalContexts();
    this.updateFolderBtnState();
  }
  updateFolderBtnState() {
    if (!this.folderBtnEl) return;
    if (this.externalContextPaths.length > 0) {
      this.folderBtnEl.addClass("active");
    } else {
      this.folderBtnEl.removeClass("active");
    }
  }
  shortenPath(p) {
    const normalized = p.replace(/\\/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    if (parts.length <= 2) return normalized;
    return parts.slice(-2).join("/");
  }
  /* ───────── YOLO Toggle ───────── */
  toggleYolo() {
    this.currentYolo = !this.currentYolo;
    if (this.yoloTrackEl) {
      this.yoloTrackEl.toggleClass("active", this.currentYolo);
    }
    if (this.store) {
      this.store.ui.yolo = this.currentYolo;
      void this.plugin.saveStore(this.store);
    }
  }
  /* ───────── Obsidian Context ───────── */
  getVaultAbsolutePath() {
    const adapter = this.plugin.app.vault.adapter;
    if ("getBasePath" in adapter && typeof adapter.getBasePath === "function") {
      return adapter.getBasePath();
    }
    return null;
  }
  buildObsidianPrompt(userText) {
    var _a;
    const ctxParts = [];
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    ctxParts.push(`Today: ${today}.`);
    const activeFile = this.plugin.app.workspace.getActiveFile();
    if (activeFile) {
      ctxParts.push(`Current note: ${activeFile.path}.`);
    }
    const rootChildren = (_a = this.plugin.app.vault.getRoot().children) != null ? _a : [];
    const folders = rootChildren.filter((f) => "children" in f).map((f) => f.path).sort().slice(0, 10);
    if (folders.length > 0) {
      ctxParts.push(`Vault folders: ${folders.join(", ")}.`);
    }
    ctxParts.push(`You are in an Obsidian vault. Use relative paths. Understand wiki-links and YAML frontmatter. Reply in the same language as the user.`);
    if (this.externalContextPaths.length > 0) {
      ctxParts.push(`External dirs: ${this.externalContextPaths.join(", ")}.`);
    }
    return `${userText}

(Context: ${ctxParts.join(" ")})`;
  }
  /* ───────── Helpers ───────── */
  splitArgs(value) {
    return value.split(" ").map((item) => item.trim()).filter((item) => item.length > 0);
  }
  getModelOptions() {
    const rawModels = typeof this.plugin.settings.models === "string" ? this.plugin.settings.models : "";
    const models = rawModels.split(/\r?\n|,/).map((item) => item.trim()).filter((item) => item.length > 0);
    if (models.length > 0) return models;
    const fallback = typeof this.plugin.settings.defaultModel === "string" && this.plugin.settings.defaultModel.trim() ? this.plugin.settings.defaultModel.trim() : "gpt-5.3-codex";
    return [fallback];
  }
  selectInitialModel(models) {
    if (!this.store) return models[0];
    const current = this.store.ui.model;
    if (current && models.includes(current)) return current;
    if (this.plugin.settings.defaultModel && models.includes(this.plugin.settings.defaultModel)) {
      this.store.ui.model = this.plugin.settings.defaultModel;
      return this.plugin.settings.defaultModel;
    }
    this.store.ui.model = models[0];
    return models[0];
  }
  selectInitialThinking() {
    if (!this.store) return this.plugin.settings.reasoningLevel;
    const current = this.store.ui.thinking;
    if (current === "low" || current === "medium" || current === "high" || current === "extra_high") {
      return current;
    }
    this.store.ui.thinking = this.plugin.settings.reasoningLevel;
    return this.plugin.settings.reasoningLevel;
  }
  randomGreeting() {
    const dayGreetings = [
      "Happy Monday",
      "Happy Tuesday",
      "Happy Wednesday",
      "Happy Thursday",
      "Happy Friday",
      "Happy Saturday",
      "Happy Sunday"
    ];
    const extras = [
      "What's on your mind?",
      "Let's build something",
      "Ready when you are",
      "How can I help?",
      "Ask me anything",
      "Let's get started",
      "What shall we create?",
      "Ideas welcome",
      "Good to see you",
      "At your service"
    ];
    const today = (/* @__PURE__ */ new Date()).getDay();
    const pool = [dayGreetings[today], ...extras];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  shortModelName(model) {
    const parts = model.split("-");
    if (parts.length <= 2) return model;
    return model.length > 20 ? model.slice(0, 18) + "..." : model;
  }
  getReasoningArgs(reasoning) {
    const map = {
      low: this.plugin.settings.reasoningArgsLow,
      medium: this.plugin.settings.reasoningArgsMedium,
      high: this.plugin.settings.reasoningArgsHigh,
      extra_high: this.plugin.settings.reasoningArgsExtraHigh
    };
    return this.splitArgs(map[reasoning]);
  }
  setStatus(text) {
    var _a;
    (_a = this.statusEl) == null ? void 0 : _a.setText(text);
  }
  setBusy(busy) {
    if (this.inputEl) {
      this.inputEl.readOnly = busy;
      this.inputEl.toggleClass("codexian-input-busy", busy);
    }
  }
  startFakeProgress() {
    if (this.spinnerWrapEl) {
      this.spinnerWrapEl.toggleClass("visible", true);
    }
  }
  stopProgress() {
    if (this.spinnerWrapEl) {
      this.spinnerWrapEl.toggleClass("visible", false);
    }
  }
  scrollToBottom() {
    if (!this.messagesEl) return;
    this.messagesEl.scrollTo({ top: this.messagesEl.scrollHeight, behavior: "smooth" });
  }
};

// main.ts
var VIEW_TYPE = "codexian-view";
var CodexianPlugin = class extends import_obsidian3.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.sessions = [];
    this.activeSessionId = "";
    this.chatStore = {
      chats: [],
      openTabIds: [],
      activeChatId: "",
      diag: {
        lastRunAt: null,
        lastDurationMs: null,
        lastExitCode: null,
        lastError: null
      },
      ui: {
        model: "gpt-5.3-codex",
        thinking: "medium",
        yolo: false
      }
    };
  }
  async onload() {
    console.log("[Codexian] onload");
    await this.loadSettings();
    this.registerView(VIEW_TYPE, (leaf) => new CodexView(leaf, this));
    this.addSettingTab(new CodexianSettingTab(this.app, this));
    const customChatIconId = "codexian-chat-bubble";
    let ribbonIconId = "message-square";
    if (!(0, import_obsidian3.getIcon)(ribbonIconId)) {
      ribbonIconId = "messages-square";
    }
    if (!(0, import_obsidian3.getIcon)(ribbonIconId)) {
      (0, import_obsidian3.addIcon)(
        customChatIconId,
        '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4 4v-4H6a2 2 0 0 1-2-2V6z"/><path d="M8 8h8M8 11h6"/>'
      );
      ribbonIconId = customChatIconId;
    }
    const ribbonEl = this.addRibbonIcon(ribbonIconId, "Open Codexian", () => {
      console.log("[Codexian] ribbon click");
      this.activateView();
    });
    ribbonEl.addClass("codexian-ribbon");
    const getBottomContainer = () => {
      const selectors = [
        ".workspace-ribbon.mod-left .workspace-ribbon-actions.mod-bottom",
        ".workspace-ribbon.mod-left .workspace-ribbon-actions:last-of-type"
      ];
      for (const selector of selectors) {
        const found = document.querySelector(selector);
        if (found) return found;
      }
      const leftRibbonFromIcon = ribbonEl.closest(".workspace-ribbon.mod-left");
      if (leftRibbonFromIcon) {
        const explicitBottom = leftRibbonFromIcon.querySelector(
          ".workspace-ribbon-actions.mod-bottom"
        );
        if (explicitBottom) return explicitBottom;
        const actions = leftRibbonFromIcon.querySelectorAll(".workspace-ribbon-actions");
        if (actions.length > 0) {
          return actions[actions.length - 1];
        }
      }
      const ribbonFromIcon = ribbonEl.closest(".workspace-ribbon");
      if (ribbonFromIcon) {
        const actions = ribbonFromIcon.querySelectorAll(".workspace-ribbon-actions");
        if (actions.length > 0) {
          return actions[actions.length - 1];
        }
      }
      return null;
    };
    const moveRibbonToBottomUnder = (targetText) => {
      const bottomContainer = getBottomContainer();
      if (!bottomContainer || !ribbonEl) return;
      const lowerTarget = targetText.toLowerCase();
      const buttons = Array.from(bottomContainer.children);
      const targetButton = buttons.find((button) => {
        var _a, _b, _c, _d;
        const tooltipAttr = (_a = button.getAttribute("tooltip")) != null ? _a : "";
        const tooltip = (_b = button.getAttribute("aria-label")) != null ? _b : "";
        const title = (_c = button.getAttribute("title")) != null ? _c : "";
        const dataTooltip = (_d = button.getAttribute("data-tooltip")) != null ? _d : "";
        const text = `${tooltipAttr} ${tooltip} ${title} ${dataTooltip}`.toLowerCase();
        return text.includes(lowerTarget);
      });
      if ((targetButton == null ? void 0 : targetButton.parentElement) === bottomContainer) {
        targetButton.insertAdjacentElement("afterend", ribbonEl);
        return;
      }
      bottomContainer.appendChild(ribbonEl);
    };
    this.app.workspace.onLayoutReady(() => {
      moveRibbonToBottomUnder("Claudian");
      requestAnimationFrame(() => moveRibbonToBottomUnder("Claudian"));
      window.setTimeout(() => moveRibbonToBottomUnder("Claudian"), 250);
    });
    this.addCommand({
      id: "codexian-toggle-panel",
      name: "Codexian: Toggle Panel",
      callback: async () => {
        await this.activateView();
      }
    });
    this.addCommand({
      id: "codexian-open-settings",
      name: "Codexian: Open Settings",
      callback: () => {
        this.openSettings();
      }
    });
  }
  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }
  async loadSettings() {
    var _a, _b, _c, _d, _e, _f, _g;
    const loaded = await this.loadData();
    const legacySettings = loaded && !("settings" in loaded) ? loaded : void 0;
    const loadedSettings = loaded && "settings" in loaded ? loaded.settings : legacySettings;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedSettings != null ? loadedSettings : {});
    this.migrateLegacySettings();
    let loadedChats = loaded && "chats" in loaded && Array.isArray(loaded.chats) ? loaded.chats : loaded && "sessions" in loaded && Array.isArray(loaded.sessions) ? loaded.sessions : [];
    const legacyHistory = loaded && "history" in loaded && Array.isArray(loaded.history) ? loaded.history : [];
    if (legacyHistory.length > 0) {
      const existingIds = new Set(loadedChats.map((c) => c.id));
      for (const h of legacyHistory) {
        if (!existingIds.has(h.id)) {
          loadedChats.push(h);
        }
      }
    }
    const loadedActiveChatId = loaded && "activeChatId" in loaded && typeof loaded.activeChatId === "string" ? loaded.activeChatId : loaded && "activeSessionId" in loaded && typeof loaded.activeSessionId === "string" ? loaded.activeSessionId : "";
    const loadedOpenTabIds = loaded && "openTabIds" in loaded && Array.isArray(loaded.openTabIds) ? loaded.openTabIds : [];
    this.chatStore = {
      chats: loadedChats,
      openTabIds: loadedOpenTabIds,
      activeChatId: loadedActiveChatId,
      diag: {
        lastRunAt: loaded && "diag" in loaded && typeof ((_a = loaded.diag) == null ? void 0 : _a.lastRunAt) === "number" ? loaded.diag.lastRunAt : null,
        lastDurationMs: loaded && "diag" in loaded && typeof ((_b = loaded.diag) == null ? void 0 : _b.lastDurationMs) === "number" ? loaded.diag.lastDurationMs : null,
        lastExitCode: loaded && "diag" in loaded && typeof ((_c = loaded.diag) == null ? void 0 : _c.lastExitCode) === "number" ? loaded.diag.lastExitCode : null,
        lastError: loaded && "diag" in loaded && typeof ((_d = loaded.diag) == null ? void 0 : _d.lastError) === "string" ? loaded.diag.lastError : null
      },
      ui: {
        model: loaded && "ui" in loaded && typeof ((_e = loaded.ui) == null ? void 0 : _e.model) === "string" ? this.normalizeUiModel(loaded.ui.model) : this.settings.defaultModel,
        thinking: loaded && "ui" in loaded ? this.normalizeUiThinking((_f = loaded.ui) == null ? void 0 : _f.thinking) : this.settings.reasoningLevel,
        yolo: loaded && "ui" in loaded && typeof ((_g = loaded.ui) == null ? void 0 : _g.yolo) === "boolean" ? loaded.ui.yolo : false
      }
    };
    this.ensureActiveChat(this.chatStore);
    this.sessions = this.chatStore.chats;
    this.activeSessionId = this.chatStore.activeChatId;
  }
  async saveSettings() {
    await this.savePluginData();
  }
  getStore() {
    this.ensureActiveChat(this.chatStore);
    return this.chatStore;
  }
  async saveStore(store) {
    this.chatStore = {
      chats: store.chats,
      openTabIds: store.openTabIds,
      activeChatId: store.activeChatId,
      diag: {
        lastRunAt: store.diag.lastRunAt,
        lastDurationMs: store.diag.lastDurationMs,
        lastExitCode: store.diag.lastExitCode,
        lastError: store.diag.lastError
      },
      ui: {
        model: store.ui.model,
        thinking: store.ui.thinking,
        yolo: store.ui.yolo
      }
    };
    this.ensureActiveChat(this.chatStore);
    this.sessions = this.chatStore.chats;
    this.activeSessionId = this.chatStore.activeChatId;
    await this.savePluginData();
  }
  ensureActiveChat(store = this.chatStore) {
    store.openTabIds = store.openTabIds.filter(
      (id) => store.chats.some((c) => c.id === id)
    );
    if (store.openTabIds.length === 0) {
      const emptyChat = store.chats.find((c) => c.messages.length === 0);
      if (emptyChat) {
        store.openTabIds.push(emptyChat.id);
      } else {
        const id = `chat-${Date.now()}`;
        store.chats.push({ id, title: "New Chat", createdAt: Date.now(), messages: [] });
        store.openTabIds.push(id);
      }
    }
    if (!store.activeChatId || !store.openTabIds.includes(store.activeChatId)) {
      store.activeChatId = store.openTabIds[0];
    }
    return store.activeChatId;
  }
  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      if (!leaf) {
        new import_obsidian3.Notice("Failed to open right sidebar");
        return;
      }
      await leaf.setViewState({
        type: VIEW_TYPE,
        active: true
      });
    }
    workspace.revealLeaf(leaf);
  }
  openSettings() {
    const appWithSetting = this.app;
    if (appWithSetting.setting) {
      appWithSetting.setting.open();
      if (appWithSetting.setting.openTabById) {
        try {
          appWithSetting.setting.openTabById(this.manifest.id);
          return;
        } catch (_error) {
          new import_obsidian3.Notice("Settings opened. Click Codexian in the plugin list.");
          return;
        }
      }
      new import_obsidian3.Notice("Settings opened. Click Codexian in the plugin list.");
      return;
    }
    new import_obsidian3.Notice("Open Obsidian settings manually and click Codexian.");
  }
  getActiveSession() {
    this.ensureDefaultSession();
    const found = this.sessions.find((session) => session.id === this.activeSessionId);
    if (found) return found;
    const first = this.sessions[0];
    this.activeSessionId = first.id;
    return first;
  }
  async appendMessage(role, content) {
    const session = this.getActiveSession();
    session.messages.push({
      role,
      content,
      ts: Date.now()
    });
    await this.savePluginData();
    return session.messages.length - 1;
  }
  async updateMessage(index, role, content) {
    const session = this.getActiveSession();
    if (!session.messages[index]) return;
    session.messages[index] = {
      role,
      content,
      ts: Date.now()
    };
    await this.savePluginData();
  }
  async clearActiveSessionMessages() {
    const session = this.getActiveSession();
    session.messages = [];
    await this.savePluginData();
  }
  ensureDefaultSession() {
    if (this.sessions.length === 0) {
      const id = `session-${Date.now()}`;
      this.sessions = [
        {
          id,
          title: "Default Session",
          createdAt: Date.now(),
          messages: []
        }
      ];
      this.activeSessionId = id;
      return;
    }
    if (!this.activeSessionId || !this.sessions.some((item) => item.id === this.activeSessionId)) {
      this.activeSessionId = this.sessions[0].id;
    }
  }
  async savePluginData() {
    await this.saveData({
      settings: this.settings,
      sessions: this.sessions,
      activeSessionId: this.activeSessionId,
      chats: this.chatStore.chats,
      openTabIds: this.chatStore.openTabIds,
      activeChatId: this.chatStore.activeChatId,
      diag: this.chatStore.diag,
      ui: this.chatStore.ui
    });
  }
  migrateLegacySettings() {
    const asString = (value, fallback) => {
      return typeof value === "string" ? value : fallback;
    };
    this.settings.codexPath = asString(this.settings.codexPath, "codex");
    this.settings.models = asString(this.settings.models, DEFAULT_SETTINGS.models);
    this.settings.defaultModel = asString(this.settings.defaultModel, DEFAULT_SETTINGS.defaultModel);
    this.settings.extraArgs = asString(this.settings.extraArgs, DEFAULT_SETTINGS.extraArgs);
    this.settings.permissionArgsReadOnly = asString(
      this.settings.permissionArgsReadOnly,
      DEFAULT_SETTINGS.permissionArgsReadOnly
    );
    this.settings.permissionArgsDefault = asString(
      this.settings.permissionArgsDefault,
      DEFAULT_SETTINGS.permissionArgsDefault
    );
    this.settings.permissionArgsFullAccess = asString(
      this.settings.permissionArgsFullAccess,
      DEFAULT_SETTINGS.permissionArgsFullAccess
    );
    const migrateReasoning = (value, effort) => {
      const trimmed = (value != null ? value : "").trim();
      if (!trimmed || trimmed.startsWith("--reasoning")) {
        return `-c model_reasoning_effort="${effort}"`;
      }
      return trimmed;
    };
    this.settings.reasoningArgsLow = migrateReasoning(this.settings.reasoningArgsLow, "low");
    this.settings.reasoningArgsMedium = migrateReasoning(this.settings.reasoningArgsMedium, "medium");
    this.settings.reasoningArgsHigh = migrateReasoning(this.settings.reasoningArgsHigh, "high");
    this.settings.reasoningArgsExtraHigh = migrateReasoning(
      this.settings.reasoningArgsExtraHigh,
      "high"
    );
    if (!this.settings.permissionArgsDefault.trim()) {
      this.settings.permissionArgsDefault = "--sandbox workspace-write";
    }
    if (!this.settings.extraArgs.includes("--skip-git-repo-check")) {
      this.settings.extraArgs = this.settings.extraArgs.trim() ? `${this.settings.extraArgs.trim()} --skip-git-repo-check` : "--skip-git-repo-check";
    }
  }
  normalizeUiModel(value) {
    const trimmed = value.trim();
    if (!trimmed) return this.settings.defaultModel;
    const legacyMap = {
      sonnet: "gpt-5.3-codex",
      opus: "gpt-5.1-codex-max",
      haiku: "gpt-5.1-codex-mini"
    };
    const mapped = legacyMap[trimmed.toLowerCase()];
    return mapped != null ? mapped : trimmed;
  }
  normalizeUiThinking(value) {
    if (typeof value !== "string") return this.settings.reasoningLevel;
    const normalized = value.trim().toLowerCase().replace("-", "_");
    if (normalized === "low") return "low";
    if (normalized === "medium") return "medium";
    if (normalized === "high") return "high";
    if (normalized === "extra_high") return "extra_high";
    if (normalized === "extra high") return "extra_high";
    return this.settings.reasoningLevel;
  }
};
