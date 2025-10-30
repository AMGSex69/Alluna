import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Простая проверка наличия auth токенов
  // const accessToken = request.cookies.get('sb-access-token')?.value
  // const refreshToken = request.cookies.get('sb-refresh-token')?.value
  
  // console.log('Middleware: Checking auth tokens')
  // console.log('Middleware: Access token exists:', !!accessToken)
  // console.log('Middleware: Refresh token exists:', !!refreshToken)

  // const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  // const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  // const isProtectedRoute = !isAuthPage && !isApiRoute &&
  //   !request.nextUrl.pathname.startsWith('/_next') &&
  //   !request.nextUrl.pathname.includes('.')

  // console.log('Middleware: isAuthPage:', isAuthPage, 'isProtectedRoute:', isProtectedRoute)

  // // Простая проверка: если есть токен, считаем пользователя аутентифицированным
  // const isAuthenticated = !!(accessToken || refreshToken)

  // // Если пользователь не аутентифицирован и пытается получить доступ к защищенному маршруту
  // if (!isAuthenticated && isProtectedRoute) {
  //   console.log('Middleware: No auth tokens, redirecting to signin')
  //   const redirectUrl = new URL('/auth/signin', request.url)
  //   return NextResponse.redirect(redirectUrl)
  // }

  // // Если пользователь аутентифицирован и пытается получить доступ к страницам аутентификации
  // if (isAuthenticated && isAuthPage) {
  //   console.log('Middleware: User authenticated, redirecting from auth page to home')
  //   const redirectUrl = new URL('/', request.url)
  //   return NextResponse.redirect(redirectUrl)
  // }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}