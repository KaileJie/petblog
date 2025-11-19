import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated', authError },
        { status: 401 }
      )
    }

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      subscription: subscription || null,
      subscriptionError: subError || null,
      hasActiveSubscription: subscription?.some(
        (sub) => sub.status === 'active'
      ) || false,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

