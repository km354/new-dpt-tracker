import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, X } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useState } from 'react'

export function NotificationPermissionPrompt() {
  const { permission, requestPermission, isSupported } = useNotifications()
  const [dismissed, setDismissed] = useState(false)

  if (!isSupported || permission === 'granted' || dismissed) {
    return null
  }

  const handleRequest = async () => {
    const granted = await requestPermission()
    if (granted) {
      setDismissed(true)
    }
  }

  return (
    <Card className="mb-4 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Enable Notifications</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-3">
          Get notified about upcoming deadlines and important events to stay on top of your
          applications.
        </CardDescription>
        <Button onClick={handleRequest} size="sm" className="w-full sm:w-auto">
          Enable Notifications
        </Button>
      </CardContent>
    </Card>
  )
}

