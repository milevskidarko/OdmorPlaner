import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  
  // Try to set session from cookie first
  const cookieStore = await cookies()
  const authTokenCookie = cookieStore.get('sb-xzjbizaszabvuuqxzwlt-auth-token')
  
  let authenticatedUser = null
  
  if (authTokenCookie) {
    try {
      const cookieData = JSON.parse(authTokenCookie.value)
      if (cookieData.access_token) {
        const { data: { session: setSessionData }, error: setError } = await supabase.auth.setSession({
          access_token: cookieData.access_token,
          refresh_token: cookieData.refresh_token || ''
        })
        if (setSessionData && !setError) {
          authenticatedUser = setSessionData.user
        }
      }
    } catch (e) {
      // Ignore
    }
  }
  
  if (!authenticatedUser) {
    const { data: { user } } = await supabase.auth.getUser()
    authenticatedUser = user
  }
  
  return authenticatedUser
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient()
  
  // Try to set session first for RLS context
  const cookieStore = await cookies()
  const authTokenCookie = cookieStore.get('sb-xzjbizaszabvuuqxzwlt-auth-token')
  
  if (authTokenCookie) {
    try {
      const cookieData = JSON.parse(authTokenCookie.value)
      if (cookieData.access_token) {
        await supabase.auth.setSession({
          access_token: cookieData.access_token,
          refresh_token: cookieData.refresh_token || ''
        })
      }
    } catch (e) {
      // Ignore
    }
  }
  
  // First try direct query (works if RLS context is available)
  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()
  
  // If that fails or returns no data, try using SECURITY DEFINER function
  if (!profile && (!profileError || profileError.code === "PGRST116")) {
    console.log("🔵 [getUserProfile] Direct query failed, trying RPC function...")
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_user_profile', { p_user_id: userId })
    
    if (!rpcError && rpcData && rpcData.length > 0) {
      profile = rpcData[0]
      profileError = null
      console.log("✅ [getUserProfile] Profile fetched via RPC function")
    } else {
      console.log("🔵 [getUserProfile] RPC also failed:", rpcError?.message)
      profileError = rpcError || profileError
    }
  }
  
  console.log("🔵 [getUserProfile] Profile fetch result:", {
    userId,
    hasProfile: !!profile,
    role: profile?.role,
    error: profileError?.message,
    errorCode: profileError?.code
  })
  
  return { profile, profileError }
}
