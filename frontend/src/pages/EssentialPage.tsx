import { useSearchParams } from "react-router-dom"
import { useTopicsStore } from "@/stores/topics-store"
import { useAuthStore } from "@/stores/auth-store"
import { Greeting } from "@/components/essential/Greeting"
import { TldrBox } from "@/components/essential/TldrBox"
import { PromoBanner } from "@/components/essential/PromoBanner"
import { TopicCard } from "@/components/essential/TopicCard"
import { OnboardingModal } from "@/components/onboarding/OnboardingModal"
import { Button } from "@/components/ui/button"

export function EssentialPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const topics = useTopicsStore((s) => s.topics)
  const { isOnboarded } = useAuthStore()
  const showSignup = searchParams.get("signup") === "true"

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Greeting />
      <TldrBox />
      {!isOnboarded && <PromoBanner />}

      <div>
        {topics.map((topic) => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </div>

      <div className="mt-8">
        <Button size="lg" className="w-full">
          Set it as Homepage
        </Button>
      </div>

      <OnboardingModal
        open={showSignup}
        onOpenChange={(open) => {
          if (!open) setSearchParams({})
        }}
      />
    </div>
  )
}
