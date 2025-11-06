import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import ApplicationsList from '@/features/applications/ApplicationsList'

export default function Applications() {
  const applicationsListRef = useRef<{ openAddDialog: () => void }>(null)

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Application Tracker</h1>
          <p className="text-muted-foreground">
            Manage your DPT program applications
          </p>
        </div>
        <Button
          className="bg-[#FF4777] hover:bg-[#FF4777]/90 text-white"
          onClick={() => applicationsListRef.current?.openAddDialog()}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Application
        </Button>
      </div>
      <ApplicationsList ref={applicationsListRef} />
    </div>
  )
}

