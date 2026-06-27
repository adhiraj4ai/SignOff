export interface PreToolUseEvent {
  cwd: string;
  tool_name: string;
  tool_input: {
    file_path?: string;
    notebook_path?: string;
    [key: string]: unknown;
  };
}

export interface GateDecision {
  allow: boolean;
  reason?: string;
}
