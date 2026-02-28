import { useAuthStore } from "@/stores/auth-store"

export function Greeting() {
  const { userName, isOnboarded } = useAuthStore()
  const name = isOnboarded ? userName : "there"

  return (
    <div className="mb-6">
      <h1 className="font-serif text-3xl font-bold text-text">
        Good morning, {name}. Here's what happened overnight:
      </h1>
    </div>
  )
}
