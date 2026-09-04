import { greetingForHour } from '../lib/format'

export function GreetingHeader() {
  const greeting = greetingForHour(new Date().getHours())
  return (
    <div className="px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">{greeting}</h1>
    </div>
  )
}
