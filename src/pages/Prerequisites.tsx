import MyCourses from './prerequisites/MyCourses'

export default function Prerequisites() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Prerequisites</h1>
      <p className="text-muted-foreground mb-6">
        Track your prerequisite requirements and courses
      </p>
      <MyCourses />
    </div>
  )
}

