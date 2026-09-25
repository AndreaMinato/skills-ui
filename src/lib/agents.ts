/**
 * Agent ids accepted by `skills add --agent`. Mirrors the CLI's "Valid agents"
 * list; unknown ids can still be typed in the picker.
 */
export const AGENT_IDS = [
  'adal', 'aider-desk', 'amp', 'antigravity', 'antigravity-cli', 'astrbot', 'augment', 'autohand-code',
  'bob', 'claude-code', 'cline', 'codearts-agent', 'codebuddy', 'codemaker', 'codestudio', 'codex',
  'command-code', 'continue', 'cortex', 'crush', 'cursor', 'deepagents', 'devin', 'dexto', 'droid', 'eve',
  'firebender', 'forgecode', 'fx', 'gemini-cli', 'github-copilot', 'goose', 'grok', 'hermes-agent',
  'iflow-cli', 'inference-sh', 'jazz', 'junie', 'kilo', 'kimchi', 'kimi-code-cli', 'kiro-cli', 'kode',
  'lingma', 'loaf', 'mcpjam', 'minimax-code', 'mistral-vibe', 'moxby', 'mux', 'neovate', 'ona',
  'openclaw', 'opencode', 'openhands', 'pi', 'pochi', 'posit-assistant', 'promptscript', 'qoder',
  'qoder-cn', 'qwen-code', 'reasonix', 'replit', 'roo', 'rovodev', 'sarvam-code', 'tabnine-cli',
  'terramind', 'tinycloud', 'trae', 'trae-cn', 'universal', 'warp', 'windsurf', 'zcode', 'zed',
  'zencoder', 'zenflow',
] as const

/** Shown before the rest in the picker. */
export const POPULAR_AGENTS = [
  'claude-code', 'cursor', 'codex', 'gemini-cli', 'github-copilot', 'opencode', 'windsurf', 'zed', 'cline', 'amp',
]

/** `ls --json` reports display names ("Claude Code"); normalize to compare with ids. */
export function agentKey(nameOrId: string): string {
  return nameOrId.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}
