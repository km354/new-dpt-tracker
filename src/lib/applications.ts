import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface CreateApplicationData {
  school_id: string
  status: 'planned' | 'submitted' | 'interview' | 'accepted' | 'rejected'
  app_fee?: number | null
  deadline?: string | null
  notes?: string | null
}

export interface UpdateApplicationData extends Partial<CreateApplicationData> {
  id: string
}

export async function createApplication(
  user: User,
  data: CreateApplicationData
) {
  const { data: application, error } = await supabase
    .from('applications')
    .insert({
      ...data,
      owner_id: user.id,
      submitted_at: data.status === 'submitted' ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) throw error
  return application
}

export async function updateApplication(
  user: User,
  data: UpdateApplicationData
) {
  const { id, ...updateData } = data
  
  const updatePayload: any = { ...updateData }
  if (updateData.status === 'submitted' && !updatePayload.submitted_at) {
    updatePayload.submitted_at = new Date().toISOString()
  }

  const { data: application, error } = await supabase
    .from('applications')
    .update(updatePayload)
    .eq('id', id)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) throw error
  return application
}

export async function deleteApplication(user: User, id: string) {
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) throw error
}

