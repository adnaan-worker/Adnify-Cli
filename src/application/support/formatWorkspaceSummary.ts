import type { AppI18n } from '../i18n/AppI18n'
import type { WorkspaceContext } from '../../domain/workspace/entities/WorkspaceContext'

/**
 * 统一构建工作区摘要文案，避免领域实体直接承担展示语言职责。
 */
export function formatWorkspaceSummary(workspace: WorkspaceContext, i18n: AppI18n): string {
  return [
    i18n.t('workspace.summaryTitle'),
    i18n.t('workspace.root', { value: workspace.rootPath }),
    i18n.t('workspace.git', {
      value: i18n.t(workspace.isGitRepository ? 'common.yes' : 'common.no'),
    }),
    i18n.t('workspace.packageManager', { value: workspace.packageManager }),
    i18n.t('workspace.topLevelEntries', {
      value: workspace.topLevelEntries.join(', ') || i18n.t('workspace.none'),
    }),
  ].join('\n')
}
