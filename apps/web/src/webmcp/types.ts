export type JsonSchema = {
  type: "object";
  properties?: Record<string, Record<string, unknown>>;
  required?: string[];
  additionalProperties?: boolean;
};

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent: Record<string, unknown>;
};

export type WebMCPTool<TArgs extends Record<string, unknown> = Record<string, unknown>> = {
  name: string;
  title?: string;
  description: string;
  inputSchema: JsonSchema;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (args: TArgs, options?: { signal?: AbortSignal }) => Promise<ToolResult> | ToolResult;
};

export type ModelContext = {
  registerTool: (
    tool: WebMCPTool,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ) => Promise<void>;
};

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

