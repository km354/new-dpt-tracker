import SchoolsList from './schools/SchoolsList'

export default function Schools() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Schools</h1>
        <p className="text-muted-foreground">
          Manage your list of DPT programs
        </p>
      </div>
      <SchoolsList />
    </div>
  )
}

