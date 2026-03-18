import { Outlet } from '@tanstack/react-router'
import { AuthGuard } from '@/components/AuthGuard'
import { AppLayout } from '@/layout/AppLayout'

export function AppShell() {
  return (
    <AuthGuard>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AuthGuard>
  )
}
