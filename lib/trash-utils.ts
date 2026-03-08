import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Soft-delete a model (moves to trash, recoverable for 30 days)
 */
export async function softDeleteModel(supabase: SupabaseClient, modelId: string) {
  return await supabase
    .from('models')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', modelId)
}

/**
 * Restore a soft-deleted model
 */
export async function restoreModel(supabase: SupabaseClient, modelId: string) {
  return await supabase
    .from('models')
    .update({
      is_deleted: false,
      deleted_at: null,
    })
    .eq('id', modelId)
}

/**
 * Permanently delete a model (after 30 days or from trash page)
 */
export async function permanentlyDeleteModel(supabase: SupabaseClient, modelId: string) {
  return await supabase.from('models').delete().eq('id', modelId)
}

/**
 * Calculate days until auto-purge
 */
export function daysUntilPurge(deletedAt: string): number {
  const now = new Date().getTime()
  const deleted = new Date(deletedAt).getTime()
  const daysSinceDelete = Math.floor((now - deleted) / (1000 * 60 * 60 * 24))
  return Math.max(0, 30 - daysSinceDelete)
}

/**
 * Format deletion info for display
 */
export function formatTrashItem(item: any) {
  const daysLeft = daysUntilPurge(item.deleted_at)
  const deletedDate = new Date(item.deleted_at).toLocaleDateString()
  
  return {
    ...item,
    daysUntilPurge: daysLeft,
    deletedDate,
    purgeWarning: daysLeft <= 5, // Show warning in last 5 days
  }
}
