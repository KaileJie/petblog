import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/blogs', '/auth/login', '/auth/sign-up', '/subscribe', '/success']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  )

  // Redirect unauthenticated users (except for public routes)
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Check subscription for dashboard and protected routes
  // IMPORTANT: Skip subscription check if session_id is present (allows verification to complete)
  if (user && (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/protected'))) {
    const sessionId = request.nextUrl.searchParams.get('session_id')
    
    // Allow access if session_id is present (post-payment verification in progress)
    if (!sessionId) {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        // Check subscription with retry logic (handles webhook race condition)
        let subscription = null
        let retries = 2
        
        while (retries >= 0 && !subscription) {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('user_id', authUser.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          if (subData) {
            subscription = subData
            break
          }
          
          // Wait before retry (webhook might still be processing)
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          retries--
        }

        if (!subscription) {
          const url = request.nextUrl.clone()
          url.pathname = '/subscribe'
          return NextResponse.redirect(url)
        }
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
