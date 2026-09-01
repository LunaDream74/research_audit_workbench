import type { ModelContext, WebMCPTool } from "./types";

export type WebMCPRegistration = {
  supported: boolean;
  ready: Promise<void>;
  abort: () => void;
};

export function toolResult(data: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
    structuredContent: data,
  };
}

export function registerWebMCPTools(
  tools: WebMCPTool[],
  modelContext: ModelContext | undefined =
    typeof document === "undefined" ? undefined : document.modelContext,
): WebMCPRegistration {
  const controller = new AbortController();
  if (!modelContext || typeof modelContext.registerTool !== "function") {
    return { supported: false, ready: Promise.resolve(), abort: () => controller.abort() };
  }

  const ready = Promise.all(
    tools.map((tool) => modelContext.registerTool(tool, { signal: controller.signal })),
  ).then(() => undefined);

  return { supported: true, ready, abort: () => controller.abort() };
}

