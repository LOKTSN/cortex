import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Save, Loader2, SlidersHorizontal, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProfileStore } from '@/stores/profile'
import { ProfileForm } from '@/components/template/ProfileForm'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatPanel } from '@/components/ChatPanel'
import { FIELD_PRESETS, type FieldPreset } from '@/lib/presets'

function PresetPicker({ onSelect }: { onSelect: (preset: FieldPreset) => void }) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6">
      <div className="w-full max-w-3xl">
        <div className="mb-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <h1 className="font-serif text-3xl font-bold text-[var(--color-text)]">
          Set Up Your Feed
        </h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Pick a field to get started — you'll customize sources, depth, and focus areas next.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FIELD_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setSelected(preset.id)}
              className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                selected === preset.id
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim,rgba(0,0,0,0.03))]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
              }`}
            >
              <span className="mb-1 text-2xl">{preset.emoji}</span>
              <span className="text-sm font-semibold text-[var(--color-text)]">{preset.label}</span>
              <span className="mt-1 text-xs text-[var(--color-text-muted)]">{preset.detail}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={() => {
              const preset = FIELD_PRESETS.find((p) => p.id === selected)
              if (preset) onSelect(preset)
            }}
            disabled={!selected}
            className="gap-2 px-8"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}

function TemplateEditor({ onBack }: { onBack: () => void }) {
  const { profile, saving, fetchProfile, updateProfile, toggleSource, addFocusArea, removeFocusArea } =
    useProfileStore()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // After each AI response, re-fetch profile in case the AI modified it via write_file/edit_file
  const handleChatResponse = useCallback((data: { reply: string; tools_used: { name: string }[] }) => {
    const fileTools = ['write_file', 'edit_file']
    if (data.tools_used?.some(t => fileTools.includes(t.name))) {
      // AI modified files — re-fetch profile to pick up changes
      fetchProfile()
    }
  }, [fetchProfile])

  const chatContext = `You are helping the user configure their Cortex curation template.

CRITICAL RULES:
1. The ONLY file you should EVER modify is: data/profiles/default/profile.yaml
2. Do NOT list files, do NOT search the filesystem, do NOT edit any other file.
3. To make changes: use read_file on "data/profiles/default/profile.yaml", then edit_file or write_file on that SAME path.
4. NEVER touch files in frontend/, backend/, or any other directory.
5. Apply changes directly — do not just suggest them.

The profile.yaml is flat YAML with these fields:
- field: string (e.g. "AI / ML")
- sources: list of {id, type, enabled, ...type-specific-fields}
  - reddit: subreddits (list), min_score, hours_back
  - hackernews: filter (string with OR for multiple terms)
  - arxiv: categories (list like cs.AI, cs.LG)
  - exa: query (string), category ("news")
  - podcast: name (string)
- level: beginner | intermediate | advanced
- depth: beginner_friendly | executive | technical
- focus_areas: list of strings
- goal: stay_current | prepare_exams | teach_others
- interval: daily_6am | twice_daily | realtime
- breaking_alerts: true/false
- time_budget_min: number
- custom_instructions: free text (optional)

Current profile state:
${JSON.stringify(profile, null, 2)}

When modifying, first read_file("data/profiles/default/profile.yaml"), then edit_file or write_file on "data/profiles/default/profile.yaml". Preserve fields you are not changing.`

  return (
    <div className="flex h-[calc(100dvh-4rem)] animate-fade-in">
      {/* Left: Template form */}
      <div className="flex-1 min-w-0 bg-white border-r border-[var(--color-border)] flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-[var(--color-text-subtle)]" />
              <span className="text-sm font-medium text-[var(--color-text)]">
                {profile.field || 'Template'}
              </span>
            </div>
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
          initialMessage={
            profile.field
              ? `I've loaded the ${profile.field} preset. It covers ${profile.sources.filter(s => s.enabled).map(s => s.type).join(', ')}. Tell me about your role and interests, and I'll directly update your template for you.`
              : "Let's build your curation template from scratch. Tell me about your field and what you want to stay on top of — I'll set it up for you."
          }
          context={chatContext}
          onResponse={handleChatResponse}
        />
      </div>
    </div>
  )
}

export function TemplatePage() {
  const [mode, setMode] = useState<'pick' | 'edit'>('pick')
  const { applyPreset, fetchProfile } = useProfileStore()

  // If profile already exists on the backend, skip to editor
  useEffect(() => {
    fetchProfile().then(() => {
      const profile = useProfileStore.getState().profile
      if (profile.field) {
        setMode('edit')
      }
    })
  }, [fetchProfile])

  const handlePresetSelect = async (preset: FieldPreset) => {
    await applyPreset(preset.profile)
    setMode('edit')
  }

  if (mode === 'pick') {
    return <PresetPicker onSelect={handlePresetSelect} />
  }

  return <TemplateEditor onBack={() => setMode('pick')} />
}
