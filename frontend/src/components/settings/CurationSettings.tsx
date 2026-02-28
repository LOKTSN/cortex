import { useProfileStore } from "@/stores/profile-store"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ChatPlaceholder } from "@/components/ui/chat-placeholder"

export function CurationSettings() {
  const { profile, toggleSource } = useProfileStore()

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left: Template */}
      <Card>
        <CardHeader>
          <CardTitle>Curation Template</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase text-text-subtle">Field</label>
                <p className="text-sm font-semibold">{profile.field}</p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase text-text-subtle">
                  Sources
                </label>
                <div className="space-y-3">
                  {profile.sources.map((source, i) => (
                    <label key={source.name} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={source.enabled}
                        onCheckedChange={() => toggleSource(i)}
                      />
                      <span className="text-sm">{source.name}</span>
                    </label>
                  ))}
                </div>
                <button className="mt-3 text-sm text-text-muted hover:text-text cursor-pointer">
                  + Add source...
                </button>
              </div>

              <div>
                <label className="text-xs font-medium uppercase text-text-subtle">Level</label>
                <p className="text-sm">{profile.level}</p>
              </div>

              <div>
                <label className="text-xs font-medium uppercase text-text-subtle">Depth</label>
                <p className="text-sm">{profile.depth}</p>
              </div>

              <div>
                <label className="text-xs font-medium uppercase text-text-subtle">Interval</label>
                <p className="text-sm">{profile.interval}</p>
              </div>

              <div>
                <label className="text-xs font-medium uppercase text-text-subtle">Focus Areas</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {profile.focusAreas.map((area) => (
                    <span
                      key={area}
                      className="rounded-full bg-bg-muted px-3 py-1 text-xs font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase text-text-subtle">Goal</label>
                <p className="text-sm">{profile.goal}</p>
              </div>

              <div>
                <label className="text-xs font-medium uppercase text-text-subtle">Time Budget</label>
                <p className="text-sm">{profile.timeBudget}</p>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right: Chat with Cortex */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Refine with Cortex</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="h-[500px] rounded-lg border">
            <ChatPlaceholder
              title="Cortex"
              initialMessage="I've loaded the AI/ML preset. It covers arxiv, HN, and ML blogs. What's your role? That'll help me tune the sources and depth."
            />
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <Button size="lg" className="w-full">
          Voice Mode
        </Button>
      </div>
    </div>
  )
}
