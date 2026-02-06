import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
  console.log("🔵 [HOME] Проверка на корисник...")
  
  const supabase = await createClient()
  
  // Try to manually set session from cookies if available (similar to middleware)
  const cookieStore = await import('next/headers').then(m => m.cookies())
  const authTokenCookie = cookieStore.get('sb-xzjbizaszabvuuqxzwlt-auth-token')
  
  let authenticatedUser = null
  let sessionFromCookie = null
  
  if (authTokenCookie) {
    try {
      const cookieData = JSON.parse(authTokenCookie.value)
      if (cookieData.access_token) {
        console.log("🔵 [HOME] Attempting to set session from cookie...")
        const { data: { session: setSessionData }, error: setError } = await supabase.auth.setSession({
          access_token: cookieData.access_token,
          refresh_token: cookieData.refresh_token || ''
        })
        if (setSessionData && !setError) {
          console.log("✅ [HOME] Session set from cookie successfully")
          sessionFromCookie = setSessionData
          authenticatedUser = setSessionData.user
        } else {
          console.log("🔵 [HOME] setSession failed:", setError?.message)
        }
      }
    } catch (e) {
      console.log("🔵 [HOME] Failed to set session from cookie:", e)
    }
  }
  
  // If we got user from setSession, use it directly
  if (!authenticatedUser) {
    // Try getSession first, then getUser
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log("🔵 [HOME] Session check:", { 
      hasSession: !!session,
      hasUser: !!session?.user,
      sessionError: sessionError?.message 
    })
    
    if (session?.user) {
      authenticatedUser = session.user
    } else {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log("🔵 [HOME] User check:", { 
        hasUser: !!user, 
        userId: user?.id,
        userError: userError?.message 
      })
      authenticatedUser = user
    }
  }

  if (!authenticatedUser) {
    console.log("❌ [HOME] Нема корисник, редиректирање на /login")
    // If there's an error getting user, redirect to login
    redirect("/login")
  }

  console.log("🔵 [HOME] Читање на профил за:", authenticatedUser.id)
  
  // Check if profile exists - use .maybeSingle() to handle case where profile doesn't exist
  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authenticatedUser.id)
    .maybeSingle()

  console.log("🔵 [HOME] Profile check:", { 
    hasProfile: !!profile, 
    role: profile?.role,
    profileError: profileError?.message,
    errorCode: profileError?.code 
  })

  // If profile doesn't exist, try to create it (but don't fail if RLS blocks it)
  if (!profile && profileError?.code === "PGRST116") {
    console.log("🔵 [HOME] Профилот не постои, обидување за креирање...")
    // Try to insert profile - if it fails due to RLS, that's okay, we'll use default role
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: authenticatedUser.id,
        email: authenticatedUser.email!,
        full_name: authenticatedUser.user_metadata?.full_name || null,
        role: authenticatedUser.user_metadata?.role || "employee",
      })
      .select()
      .maybeSingle()

    if (!insertError && newProfile) {
      console.log("✅ [HOME] Профилот е креиран")
      profile = newProfile
    } else if (insertError) {
      console.log("🔵 [HOME] Не може да се креира профил (можеби веќе постои или RLS блокира):", insertError.message)
      // Try to fetch again in case it was created by trigger
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authenticatedUser.id)
        .maybeSingle()
      profile = existingProfile
    }
  }

  // Default to employee if we still don't have a profile
  const role = profile?.role || "employee"

  console.log("✅ [HOME] Редиректирање на dashboard за role:", role)

  // Redirect based on role
  if (role === "admin") {
    redirect("/dashboard/admin")
  } else {
    redirect("/dashboard/employee")
  }
}
