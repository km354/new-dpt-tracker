import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function Applications() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Application Tracker</h1>
          <p className="text-muted-foreground">
            Manage your DPT program applications
          </p>
        </div>
        <Button className="bg-[#FF4777] hover:bg-[#FF4777]/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Application
        </Button>
      </div>
      <div className="border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-600">
          No applications yet. Click "Add Application" to get started!
        </p>
      </div>
    </div>
  )
}

