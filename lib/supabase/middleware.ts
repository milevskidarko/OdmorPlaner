import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  console.log(`🔵 [MIDDLEWARE] Request to: ${pathname}`)

  // Debug: Check incoming cookies
  const incomingCookies = request.cookies.getAll()
  const supabaseCookies = incomingCookies.filter(c => 
    c.name.startsWith('sb-') || c.name.includes('supabase')
  )
  console.log(`🔵 [MIDDLEWARE] Incoming Supabase cookies:`, 
    supabaseCookies.map(c => `${c.name} (${c.value.substring(0, 20)}...)`).join(', ') || 'none'
  )
  
  // Check if auth token cookie exists and has value
  const authTokenCookie = request.cookies.get('sb-xzjbizaszabvuuqxzwlt-auth-token')
  if (authTokenCookie) {
    console.log(`🔵 [MIDDLEWARE] Auth token cookie exists, length: ${authTokenCookie.value.length}`)
    // Try to parse the cookie value to see if it's valid JSON
    try {
      const parsed = JSON.parse(authTokenCookie.value)
      console.log(`🔵 [MIDDLEWARE] Cookie is valid JSON, has access_token: ${!!parsed.access_token}`)
    } catch (e) {
      console.log(`❌ [MIDDLEWARE] Cookie is not valid JSON: ${e}`)
    }
  } else {
    console.log(`❌ [MIDDLEWARE] Auth token cookie missing`)
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll()
          return cookies
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          console.log(`🔵 [MIDDLEWARE] Setting ${cookiesToSet.length} cookies`)
          cookiesToSet.forEach(({ name, value }: { name: string; value: string; options?: any }) => {
            request.cookies.set(name, value)
            console.log(`  - Setting cookie: ${name.substring(0, 20)}...`)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Try to manually set session from cookie if it exists
  let user = null
  let session = null
  
  if (authTokenCookie) {
    try {
      const cookieData = JSON.parse(authTokenCookie.value)
      if (cookieData.access_token) {
        console.log(`🔵 [MIDDLEWARE] Attempting to set session from cookie...`)
        // Try to set the session manually - this will update cookies via setAll
        const { data: { session: setSessionData }, error: setError } = await supabase.auth.setSession({
          access_token: cookieData.access_token,
          refresh_token: cookieData.refresh_token || ''
        })
        
        if (setSessionData && !setError) {
          session = setSessionData
          user = setSessionData.user
          console.log(`✅ [MIDDLEWARE] Session set from cookie successfully, user: ${user?.id}`)
          
          // Ensure cookies are properly set in the response
          // The setAll callback should have already updated supabaseResponse, but let's verify
          const updatedCookies = request.cookies.getAll()
          const updatedSupabaseCookies = updatedCookies.filter(c => 
            c.name.startsWith('sb-') || c.name.includes('supabase')
          )
          console.log(`🔵 [MIDDLEWARE] Cookies after setSession:`, 
            updatedSupabaseCookies.map(c => c.name).join(', ') || 'none'
          )
        } else {
          console.log(`🔵 [MIDDLEWARE] setSession failed:`, setError?.message)
        }
      }
    } catch (e) {
      console.log(`🔵 [MIDDLEWARE] Failed to parse cookie or set session:`, e)
    }
  }
  
  // If manual set didn't work, try refresh
  if (!user) {
    try {
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshedSession) {
        session = refreshedSession
        user = refreshedSession.user
        console.log(`✅ [MIDDLEWARE] Session refreshed successfully`)
      }
    } catch (e) {
      console.log(`🔵 [MIDDLEWARE] Refresh failed, trying getUser()...`)
    }
  }

  // If refresh didn't work, try getUser
  if (!user) {
    const {
      data: { user: userData },
      error: userError
    } = await supabase.auth.getUser()

    console.log(`🔵 [MIDDLEWARE] User check for ${pathname}:`, { 
      hasUser: !!userData, 
      userId: userData?.id,
      hasError: !!userError,
      errorMessage: userError?.message,
      errorCode: userError?.status 
    })
    
    user = userData

    // If getUser fails, try getSession as fallback
    if (!user && userError) {
      console.log(`🔵 [MIDDLEWARE] Trying getSession() as fallback...`)
      const { data: { session: sessionData }, error: sessionError } = await supabase.auth.getSession()
      session = sessionData
      if (sessionData) {
        user = sessionData.user
      }
      console.log(`🔵 [MIDDLEWARE] Session fallback:`, { 
        hasSession: !!session,
        hasUser: !!user,
        sessionError: sessionError?.message 
      })
    }
  }

  // Use user from any of the methods above
  const authenticated = user

  if (
    !authenticated &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/register')
  ) {
    console.log(`❌ [MIDDLEWARE] Нема корисник, редиректирање на /login`)
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  console.log(`✅ [MIDDLEWARE] Дозволен пристап до ${pathname}`)

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}
