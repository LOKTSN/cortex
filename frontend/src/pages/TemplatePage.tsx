import { useEffect } from 'react'
import { Save, Loader2, SlidersHorizontal } from 'lucide-react'
import { useProfileStore } from '@/stores/profile'
import { ProfileForm } from '@/components/template/ProfileForm'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatPanel } from '@/components/ChatPanel'

export function TemplatePage() {
  const { profile, saving, fetchProfile, updateProfile, toggleSource, addFocusArea, removeFocusArea } =
    useProfileStore()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return (
    <div className="flex h-full animate-fade-in">
      {/* Left: Template form */}
      <div className="flex-1 min-w-0 bg-white border-r border-[var(--color-border)] flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-[var(--color-text-subtle)]" />
            <span className="text-sm font-medium text-[var(--color-text)]">Settings</span>
          </div>
          <Button variant="default" size="sm" className="gap-1.5" onClick={() => updateProfile(profile)}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Save
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-5 max-w-2xl">
            <ProfileForm
              profile={profile}
              onUpdate={updateProfile}
              onToggleSource={toggleSource}
              onAddFocusArea={addFocusArea}
              onRemoveFocusArea={removeFocusArea}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Right: Chat */}
      <div className="w-96 shrink-0 bg-white flex flex-col overflow-hidden">
        <ChatPanel
          title="Refine with Cortex"
          initialMessage="I've loaded your curation template. Tell me about your role and interests, and I'll help tune the sources, depth, and focus areas for you."
          context={JSON.stringify(profile)}
        />
      </div>
    </div>
  )
}
