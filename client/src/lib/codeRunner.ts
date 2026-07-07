import type { CodeLanguage, RunResult } from "../types.ts";

const JS_TIMEOUT_MS = 5_000;
const PYTHON_RUN_TIMEOUT_MS = 20_000;
// First Python run downloads the Pyodide runtime (~10 MB), so it gets longer.
const PYTHON_LOAD_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_CHARS = 4_000;

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

interface WorkerResult {
  ok: boolean;
  logs: string[];
  error?: string;
}

// Runs inside a Worker: no DOM, no parent scope. Console output is captured
// and the final expression value is echoed like a REPL.
const JS_WORKER_SOURCE = `
  const logs = [];
  const format = (value) => {
    if (typeof value === "string") return value;
    if (value instanceof Error) return String(value.stack || value);
    try {
      const json = JSON.stringify(value);
      return json === undefined ? String(value) : json;
    } catch {
      return String(value);
    }
  };
  for (const level of ["log", "info", "warn", "error", "debug"]) {
    console[level] = (...args) => logs.push(args.map(format).join(" "));
  }
  self.onmessage = (e) => {
    try {
      const result = new Function(e.data)();
      if (result !== undefined) logs.push(format(result));
      self.postMessage({ ok: true, logs });
    } catch (err) {
      self.postMessage({ ok: false, logs, error: format(err) });
    }
  };
`;

const PYTHON_WORKER_SOURCE = `
  importScripts("${PYODIDE_CDN}pyodide.js");
  const ready = loadPyodide({ indexURL: "${PYODIDE_CDN}" });
  self.onmessage = async (e) => {
    const logs = [];
    try {
      const py = await ready;
      py.setStdout({ batched: (line) => logs.push(line) });
      py.setStderr({ batched: (line) => logs.push(line) });
      const result = await py.runPythonAsync(e.data);
      if (result !== undefined) logs.push(String(result));
      self.postMessage({ ok: true, logs });
    } catch (err) {
      self.postMessage({ ok: false, logs, error: String(err) });
    }
  };
`;

function spawnWorker(source: string): Worker {
  const url = URL.createObjectURL(new Blob([source], { type: "application/javascript" }));
  const worker = new Worker(url);
  URL.revokeObjectURL(url);
  return worker;
}

// The Python worker is cached: loading the runtime takes seconds, so keep it
// warm between runs. A timed-out run terminates and drops the cache.
let pythonWorker: Worker | null = null;
let pythonWorkerReady = false;

function runInWorker(worker: Worker, code: string, timeoutMs: number): Promise<WorkerResult> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      worker.terminate();
      if (worker === pythonWorker) {
        pythonWorker = null;
        pythonWorkerReady = false;
      }
      resolve({
        ok: false,
        logs: [],
        error: `Timed out after ${Math.round(timeoutMs / 1000)}s. Check for infinite loops.`
      });
    }, timeoutMs);

    worker.onmessage = (e: MessageEvent<WorkerResult>) => {
      clearTimeout(timer);
      resolve(e.data);
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      resolve({ ok: false, logs: [], error: e.message || "The code runner crashed." });
    };
    worker.postMessage(code);
  });
}

export async function runCode(language: CodeLanguage, code: string): Promise<RunResult> {
  const startedAt = performance.now();
  let result: WorkerResult;

  if (language === "python") {
    const isFirstRun = !pythonWorkerReady;
    pythonWorker ??= spawnWorker(PYTHON_WORKER_SOURCE);
    result = await runInWorker(
      pythonWorker,
      code,
      isFirstRun ? PYTHON_LOAD_TIMEOUT_MS : PYTHON_RUN_TIMEOUT_MS
    );
    if (pythonWorker) pythonWorkerReady = true;
  } else {
    const worker = spawnWorker(JS_WORKER_SOURCE);
    result = await runInWorker(worker, code, JS_TIMEOUT_MS);
    worker.terminate();
  }

  const output = result.logs.join("\n").slice(0, MAX_OUTPUT_CHARS);
  return {
    ok: result.ok,
    output,
    error: result.error,
    durationMs: Math.round(performance.now() - startedAt)
  };
}

/** Renders a run result as the plain-text block shown in the UI and attached to the turn. */
export function formatRunResult(result: RunResult): string {
  const parts: string[] = [];
  if (result.output) parts.push(result.output);
  if (result.error) parts.push(result.error);
  if (parts.length === 0) parts.push(result.ok ? "(no output)" : "(failed with no output)");
  return parts.join("\n");
}
