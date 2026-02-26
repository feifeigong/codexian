import { addIcon, App, getIcon, Notice, Plugin, WorkspaceLeaf } from "obsidian";
import {
  CodexianSettingTab,
  DEFAULT_SETTINGS,
  type CodexianSettings
} from "./src/settings";
import { CodexView } from "./src/view/CodexView";
const VIEW_TYPE = "codexian-view";

export type ChatRole = "user" | "assistant" | "error" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  ts: number;
  // For tool messages
  command?: string;
  exitCode?: number;
  toolStatus?: "running" | "completed" | "error";
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  threadId?: string;  // Codex session ID for resume
  greeting?: string;  // Random greeting for empty state
}

export interface CodexDiag {
  lastRunAt: number | null;
  lastDurationMs: number | null;
  lastExitCode: number | null;
  lastError: string | null;
}

export interface CodexStore {
  chats: ChatSession[];       // ALL conversations (both open tabs and closed)
  openTabIds: string[];       // IDs of chats shown as tabs (max 3)
  activeChatId: string;       // Currently viewed tab
  diag: CodexDiag;
  ui: {
    model: string;
    thinking: "low" | "medium" | "high" | "extra_high";
    yolo: boolean;
  };
}

interface PluginDataShape {
  settings?: Partial<CodexianSettings>;
  sessions?: ChatSession[];
  activeSessionId?: string;
  chats?: ChatSession[];
  activeChatId?: string;
  openTabIds?: string[];
  history?: ChatSession[];    // legacy, migrated into chats
  diag?: Partial<CodexDiag>;
  ui?: Partial<CodexStore["ui"]>;
}

