const MAX_TITLE_LENGTH = 48

export function createSessionTitle(prompt: string): string {
  const normalized = prompt
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return 'New Session'
  }

  if (normalized.length <= MAX_TITLE_LENGTH) {
    return normalized
  }

  const previewLimit = MAX_TITLE_LENGTH - 3
  const hardLimit = normalized.slice(0, previewLimit).trimEnd()
  const nextWordBoundary = normalized.indexOf(' ', previewLimit)

  if (nextWordBoundary !== -1 && nextWordBoundary <= previewLimit + 12) {
    return `${normalized.slice(0, nextWordBoundary).trimEnd()}...`
  }

  const lastWordBoundary = hardLimit.lastIndexOf(' ')
  const softLimit =
    lastWordBoundary >= Math.floor(previewLimit / 2) ? hardLimit.slice(0, lastWordBoundary) : hardLimit

  return `${softLimit}...`
}
