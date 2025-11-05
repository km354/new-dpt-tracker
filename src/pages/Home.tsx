import { useNavigate } from 'react-router-dom'
import { signOut } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">DPT Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Welcome to DPT Tracker. Your dashboard is coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}

