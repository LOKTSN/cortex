import { useAuthStore } from "@/stores/auth-store"

const greetingWord = (() => {
  const h = new Date().getHours()
  if (h < 12) return "morning"
  if (h < 17) return "afternoon"
  return "evening"
})()

export function Greeting() {
  const { userName, isOnboarded } = useAuthStore()
  const name = isOnboarded ? userName : "there"

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-text">
        Good {greetingWord}, {name}.
      </h1>
      <p className="text-sm text-text-muted mt-1">Here's what happened while you were away.</p>
    </div>
  )
}
