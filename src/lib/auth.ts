import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface AuthResponse {
  user: User | null
  error: Error | null
}

export async function signUp(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return { user: null, error: error as Error }
    }

    return { user: data.user, error: null }
  } catch (error) {
    return { user: null, error: error as Error }
  }
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { user: null, error: error as Error }
    }

    return { user: data.user, error: null }
  } catch (error) {
    return { user: null, error: error as Error }
  }
}

export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { error: error as Error }
    }
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

