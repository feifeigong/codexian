import { runCommand } from "./CodexRunner";

export async function getDiagnostics(codexPath: string, timeoutMs: number): Promise<string> {
  const versionResult = await runCommand(codexPath, ["--version"], timeoutMs);
  const loginResult = await runCommand(codexPath, ["login", "status"], timeoutMs);

  return [
    "[Codexian Diagnostics]",
    `codexPath: ${codexPath}`,
    "",
    "== codex --version ==",
    `ok: ${versionResult.ok}`,
    `exitCode: ${versionResult.code ?? "N/A"}`,
    "stdout:",
    versionResult.stdout.trim() || "(empty)",
    "stderr:",
    versionResult.stderr.trim() || "(empty)",
    "",
    "== codex login status ==",
    `ok: ${loginResult.ok}`,
    `exitCode: ${loginResult.code ?? "N/A"}`,
    "stdout:",
    loginResult.stdout.trim() || "(empty)",
    "stderr:",
    loginResult.stderr.trim() || "(empty)"
  ].join("\n");
}
