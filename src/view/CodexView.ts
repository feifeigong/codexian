import { ItemView, MarkdownRenderer, Notice, WorkspaceLeaf } from "obsidian";
import type CodexianPlugin from "../../main";
import type { ChatRole, ChatSession, CodexStore } from "../../main";
import { runCodexStream } from "../core/CodexRunner";
import type { CodexEvent } from "../core/CodexRunner";
import type { ReasoningLevel } from "../settings";

const VIEW_TYPE_CODEXIAN = "codexian-view";

const REASONING_LABELS: Record<ReasoningLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  extra_high: "Extra High"
};

export class CodexView extends ItemView {
  private plugin: CodexianPlugin;
  private store: CodexStore | null = null;
  private contentEl_: HTMLElement | null = null;

  private tabsEl: HTMLDivElement | null = null;
  private messagesEl: HTMLDivElement | null = null;
  private inputEl: HTMLTextAreaElement | null = null;
  private spinnerWrapEl: HTMLDivElement | null = null;
  private modelLabelEl: HTMLSpanElement | null = null;
  private thinkingLabelEl: HTMLSpanElement | null = null;
  private yoloTrackEl: HTMLDivElement | null = null;
  private statusEl: HTMLDivElement | null = null;
  private externalContextsEl: HTMLDivElement | null = null;
  private folderBtnEl: HTMLButtonElement | null = null;

  private busy = false;
  private abortController: { aborted: boolean; abort: () => void; onAbort: (fn: () => void) => void } | null = null;

  private currentModel = "";
  private currentThinking: ReasoningLevel = "medium";
  private currentYolo = false;
  private externalContextPaths: string[] = [];
  private persistentPaths: Set<string> = new Set();
  private activeFileContextEl: HTMLDivElement | null = null;
  private dismissedFile: string | null = null; // dismissed file path for current view

  constructor(leaf: WorkspaceLeaf, plugin: CodexianPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_CODEXIAN;
  }

  getDisplayText(): string {
    return "Codexian";
  }

  getIcon(): string {
    return "message-square";
  }

  async onOpen(): Promise<void> {
    this.contentEl_ = this.containerEl.children[1] as HTMLElement;
    this.contentEl_.empty();
    this.contentEl_.addClass("codexian-root");
    this.store = this.plugin.getStore();
    this.initState();
    this.mountUI();
    this.renderAll();
  }

