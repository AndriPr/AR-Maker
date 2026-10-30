import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define protected and auth routes
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');

  // The QR/share link must stay public so visitors can open the MindAR
  // experience without an account.
  const isPublicArRoute = request.nextUrl.pathname.startsWith('/ar-viewer') ||
    request.nextUrl.pathname.startsWith('/ar-canvas');

  // Static files or public assets should never be redirected to login
  const isPublicAsset =
    request.nextUrl.pathname.startsWith('/ar-education-runtime') ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|json|mind|glb|gltf|mp3|wav|ogg|mp4|webm|woff|woff2|ttf)$/i.test(request.nextUrl.pathname);

  // Exclude root '/' because it might be a public landing page in some apps, but here '/' is My Projects dashboard.
  // Let's assume '/' is protected.
  const isProtectedRoute = !isAuthRoute && !isPublicArRoute && !isPublicAsset && !request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.startsWith('/_next');

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    // If user is logged in and tries to access login/register, redirect to dashboard
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
