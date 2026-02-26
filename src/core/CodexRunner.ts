import { spawn, exec } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

/* ───── Types ───── */

export interface CodexEvent {
  type:
    | "thread_started"
    | "turn_started"
    | "reasoning"
    | "agent_message"
    | "command_started"
    | "command_completed"
    | "turn_completed"
    | "error";
  threadId?: string;
  text?: string;
  command?: string;
  exitCode?: number;
  output?: string;
  status?: string;
  usage?: { input_tokens: number; output_tokens: number };
}

export interface CodexStreamOpts {
  codexPath: string;
  timeoutMs: number;
  promptText: string;
  model: string;
  threadId?: string; // if set, resume this session
  yolo: boolean;
  cwd?: string;
  extraArgs?: string[];
  reasoningArgs?: string[];
  onEvent: (event: CodexEvent) => void;
  abortSignal?: { aborted: boolean; onAbort: (fn: () => void) => void };
}

export interface CodexStreamResult {
  ok: boolean;
  threadId: string | null;
  errorMsg?: string;
}

/* ───── Helpers ───── */

/**
 * Force-kill a process and its entire tree.
 * On Windows, child.kill() only kills the shell wrapper, not the actual process.
 */
function forceKill(child: ReturnType<typeof spawn>): void {
  if (child.pid == null) return;
  try {
    if (process.platform === "win32") {
      exec(`taskkill /F /T /PID ${child.pid}`);
    } else {
      child.kill("SIGKILL");
    }
  } catch { /* ignore */ }
}

/** Escape a string for PowerShell single-quoted literals: ' → '' */
function psQuote(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

/* ───── Main streaming function ───── */

export async function runCodexStream(opts: CodexStreamOpts): Promise<CodexStreamResult> {
  const timeout = Number.isFinite(opts.timeoutMs) && opts.timeoutMs > 0 ? opts.timeoutMs : 600000;

  // Build argument list (without the prompt)
  const cmdArgs: string[] = [];

  if (opts.threadId) {
    cmdArgs.push("exec", "resume");
  } else {
    cmdArgs.push("exec");
  }

  cmdArgs.push("--json");
  cmdArgs.push("-m", opts.model);

  // Always use --full-auto since we run non-interactively (no stdin).
  cmdArgs.push("--full-auto");

  if (opts.reasoningArgs) {
    cmdArgs.push(...opts.reasoningArgs);
  }

  if (opts.extraArgs) {
    cmdArgs.push(...opts.extraArgs);
  }

  // Working directory (not supported in resume mode)
  if (opts.cwd && !opts.threadId) {
    cmdArgs.push("-C", opts.cwd);
  }

  // Session ID (for resume)
  if (opts.threadId) {
    cmdArgs.push(opts.threadId);
  }

  // Write prompt to a temp file to avoid cmd.exe 8191-char command-line limit
  // and encoding issues with special characters on Windows.
  const tmpFile = join(tmpdir(), `codex-prompt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`);
  writeFileSync(tmpFile, opts.promptText, "utf8");

  const cleanupTmpFile = () => {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  };

  return new Promise<CodexStreamResult>((resolve) => {
    let threadId: string | null = null;
    let settled = false;
    let timedOut = false;
    let stderrBuf = "";
    let child: ReturnType<typeof spawn>;

    if (process.platform === "win32") {
      // On Windows, use PowerShell to avoid cmd.exe 8191-char limit and
      // encoding issues. Read prompt into a variable first so it stays
      // as one single argument (not split on whitespace).
      const psArgs = cmdArgs.map(a => psQuote(a)).join(" ");
      const psCommand = [
        `$p = [IO.File]::ReadAllText(${psQuote(tmpFile)}, [Text.Encoding]::UTF8).TrimEnd()`,
        `& ${psQuote(opts.codexPath)} ${psArgs} $p`
      ].join("; ");
      child = spawn("powershell.exe", ["-NoProfile", "-Command", psCommand], {
        env: process.env,
        cwd: opts.cwd || undefined,
        windowsHide: true
      });
    } else {
      // Unix: use shell with cat to read prompt from temp file
      const shellArgs = cmdArgs.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(" ");
      const fullCmd = `'${opts.codexPath.replace(/'/g, "'\\''")}' ${shellArgs} "$(cat '${tmpFile}')"`;
      child = spawn(fullCmd, [], {
        shell: true,
        env: process.env,
        cwd: opts.cwd || undefined
      });
    }

    const timer = setTimeout(() => {
      timedOut = true;
      forceKill(child);
    }, timeout);

    // Abort support
    let aborted = false;
    if (opts.abortSignal) {
      opts.abortSignal.onAbort(() => {
        aborted = true;
        forceKill(child);
      });
    }

    // Read stdout line by line for JSONL
    let lineBuf = "";
    child.stdout.on("data", (chunk: Buffer | string) => {
      lineBuf += chunk.toString();
      const lines = lineBuf.split("\n");
      lineBuf = lines.pop() ?? ""; // keep incomplete last line

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
        } catch {
          // Skip non-JSON lines
        }
      }
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderrBuf += chunk.toString();
    });

    child.on("error", (error: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanupTmpFile();
      opts.onEvent({ type: "error", text: error.message });
      resolve({ ok: false, threadId, errorMsg: error.message });
    });

    child.on("close", (code: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanupTmpFile();

      // Process any remaining buffered line
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
        } catch { /* ignore */ }
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
      resolve({ ok, threadId, errorMsg: ok ? undefined : stderrBuf.trim() || `Exit code ${code}` });
    });
  });
}

/* ───── JSONL event parser ───── */

function parseCodexMessage(msg: Record<string, unknown>): CodexEvent | null {
  const type = msg.type as string;

  switch (type) {
    case "thread.started":
      return { type: "thread_started", threadId: msg.thread_id as string };

    case "turn.started":
      return { type: "turn_started" };

    case "turn.completed": {
      const usage = msg.usage as Record<string, number> | undefined;
      return {
        type: "turn_completed",
        usage: usage ? { input_tokens: usage.input_tokens ?? 0, output_tokens: usage.output_tokens ?? 0 } : undefined
      };
    }

    case "item.started": {
      const item = msg.item as Record<string, unknown>;
      if (item?.type === "command_execution") {
        return {
          type: "command_started",
          command: item.command as string,
          status: "running"
        };
      }
      return null;
    }

    case "item.completed": {
      const item = msg.item as Record<string, unknown>;
      if (!item) return null;

      switch (item.type) {
        case "agent_message":
          return { type: "agent_message", text: item.text as string };

        case "reasoning":
          return { type: "reasoning", text: item.text as string };

        case "command_execution":
          return {
            type: "command_completed",
            command: item.command as string,
            exitCode: item.exit_code as number,
            output: item.aggregated_output as string,
            status: item.status as string
          };

        default:
          return null;
      }
    }

    default:
      return null;
  }
}