  async onClose(): Promise<void> {
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

  private initState(): void {
    if (!this.store) return;
    const models = this.getModelOptions();
    this.currentModel = this.selectInitialModel(models);
    this.currentThinking = this.selectInitialThinking();
    this.currentYolo = this.store.ui.yolo;
  }

  /* ───────── Mount UI ───────── */

  private mountUI(): void {
    if (!this.store || !this.contentEl_) return;

    const root = this.contentEl_.createDiv({ cls: "codexian-ui" });

    // ── Header: brand icon + title + subtle clear button ──
    const header = root.createDiv({ cls: "codexian-header" });
    const titleRow = header.createDiv({ cls: "codexian-title-row" });

    // Brand icon: ChatGPT/OpenAI logo
    const iconWrap = titleRow.createDiv({ cls: "codexian-brand-icon" });
    iconWrap.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.28 9.82a5.98 5.98 0 00-.52-4.91A6.05 6.05 0 0015.25 2a6.07 6.07 0 00-10.27 2.18A5.98 5.98 0 00.98 7.08a6.05 6.05 0 00.74 7.1 5.98 5.98 0 00.51 4.91 6.05 6.05 0 006.51 2.9A5.98 5.98 0 0013.26 24a6.06 6.06 0 005.77-4.21 5.99 5.99 0 004-2.9 6.06 6.06 0 00-.75-7.07zM13.26 22.43a4.48 4.48 0 01-2.88-1.04l.14-.08 4.78-2.76a.78.78 0 00.39-.68v-6.74l2.02 1.17a.07.07 0 01.04.05v5.58a4.5 4.5 0 01-4.49 4.5zM3.6 18.6a4.48 4.48 0 01-.54-3.02l.14.08 4.78 2.76a.78.78 0 00.79 0l5.83-3.37v2.33a.07.07 0 01-.03.06l-4.83 2.79a4.5 4.5 0 01-6.14-1.63zM2.34 7.9A4.48 4.48 0 014.68 5.9v5.72a.78.78 0 00.39.68l5.83 3.36-2.02 1.17a.07.07 0 01-.07 0l-4.83-2.79A4.5 4.5 0 012.34 7.9zm17.48 4.07l-5.83-3.37L16 7.44a.07.07 0 01.07 0l4.83 2.79a4.5 4.5 0 01-.7 8.1v-5.68a.78.78 0 00-.39-.68zm2.01-3.02l-.14-.09-4.78-2.76a.78.78 0 00-.79 0L10.3 9.47V7.14a.07.07 0 01.03-.06l4.83-2.79a4.5 4.5 0 016.68 4.66zm-12.64 4.17L7.16 11.95a.07.07 0 01-.04-.06V6.31a4.5 4.5 0 017.38-3.46l-.14.08-4.78 2.76a.78.78 0 00-.4.68zm1.1-2.37l2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5z"/></svg>`;

    titleRow.createDiv({ cls: "codexian-title", text: "Codexian" });
    // No clear button in header — Claudian style (use [✏] button or new session instead)

    // ── Messages area ──
    this.messagesEl = root.createDiv({ cls: "codexian-messages" });

    // ── Composer (bottom) ──
    const composerEl = root.createDiv({ cls: "codexian-composer" });

    // Tabs row + action buttons
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

    // ── Input container (no send button — Enter to send, like Claudian) ──
    const inputContainer = composerEl.createDiv({ cls: "codexian-input-container" });

    // Active file context tag (auto-shows current open file)
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

    this.inputEl.addEventListener("keydown", (event: KeyboardEvent) => {
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

    // Global Esc to interrupt — listen on the entire panel
    this.containerEl.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Escape" && this.busy && this.abortController) {
        event.preventDefault();
        event.stopPropagation();
        this.abortController.abort();
      }
    });
    // Also make container focusable so Esc works even when input is disabled
    root.setAttribute("tabindex", "-1");

    // ── External Contexts display (inside input container, like Claudian) ──
    this.externalContextsEl = inputContainer.createDiv({ cls: "codexian-external-contexts" });
    this.renderExternalContexts();

    // ── Controls bar ──
    const controlsEl = composerEl.createDiv({ cls: "codexian-controls-bar" });

    // Model selector (brand color)
    const modelDropup = controlsEl.createDiv({ cls: "codexian-dropup-trigger" });
    this.modelLabelEl = modelDropup.createSpan({ cls: "codexian-dropup-label codexian-model-label-brand" });
    this.modelLabelEl.setText(this.shortModelName(this.currentModel));
    modelDropup.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showModelDropup(modelDropup);
    });

    // Thinking selector
    const thinkDropup = controlsEl.createDiv({ cls: "codexian-dropup-trigger" });
    thinkDropup.createSpan({ cls: "codexian-dropup-prefix", text: "Thinking:" });
    this.thinkingLabelEl = thinkDropup.createSpan({ cls: "codexian-dropup-label" });
    this.thinkingLabelEl.setText(REASONING_LABELS[this.currentThinking]);
    thinkDropup.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showThinkingDropup(thinkDropup);
    });

    // Spinner (hidden by default, shown when busy — no percentage text)
    this.spinnerWrapEl = controlsEl.createDiv({ cls: "codexian-spinner-wrap" });
    this.spinnerWrapEl.innerHTML = `<svg class="codexian-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2a10 10 0 0 1 10 10" opacity="0.9"/><path d="M12 2a10 10 0 0 0-10 10" opacity="0.3"/></svg>`;

    // Folder icon — opens Electron folder picker for External Contexts
    this.folderBtnEl = controlsEl.createEl("button", {
      cls: "codexian-folder-btn",
      attr: { "aria-label": "Add external context", title: "Add external context" }
    });
    this.folderBtnEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
    this.folderBtnEl.addEventListener("click", () => {
      void this.openFolderPicker();
    });

    // YOLO toggle
    const yoloWrap = controlsEl.createDiv({ cls: "codexian-toggle-wrap" });
    yoloWrap.createSpan({ cls: "codexian-toggle-label", text: "YOLO" });
    this.yoloTrackEl = yoloWrap.createDiv({
      cls: `codexian-toggle-track${this.currentYolo ? " active" : ""}`
    });
    this.yoloTrackEl.createDiv({ cls: "codexian-toggle-knob" });
    this.yoloTrackEl.addEventListener("click", () => this.toggleYolo());

    // Hidden status element
    this.statusEl = header.createDiv({ cls: "codexian-status", text: "Ready" });
  }

  /* ───────── Render ───────── */

  private renderAll(): void {
    this.renderTabs();
    this.renderMessages();
    this.setStatus("Ready");
  }

  private renderTabs(): void {
    if (!this.tabsEl || !this.store) return;
    this.tabsEl.querySelectorAll('.codexian-tab').forEach(t => t.remove());

    // Only show numbered tabs when 2+ tabs open
    if (this.store.openTabIds.length < 2) return;

    const actionsDiv = this.tabsEl.querySelector('.codexian-tab-actions');
    this.store.openTabIds.forEach((tabId, index) => {
      const isActive = tabId === this.store!.activeChatId;
      const tab = this.tabsEl!.createDiv({
        cls: `codexian-tab${isActive ? " active" : ""}`,
        text: String(index + 1)
      });
      tab.addEventListener("click", () => void this.switchSession(tabId));

      const delBtn = tab.createSpan({ cls: "codexian-tab-delete", text: "\u00d7" });
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        void this.closeTab(tabId);
      });

      if (actionsDiv) {
        this.tabsEl!.insertBefore(tab, actionsDiv);
      }
    });
  }

  private renderMessages(): void {
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
      // Tool messages: render as collapsible command bar
      if (message.role === "tool") {
        const row = this.messagesEl!.createDiv({ cls: "codexian-message-row tool" });
        const toolCall = row.createDiv({ cls: `codexian-tool-call ${message.toolStatus || "running"}` });

        // Status icon
        const iconEl = toolCall.createSpan({ cls: "codexian-tool-icon" });
        if (message.toolStatus === "running") {
          iconEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2a10 10 0 0 1 10 10" opacity="0.9"/><path d="M12 2a10 10 0 0 0-10 10" opacity="0.3"/></svg>`;
          iconEl.addClass("spinning");
        } else if (message.toolStatus === "completed") {
          iconEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
        } else {
          iconEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        }

        // Command label
        const cmdText = message.command || "command";
        const shortCmd = cmdText.length > 60 ? cmdText.slice(0, 57) + "..." : cmdText;
        toolCall.createSpan({ cls: "codexian-tool-label", text: `Bash: ${shortCmd}` });

        // Expand toggle (if has output)
        if (message.content && message.toolStatus !== "running") {
          const expandBtn = toolCall.createSpan({ cls: "codexian-tool-expand" });
          expandBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;

          const outputEl = row.createDiv({ cls: "codexian-tool-output" });
          outputEl.style.display = "none";
          const pre = outputEl.createEl("pre");
          pre.setText(message.content.length > 2000 ? message.content.slice(0, 2000) + "\n..." : message.content);

          toolCall.style.cursor = "pointer";
          toolCall.addEventListener("click", () => {
            const visible = outputEl.style.display !== "none";
            outputEl.style.display = visible ? "none" : "block";
            expandBtn.toggleClass("expanded", !visible);
          });
        }
        return;
      }

      // Normal messages: user / assistant / error
      const row = this.messagesEl!.createDiv({ cls: `codexian-message-row ${message.role}` });
      const bubble = row.createDiv({ cls: `codexian-bubble ${message.role}` });

      if (message.role === "user") {
        bubble.setText(message.content);
      } else {
        void MarkdownRenderer.render(
          this.app,
          message.content,
          bubble,
          "",
          this
        );
      }

      // Action buttons container (shown on hover) — copy only
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

  private getActiveChat(): ChatSession {
    if (!this.store) throw new Error("Store not initialized");
    const id = this.plugin.ensureActiveChat(this.store);
    const found = this.store.chats.find((chat) => chat.id === id);
    if (found) return found;

    const created: ChatSession = {
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

  private async switchSession(id: string): Promise<void> {
    if (!this.store) return;
    this.store.activeChatId = id;
    await this.plugin.saveStore(this.store);
    this.renderTabs();
    this.renderMessages();
  }

  private async addSession(): Promise<void> {
    if (!this.store) return;
    if (this.store.openTabIds.length >= 3) {
      new Notice("Maximum 3 tabs allowed");
      return;
    }
    const newId = `chat-${Date.now()}`;
    const newChat: ChatSession = {
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
  private async closeTab(id: string): Promise<void> {
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
  private async clearChat(): Promise<void> {
    if (!this.store) return;
    const oldChat = this.getActiveChat();

    // Auto-generate title for old chat if it has messages
    if (oldChat.messages.length > 0 && (oldChat.title === "New Chat" || oldChat.title === "Default Session")) {
      const firstUserMsg = oldChat.messages.find(m => m.role === "user");
      if (firstUserMsg) {
        oldChat.title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "");
      }
    }

    // Create new empty chat for this tab slot
    const newId = `chat-${Date.now()}`;
    const newChat: ChatSession = { id: newId, title: "New Chat", createdAt: Date.now(), messages: [] };
    this.store.chats.push(newChat);

    // Replace old ID in openTabIds
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
  private async deleteConversation(id: string): Promise<void> {
    if (!this.store) return;

    // Remove from chats
    this.store.chats = this.store.chats.filter((c) => c.id !== id);

    // If it was an open tab, replace with new empty chat
    const tabIdx = this.store.openTabIds.indexOf(id);
    if (tabIdx >= 0) {
      if (this.store.openTabIds.length <= 1) {
        // Last tab: create a new empty chat
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
  private async openConversation(id: string): Promise<void> {
    if (!this.store) return;

    // Already in a tab? Just switch
    if (this.store.openTabIds.includes(id)) {
      this.store.activeChatId = id;
    } else {
      // Replace current tab with this conversation
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

  private showHistoryPopup(anchor: HTMLElement): void {
    this.closeAllDropups();
    if (!this.store) return;

    const menu = this.createDropupMenu(anchor);
    const panelEl = this.containerEl?.closest(".workspace-leaf") as HTMLElement | null;
    if (panelEl) {
      const panelRect = panelEl.getBoundingClientRect();
      menu.style.left = `${panelRect.left + 16}px`;
      menu.style.right = `${window.innerWidth - panelRect.right + 16}px`;
      menu.style.minWidth = "unset";
    } else {
      menu.style.minWidth = "200px";
    }

    // Header (fixed, not scrollable)
    menu.createDiv({ cls: "codexian-history-header", text: "Conversations" });

    // Scrollable list container
    const list = menu.createDiv({ cls: "codexian-history-list" });

    // All conversations with messages, sorted by last activity
    const conversations = this.store.chats
      .filter((c) => c.messages.length > 0)
      .sort((a, b) => {
        const tsA = a.messages[a.messages.length - 1]?.ts ?? a.createdAt;
        const tsB = b.messages[b.messages.length - 1]?.ts ?? b.createdAt;
        return tsB - tsA;
      });

    if (conversations.length === 0) {
      list.createDiv({ cls: "codexian-history-empty", text: "No conversations" });
    } else {
      for (const conv of conversations) {
        const isCurrent = conv.id === this.store.activeChatId;
        const row = list.createDiv({ cls: `codexian-history-item${isCurrent ? " active" : ""}` });

        // Chat icon (filled dot for current)
        const icon = row.createSpan({ cls: "codexian-history-icon" });
        icon.innerHTML = isCurrent
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`
          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`;

        const textWrap = row.createDiv({ cls: "codexian-history-text" });

        // Title
        const firstUserMsg = conv.messages.find(m => m.role === "user");
        const displayTitle = conv.title && conv.title !== "New Chat" && conv.title !== "Default Session"
          ? conv.title
          : firstUserMsg
            ? firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "")
            : "Untitled";
        const titleEl = textWrap.createDiv({ cls: "codexian-history-title", text: displayTitle });

        // Time or "Current session"
        const lastMsg = conv.messages[conv.messages.length - 1];
        const timeTs = lastMsg?.ts ?? conv.createdAt;
        const timeText = isCurrent ? "Current session" : this.formatHistoryTime(timeTs);
        textWrap.createDiv({ cls: `codexian-history-time${isCurrent ? " current" : ""}`, text: timeText });

        // Action buttons
        const actionsWrap = row.createDiv({ cls: "codexian-history-actions" });

        // Rename
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
            if (ke.key === "Enter") { ke.preventDefault(); commitRename(); }
            if (ke.key === "Escape") { titleEl.empty(); titleEl.setText(displayTitle); }
          });
          input.addEventListener("blur", () => commitRename());
        });

        // Delete
        const deleteBtn = actionsWrap.createDiv({ cls: "codexian-history-action-btn codexian-history-delete-btn" });
        deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
        deleteBtn.setAttribute("title", "Delete");
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          void this.deleteConversation(conv.id);
          menu.remove();
        });

        // Click to open
        row.addEventListener("click", (e) => {
          e.stopPropagation();
          void this.openConversation(conv.id);
          menu.remove();
        });
      }
    }

    this.setupDropupClickAway(menu);
  }

  private formatHistoryTime(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return `${d.getMonth() + 1}\u6708${d.getDate()}\u65e5`;
  }

  /* ───────── Send ───────── */

  private async onSend(): Promise<void> {
    if (this.busy || !this.store || !this.inputEl) return;

    const text = this.inputEl.value.trim();
    if (!text) return;

    this.busy = true;
    this.setBusy(true);
    this.inputEl.value = "";

    const chat = this.getActiveChat();
    const startTs = Date.now();

    chat.messages.push({ role: "user", content: text, ts: startTs });

    // Placeholder assistant message
    const assistantIdx = chat.messages.length;
    chat.messages.push({ role: "assistant", content: "Thinking...", ts: startTs + 1 });

    this.renderMessages();
    this.startFakeProgress();
    this.setStatus(`Running: ${this.shortModelName(this.currentModel)}`);
    await this.plugin.saveStore(this.store);

    let currentAssistantIdx = assistantIdx;
    let hasAssistantContent = false;

    try {
      // First message: include Obsidian context; resume: just user text
      const isResume = !!chat.threadId;
      const finalPrompt = isResume ? text : this.buildObsidianPrompt(text);
      const vaultPath = this.getVaultAbsolutePath();

      // Build extra args: settings extraArgs + sandbox level
      // YOLO=on → danger-full-access, YOLO=off → workspace-write
      // Resume mode: no --sandbox, no --skip-git-repo-check, no -C
      const settingsExtra = this.splitArgs(this.plugin.settings.extraArgs);
      const sandboxArgs = isResume
        ? []
        : this.currentYolo
          ? this.splitArgs(this.plugin.settings.permissionArgsFullAccess)
          : this.splitArgs(this.plugin.settings.permissionArgsDefault);
      const filteredExtra = isResume
        ? settingsExtra.filter(a => !a.startsWith("--sandbox") && !a.startsWith("--skip-git-repo"))
        : settingsExtra;
      const allExtra = [...filteredExtra, ...sandboxArgs];

      // Create abort controller for Esc interruption
      let abortFn: (() => void) | null = null;
      const abortSignal = {
        aborted: false,
        onAbort: (fn: () => void) => { abortFn = fn; }
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
        cwd: vaultPath || undefined,
        reasoningArgs: this.getReasoningArgs(this.currentThinking),
        extraArgs: allExtra,
        abortSignal,
        onEvent: (event: CodexEvent) => {
          switch (event.type) {
            case "thread_started":
              if (event.threadId) chat.threadId = event.threadId;
              break;

            case "agent_message":
              if (!hasAssistantContent) {
                // Replace "Thinking..." placeholder
                chat.messages[currentAssistantIdx] = {
                  role: "assistant",
                  content: event.text || "",
                  ts: Date.now()
                };
                hasAssistantContent = true;
              } else {
                // New assistant segment after tool calls
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
              // Keep "Thinking..." visible
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
              // Find matching running tool message
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
              if (!hasAssistantContent && chat.messages[assistantIdx]?.content === "Thinking...") {
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
      this.store.diag.lastError = result.ok ? null : (result.errorMsg || null);

      // Handle interrupted
      if (result.errorMsg === "Interrupted") {
        if (chat.messages[assistantIdx]?.content === "Thinking...") {
          // No content yet, replace placeholder
          chat.messages[assistantIdx] = {
            role: "error",
            content: "**Interrupted**",
            ts: Date.now()
          };
        } else {
          // Had partial content, append interrupted notice
          chat.messages.push({
            role: "error",
            content: "**Interrupted**",
            ts: Date.now()
          });
        }
      } else if (chat.messages[assistantIdx]?.content === "Thinking...") {
        // If still showing placeholder, show result
        chat.messages[assistantIdx] = {
          role: result.ok ? "assistant" : "error",
          content: result.ok ? "No output" : `**Error:** ${result.errorMsg || "Execution failed"}`,
          ts: Date.now()
        };
      }
    } catch (error) {
      const content = `**Error:** ${error instanceof Error ? error.message : "Execution failed"}`;
      if (chat.messages[assistantIdx]?.content === "Thinking...") {
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
      this.inputEl?.focus();
    }
  }

  /* ───────── Dropup Menus ───────── */

  private closeAllDropups(): void {
    document.querySelectorAll(".codexian-dropup-menu").forEach((el) => el.remove());
  }

  private showModelDropup(anchor: HTMLElement): void {
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

  private showThinkingDropup(anchor: HTMLElement): void {
    this.closeAllDropups();
    const menu = this.createDropupMenu(anchor);
    const levels: ReasoningLevel[] = ["low", "medium", "high", "extra_high"];

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

  private createDropupMenu(anchor: HTMLElement): HTMLDivElement {
    const menu = document.body.createDiv({ cls: "codexian-dropup-menu" });
    const rect = anchor.getBoundingClientRect();
    menu.style.left = `${rect.left}px`;
    menu.style.bottom = `${window.innerHeight - rect.top + 4}px`;
    menu.style.minWidth = `${rect.width}px`;
    return menu;
  }

  private setupDropupClickAway(menu: HTMLElement): void {
    const handler = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener("click", handler, true);
      }
    };
    window.setTimeout(() => document.addEventListener("click", handler, true), 0);
  }

  /* ───────── External Contexts (Folder Picker) ───────── */

  private async openFolderPicker(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { remote } = require("electron");
      const result = await remote.dialog.showOpenDialog({
        properties: ["openDirectory"],
        title: "Select External Context"
      });
      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath: string = result.filePaths[0];
        // Duplicate check
        if (this.externalContextPaths.includes(selectedPath)) {
          new Notice("This folder is already added as an external context.");
          return;
        }
        this.externalContextPaths.push(selectedPath);
        this.renderExternalContexts();
        this.updateFolderBtnState();
      }
    } catch {
      new Notice("Unable to open folder picker.");
    }
  }

  private renderActiveFileContext(): void {
    if (!this.activeFileContextEl) return;
    this.activeFileContextEl.empty();

    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile || activeFile.path === this.dismissedFile) {
      this.activeFileContextEl.style.display = "none";
      return;
    }

    this.activeFileContextEl.style.display = "flex";

    // File icon
    const iconEl = this.activeFileContextEl.createSpan({ cls: "codexian-afc-icon" });
    iconEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;

    // File name
    this.activeFileContextEl.createSpan({ cls: "codexian-afc-name", text: activeFile.name });

    // Dismiss button
    const closeBtn = this.activeFileContextEl.createSpan({ cls: "codexian-afc-close" });
    closeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.dismissedFile = activeFile.path;
      this.renderActiveFileContext();
    });
  }

  private renderExternalContexts(): void {
    if (!this.externalContextsEl) return;
    this.externalContextsEl.empty();

    if (this.externalContextPaths.length === 0) {
      this.externalContextsEl.style.display = "none";
      return;
    }

    this.externalContextsEl.style.display = "block";

    // Header
    const headerEl = this.externalContextsEl.createDiv({ cls: "codexian-ec-header" });
    headerEl.setText("External Contexts");

    // List
    const listEl = this.externalContextsEl.createDiv({ cls: "codexian-ec-list" });
    for (const pathStr of this.externalContextPaths) {
      const itemEl = listEl.createDiv({ cls: "codexian-ec-item" });

      // Path text (shortened)
      const pathTextEl = itemEl.createSpan({ cls: "codexian-ec-text" });
      pathTextEl.setText(this.shortenPath(pathStr));
      pathTextEl.setAttribute("title", pathStr);

      // Lock icon
      const isPersistent = this.persistentPaths.has(pathStr);
      const lockBtn = itemEl.createSpan({ cls: `codexian-ec-lock${isPersistent ? " locked" : ""}` });
      lockBtn.innerHTML = isPersistent
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;
      lockBtn.setAttribute("title", isPersistent ? "Persistent (click to make session-only)" : "Session-only (click to persist)");
      lockBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.togglePathPersistence(pathStr);
      });

      // Remove button (X)
      const removeBtn = itemEl.createSpan({ cls: "codexian-ec-remove" });
      removeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
      removeBtn.setAttribute("title", "Remove path");
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.removeContextPath(pathStr);
      });
    }
  }

  private togglePathPersistence(pathStr: string): void {
    if (this.persistentPaths.has(pathStr)) {
      this.persistentPaths.delete(pathStr);
    } else {
      this.persistentPaths.add(pathStr);
    }
    this.renderExternalContexts();
  }

  private removeContextPath(pathStr: string): void {
    this.externalContextPaths = this.externalContextPaths.filter((p) => p !== pathStr);
    this.persistentPaths.delete(pathStr);
    this.renderExternalContexts();
    this.updateFolderBtnState();
  }

  private updateFolderBtnState(): void {
    if (!this.folderBtnEl) return;
    if (this.externalContextPaths.length > 0) {
      this.folderBtnEl.addClass("active");
    } else {
      this.folderBtnEl.removeClass("active");
    }
  }

  private shortenPath(p: string): string {
    // Show last 2 segments for readability
    const normalized = p.replace(/\\/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    if (parts.length <= 2) return normalized;
    return parts.slice(-2).join("/");
  }

  /* ───────── YOLO Toggle ───────── */

  private toggleYolo(): void {
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

  private getVaultAbsolutePath(): string | null {
    const adapter = this.plugin.app.vault.adapter;
    if ("getBasePath" in adapter && typeof adapter.getBasePath === "function") {
      return adapter.getBasePath() as string;
    }
    return null;
  }

  private buildObsidianPrompt(userText: string): string {
    const ctxParts: string[] = [];

    const today = new Date().toISOString().split("T")[0];
    ctxParts.push(`Today: ${today}.`);

    const activeFile = this.plugin.app.workspace.getActiveFile();
    if (activeFile) {
      ctxParts.push(`Current note: ${activeFile.path}.`);
    }

    const rootChildren = this.plugin.app.vault.getRoot().children ?? [];
    const folders = rootChildren
      .filter((f) => "children" in f)
      .map((f) => f.path)
      .sort()
      .slice(0, 10);
    if (folders.length > 0) {
      ctxParts.push(`Vault folders: ${folders.join(", ")}.`);
    }

    ctxParts.push(`You are in an Obsidian vault. Use relative paths. Understand wiki-links and YAML frontmatter. Reply in the same language as the user.`);

    if (this.externalContextPaths.length > 0) {
      ctxParts.push(`External dirs: ${this.externalContextPaths.join(", ")}.`);
    }

    return `${userText}\n\n(Context: ${ctxParts.join(" ")})`;
  }

  /* ───────── Helpers ───────── */

  private splitArgs(value: string): string[] {
    return value
      .split(" ")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private getModelOptions(): string[] {
    const rawModels =
      typeof this.plugin.settings.models === "string" ? this.plugin.settings.models : "";
    const models = rawModels
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    if (models.length > 0) return models;
    const fallback =
      typeof this.plugin.settings.defaultModel === "string" && this.plugin.settings.defaultModel.trim()
        ? this.plugin.settings.defaultModel.trim()
        : "gpt-5.3-codex";
    return [fallback];
  }

  private selectInitialModel(models: string[]): string {
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

  private selectInitialThinking(): ReasoningLevel {
    if (!this.store) return this.plugin.settings.reasoningLevel;
    const current = this.store.ui.thinking;
    if (current === "low" || current === "medium" || current === "high" || current === "extra_high") {
      return current;
    }
    this.store.ui.thinking = this.plugin.settings.reasoningLevel;
    return this.plugin.settings.reasoningLevel;
  }

  private randomGreeting(): string {
    const dayGreetings = [
      "Happy Monday", "Happy Tuesday", "Happy Wednesday",
      "Happy Thursday", "Happy Friday", "Happy Saturday", "Happy Sunday"
    ];
    const extras = [
      "What's on your mind?", "Let's build something",
      "Ready when you are", "How can I help?",
      "Ask me anything", "Let's get started",
      "What shall we create?", "Ideas welcome",
      "Good to see you", "At your service"
    ];
    const today = new Date().getDay();
    const pool = [dayGreetings[today], ...extras];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private shortModelName(model: string): string {
    const parts = model.split("-");
    if (parts.length <= 2) return model;
    // e.g. "gpt-5.3-codex" -> "gpt-5.3-codex" (short enough)
    // For very long names, truncate
    return model.length > 20 ? model.slice(0, 18) + "..." : model;
  }

  private getReasoningArgs(reasoning: ReasoningLevel): string[] {
    const map: Record<ReasoningLevel, string> = {
      low: this.plugin.settings.reasoningArgsLow,
      medium: this.plugin.settings.reasoningArgsMedium,
      high: this.plugin.settings.reasoningArgsHigh,
      extra_high: this.plugin.settings.reasoningArgsExtraHigh
    };
    return this.splitArgs(map[reasoning]);
  }


  private setStatus(text: string): void {
    this.statusEl?.setText(text);
  }

  private setBusy(busy: boolean): void {
    if (this.inputEl) {
      this.inputEl.readOnly = busy;
      this.inputEl.toggleClass("codexian-input-busy", busy);
    }
  }

  private startFakeProgress(): void {
    if (this.spinnerWrapEl) {
      this.spinnerWrapEl.toggleClass("visible", true);
    }
  }

  private stopProgress(): void {
    if (this.spinnerWrapEl) {
      this.spinnerWrapEl.toggleClass("visible", false);
    }
  }

  private scrollToBottom(): void {
    if (!this.messagesEl) return;
    this.messagesEl.scrollTo({ top: this.messagesEl.scrollHeight, behavior: "smooth" });
  }
}