export default class CodexianPlugin extends Plugin {
  settings: CodexianSettings = DEFAULT_SETTINGS;
  sessions: ChatSession[] = [];
  activeSessionId = "";
  private chatStore: CodexStore = {
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

  async onload(): Promise<void> {
    console.log("[Codexian] onload");
    await this.loadSettings();

    this.registerView(VIEW_TYPE, (leaf: WorkspaceLeaf) => new CodexView(leaf, this));

    this.addSettingTab(new CodexianSettingTab(this.app, this));

    const customChatIconId = "codexian-chat-bubble";
    let ribbonIconId = "message-square";
    if (!getIcon(ribbonIconId)) {
      ribbonIconId = "messages-square";
    }
    if (!getIcon(ribbonIconId)) {
      addIcon(
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

    const getBottomContainer = (): HTMLElement | null => {
      const selectors = [
        ".workspace-ribbon.mod-left .workspace-ribbon-actions.mod-bottom",
        ".workspace-ribbon.mod-left .workspace-ribbon-actions:last-of-type"
      ];
      for (const selector of selectors) {
        const found = document.querySelector(selector) as HTMLElement | null;
        if (found) return found;
      }

      const leftRibbonFromIcon = ribbonEl.closest(".workspace-ribbon.mod-left") as HTMLElement | null;
      if (leftRibbonFromIcon) {
        const explicitBottom = leftRibbonFromIcon.querySelector(
          ".workspace-ribbon-actions.mod-bottom"
        ) as HTMLElement | null;
        if (explicitBottom) return explicitBottom;

        const actions = leftRibbonFromIcon.querySelectorAll(".workspace-ribbon-actions");
        if (actions.length > 0) {
          return actions[actions.length - 1] as HTMLElement;
        }
      }

      const ribbonFromIcon = ribbonEl.closest(".workspace-ribbon") as HTMLElement | null;
      if (ribbonFromIcon) {
        const actions = ribbonFromIcon.querySelectorAll(".workspace-ribbon-actions");
        if (actions.length > 0) {
          return actions[actions.length - 1] as HTMLElement;
        }
      }

      return null;
    };

    const moveRibbonToBottomUnder = (targetText: "Claudian"): void => {
      const bottomContainer = getBottomContainer();
      if (!bottomContainer || !ribbonEl) return;

      const lowerTarget = targetText.toLowerCase();
      const buttons = Array.from(bottomContainer.children) as HTMLElement[];
      const targetButton = buttons.find((button) => {
        const tooltipAttr = button.getAttribute("tooltip") ?? "";
        const tooltip = button.getAttribute("aria-label") ?? "";
        const title = button.getAttribute("title") ?? "";
        const dataTooltip = button.getAttribute("data-tooltip") ?? "";
        const text = `${tooltipAttr} ${tooltip} ${title} ${dataTooltip}`.toLowerCase();
        return text.includes(lowerTarget);
      });

      if (targetButton?.parentElement === bottomContainer) {
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

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async loadSettings(): Promise<void> {
    const loaded = (await this.loadData()) as PluginDataShape | Partial<CodexianSettings> | null;

    const legacySettings =
      loaded && !("settings" in loaded) ? (loaded as Partial<CodexianSettings>) : undefined;
    const loadedSettings = loaded && "settings" in loaded ? loaded.settings : legacySettings;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedSettings ?? {});
    this.migrateLegacySettings();

    let loadedChats =
      loaded && "chats" in loaded && Array.isArray(loaded.chats)
        ? loaded.chats
        : loaded && "sessions" in loaded && Array.isArray(loaded.sessions)
          ? loaded.sessions
          : [];

    // Migrate legacy history into chats (deduplicate by id)
    const legacyHistory =
      loaded && "history" in loaded && Array.isArray(loaded.history)
        ? loaded.history
        : [];
    if (legacyHistory.length > 0) {
      const existingIds = new Set(loadedChats.map((c: ChatSession) => c.id));
      for (const h of legacyHistory) {
        if (!existingIds.has(h.id)) {
          loadedChats.push(h);
        }
      }
    }

    const loadedActiveChatId =
      loaded && "activeChatId" in loaded && typeof loaded.activeChatId === "string"
        ? loaded.activeChatId
        : loaded && "activeSessionId" in loaded && typeof loaded.activeSessionId === "string"
          ? loaded.activeSessionId
          : "";

    const loadedOpenTabIds =
      loaded && "openTabIds" in loaded && Array.isArray(loaded.openTabIds)
        ? loaded.openTabIds
        : [];

    this.chatStore = {
      chats: loadedChats,
      openTabIds: loadedOpenTabIds,
      activeChatId: loadedActiveChatId,
      diag: {
        lastRunAt:
          loaded && "diag" in loaded && typeof loaded.diag?.lastRunAt === "number"
            ? loaded.diag.lastRunAt
            : null,
        lastDurationMs:
          loaded && "diag" in loaded && typeof loaded.diag?.lastDurationMs === "number"
            ? loaded.diag.lastDurationMs
            : null,
        lastExitCode:
          loaded && "diag" in loaded && typeof loaded.diag?.lastExitCode === "number"
            ? loaded.diag.lastExitCode
            : null,
        lastError:
          loaded && "diag" in loaded && typeof loaded.diag?.lastError === "string"
            ? loaded.diag.lastError
            : null
      },
      ui: {
        model:
          loaded && "ui" in loaded && typeof loaded.ui?.model === "string"
            ? this.normalizeUiModel(loaded.ui.model)
            : this.settings.defaultModel,
        thinking:
          loaded && "ui" in loaded
            ? this.normalizeUiThinking(loaded.ui?.thinking)
            : this.settings.reasoningLevel,
        yolo: loaded && "ui" in loaded && typeof loaded.ui?.yolo === "boolean" ? loaded.ui.yolo : false
      }
    };

    this.ensureActiveChat(this.chatStore);
    this.sessions = this.chatStore.chats;
    this.activeSessionId = this.chatStore.activeChatId;
  }

  async saveSettings(): Promise<void> {
    await this.savePluginData();
  }

  getStore(): CodexStore {
    this.ensureActiveChat(this.chatStore);
    return this.chatStore;
  }

  async saveStore(store: CodexStore): Promise<void> {
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

  ensureActiveChat(store: CodexStore = this.chatStore): string {
    // Ensure openTabIds has valid entries
    store.openTabIds = store.openTabIds.filter(
      (id) => store.chats.some((c) => c.id === id)
    );

    // Must have at least one tab
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

    // Ensure activeChatId points to a valid open tab
    if (!store.activeChatId || !store.openTabIds.includes(store.activeChatId)) {
      store.activeChatId = store.openTabIds[0];
    }

    return store.activeChatId;
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;

    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];

    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      if (!leaf) {
        new Notice("Failed to open right sidebar");
        return;
      }

      await leaf.setViewState({
        type: VIEW_TYPE,
        active: true
      });
    }

    workspace.revealLeaf(leaf);
  }

  private openSettings(): void {
    const appWithSetting = this.app as App & {
      setting?: {
        open: () => void;
        openTabById?: (id: string) => void;
      };
    };

    if (appWithSetting.setting) {
      appWithSetting.setting.open();

      if (appWithSetting.setting.openTabById) {
        try {
          appWithSetting.setting.openTabById(this.manifest.id);
          return;
        } catch (_error) {
          new Notice("Settings opened. Click Codexian in the plugin list.");
          return;
        }
      }

      new Notice("Settings opened. Click Codexian in the plugin list.");
      return;
    }

    new Notice("Open Obsidian settings manually and click Codexian.");
  }

  getActiveSession(): ChatSession {
    this.ensureDefaultSession();
    const found = this.sessions.find((session) => session.id === this.activeSessionId);
    if (found) return found;

    const first = this.sessions[0];
    this.activeSessionId = first.id;
    return first;
  }

  async appendMessage(role: ChatRole, content: string): Promise<number> {
    const session = this.getActiveSession();
    session.messages.push({
      role,
      content,
      ts: Date.now()
    });
    await this.savePluginData();
    return session.messages.length - 1;
  }

  async updateMessage(index: number, role: ChatRole, content: string): Promise<void> {
    const session = this.getActiveSession();
    if (!session.messages[index]) return;

    session.messages[index] = {
      role,
      content,
      ts: Date.now()
    };
    await this.savePluginData();
  }

  async clearActiveSessionMessages(): Promise<void> {
    const session = this.getActiveSession();
    session.messages = [];
    await this.savePluginData();
  }

  private ensureDefaultSession(): void {
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

  private async savePluginData(): Promise<void> {
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

  private migrateLegacySettings(): void {
    const asString = (value: unknown, fallback: string): string => {
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

    const migrateReasoning = (value: string, effort: "low" | "medium" | "high"): string => {
      const trimmed = (value ?? "").trim();
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
      this.settings.extraArgs = this.settings.extraArgs.trim()
        ? `${this.settings.extraArgs.trim()} --skip-git-repo-check`
        : "--skip-git-repo-check";
    }
  }

  private normalizeUiModel(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return this.settings.defaultModel;

    const legacyMap: Record<string, string> = {
      sonnet: "gpt-5.3-codex",
      opus: "gpt-5.1-codex-max",
      haiku: "gpt-5.1-codex-mini"
    };
    const mapped = legacyMap[trimmed.toLowerCase()];
    return mapped ?? trimmed;
  }

  private normalizeUiThinking(value: unknown): "low" | "medium" | "high" | "extra_high" {
    if (typeof value !== "string") return this.settings.reasoningLevel;

    const normalized = value.trim().toLowerCase().replace("-", "_");
    if (normalized === "low") return "low";
    if (normalized === "medium") return "medium";
    if (normalized === "high") return "high";
    if (normalized === "extra_high") return "extra_high";
    if (normalized === "extra high") return "extra_high";
    return this.settings.reasoningLevel;
  }
}
