/**
 * Default shell execution policy (placeholder until interactive approval ships).
 * Blocks obvious destructive patterns and unknown command prefixes.
 */
export function evaluateShellCommandPolicy(command: string): { allowed: boolean; reason?: string } {
  const trimmed = command.trim()
  if (!trimmed) {
    return { allowed: false, reason: 'Empty command.' }
  }

  const blocked =
    /(\brm\b|\bmkfs\b|\bdd\b|\bshutdown\b|\breboot\b|>\s*\/dev\/|curl\s.*\|\s*sh|wget\s.*\|\s*bash)/i.test(
      trimmed,
    )
  if (blocked) {
    return {
      allowed: false,
      reason: 'Command matched a destructive-pattern blocklist (placeholder policy).',
    }
  }

  const allowedPrefix =
    /^(pwd|whoami|uname|ls(\s|$)|git\s+status|git\s+branch|git\s+log|git\s+diff|git\s+show|bun\s+test|bun\s+run|bunx\s|npm\s+test|npm\s+run|pnpm\s+test|pnpm\s+run|yarn\s+test|yarn\s+run|node\s+--version|bun\s+--version|rg\s|grep\s|echo\s)/i

  if (!allowedPrefix.test(trimmed)) {
    return {
      allowed: false,
      reason:
        'Command not on the default allowlist. Tool approval UI is not wired yet; extend ToolShellPolicy or run a narrower command.',
    }
  }

  return { allowed: true }
}
