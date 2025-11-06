import ObservationsList from './observations/ObservationsList'

export default function Observations() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Observation Hours</h1>
      <p className="text-muted-foreground mb-6">
        Track your observation hours
      </p>
      <ObservationsList />
    </div>
  )
}

