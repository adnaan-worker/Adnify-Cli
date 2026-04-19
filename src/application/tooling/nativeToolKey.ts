/**
 * Normalizes catalog tool ids (e.g. `workspace-read`) to AI SDK / provider-safe keys.
 */
export function nativeToolKeyFromCatalogId(id: string): string {
  return id.replace(/-/g, '_')
}
