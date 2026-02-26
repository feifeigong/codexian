import { App, PluginSettingTab, Setting } from "obsidian";
import type CodexianPlugin from "../main";

export type ContextMode = "selection" | "note" | "selection+note";
export type ReasoningLevel = "low" | "medium" | "high" | "extra_high";
export type PermissionMode = "read_only" | "default" | "full_access";

export interface CodexianSettings {
  codexPath: string;
  timeoutMs: number;
  maxContextChars: number;
  contextMode: ContextMode;
  models: string;
  defaultModel: string;
  reasoningLevel: ReasoningLevel;
  permissionMode: PermissionMode;
  reasoningArgsLow: string;
  reasoningArgsMedium: string;
  reasoningArgsHigh: string;
  reasoningArgsExtraHigh: string;
  permissionArgsReadOnly: string;
  permissionArgsDefault: string;
  permissionArgsFullAccess: string;
  extraArgs: string;
}

export const DEFAULT_SETTINGS: CodexianSettings = {
  codexPath: "codex",
  timeoutMs: 600000,
  maxContextChars: 8000,
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
  reasoningArgsLow: "-c model_reasoning_effort=\"low\"",
  reasoningArgsMedium: "-c model_reasoning_effort=\"medium\"",
  reasoningArgsHigh: "-c model_reasoning_effort=\"high\"",
  reasoningArgsExtraHigh: "-c model_reasoning_effort=\"high\"",
  permissionArgsReadOnly: "--sandbox read-only",
  permissionArgsDefault: "--sandbox workspace-write",
  permissionArgsFullAccess: "--sandbox danger-full-access",
  extraArgs: "--skip-git-repo-check"
};

export class CodexianSettingTab extends PluginSettingTab {
  plugin: CodexianPlugin;

  constructor(app: App, plugin: CodexianPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Codexian Settings" });

    new Setting(containerEl)
      .setName("Codex executable path")
      .setDesc("Use codex or an absolute path")
      .addText((text) =>
        text
          .setPlaceholder("codex")
          .setValue(this.plugin.settings.codexPath)
          .onChange(async (value) => {
            this.plugin.settings.codexPath = value.trim() || "codex";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Timeout (ms)")
      .setDesc("Execution timeout in milliseconds")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.timeoutMs)).onChange(async (value) => {
          const parsed = Number(value);
          this.plugin.settings.timeoutMs = Number.isFinite(parsed) && parsed > 0 ? parsed : 120000;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Max context chars")
      .setDesc("Reserved for context truncation logic")
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.maxContextChars))
          .onChange(async (value) => {
            const parsed = Number(value);
            this.plugin.settings.maxContextChars =
              Number.isFinite(parsed) && parsed > 0 ? parsed : 8000;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Context mode")
      .setDesc("selection / note / selection+note")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("selection", "selection")
          .addOption("note", "note")
          .addOption("selection+note", "selection+note")
          .setValue(this.plugin.settings.contextMode)
          .onChange(async (value: ContextMode) => {
            this.plugin.settings.contextMode = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Models")
      .setDesc("One model per line, used by the sidebar model selector")
      .addTextArea((text) =>
        text.setValue(this.plugin.settings.models).onChange(async (value) => {
          this.plugin.settings.models = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Default model")
      .setDesc("Example: gpt-5.3-codex")
      .addText((text) =>
        text.setValue(this.plugin.settings.defaultModel).onChange(async (value) => {
          this.plugin.settings.defaultModel = value.trim();
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Reasoning level default")
      .setDesc("low / medium / high / extra_high")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("low", "low")
          .addOption("medium", "medium")
          .addOption("high", "high")
          .addOption("extra_high", "extra_high")
          .setValue(this.plugin.settings.reasoningLevel)
          .onChange(async (value: ReasoningLevel) => {
            this.plugin.settings.reasoningLevel = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Permission mode default")
      .setDesc("read_only / default / full_access")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("read_only", "read_only")
          .addOption("default", "default")
          .addOption("full_access", "full_access")
          .setValue(this.plugin.settings.permissionMode)
          .onChange(async (value: PermissionMode) => {
            this.plugin.settings.permissionMode = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Reasoning args: low")
      .setDesc("Space-separated string, split(\" \") at runtime")
      .addText((text) =>
        text.setValue(this.plugin.settings.reasoningArgsLow).onChange(async (value) => {
          this.plugin.settings.reasoningArgsLow = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Reasoning args: medium")
      .setDesc("Space-separated string, split(\" \") at runtime")
      .addText((text) =>
        text.setValue(this.plugin.settings.reasoningArgsMedium).onChange(async (value) => {
          this.plugin.settings.reasoningArgsMedium = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Reasoning args: high")
      .setDesc("Space-separated string, split(\" \") at runtime")
      .addText((text) =>
        text.setValue(this.plugin.settings.reasoningArgsHigh).onChange(async (value) => {
          this.plugin.settings.reasoningArgsHigh = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Reasoning args: extra_high")
      .setDesc("Space-separated string, split(\" \") at runtime")
      .addText((text) =>
        text.setValue(this.plugin.settings.reasoningArgsExtraHigh).onChange(async (value) => {
          this.plugin.settings.reasoningArgsExtraHigh = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Permission args: read_only")
      .setDesc("Space-separated string, split(\" \") at runtime")
      .addText((text) =>
        text.setValue(this.plugin.settings.permissionArgsReadOnly).onChange(async (value) => {
          this.plugin.settings.permissionArgsReadOnly = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Permission args: default")
      .setDesc("Space-separated string, split(\" \") at runtime")
      .addText((text) =>
        text.setValue(this.plugin.settings.permissionArgsDefault).onChange(async (value) => {
          this.plugin.settings.permissionArgsDefault = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Permission args: full_access")
      .setDesc("Space-separated string, split(\" \") at runtime")
      .addText((text) =>
        text.setValue(this.plugin.settings.permissionArgsFullAccess).onChange(async (value) => {
          this.plugin.settings.permissionArgsFullAccess = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Extra args")
      .setDesc("Space-separated string, split(\" \") at runtime")
      .addText((text) =>
        text.setValue(this.plugin.settings.extraArgs).onChange(async (value) => {
          this.plugin.settings.extraArgs = value;
          await this.plugin.saveSettings();
        })
      );
  }
}
