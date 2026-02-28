import { useState } from 'react'
import { Plus, X, Briefcase, Rss, GraduationCap, Layers, Clock, Target, Flag, Timer } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Profile } from '@/stores/profile'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ProfileFormProps {
  profile: Profile
  onUpdate: (updates: Partial<Profile>) => void
  onToggleSource: (sourceId: string) => void
  onAddFocusArea: (area: string) => void
  onRemoveFocusArea: (area: string) => void
}

const SOURCE_ICONS: Record<string, string> = {
  arxiv: '📄',
  hackernews: '🟧',
  github: '🐙',
  reddit: '🔴',
  podcast: '🎙️',
  twitter: '🐦',
  blog: '📰',
}

export function ProfileForm({ profile, onUpdate, onToggleSource, onAddFocusArea, onRemoveFocusArea }: ProfileFormProps) {
  const [newFocus, setNewFocus] = useState('')

  const handleAddFocus = () => {
    const trimmed = newFocus.trim()
    if (trimmed) {
      onAddFocusArea(trimmed)
      setNewFocus('')
    }
  }

  return (
    <div className="space-y-5">
      {/* Field */}
      <FormSection label="Field" icon={Briefcase}>
        <input
          type="text"
          value={profile.field}
          onChange={(e) => onUpdate({ field: e.target.value })}
          className="form-input w-full"
        />
      </FormSection>

      {/* Sources */}
      <FormSection label="Sources" icon={Rss}>
        <div className="space-y-1">
          {profile.sources.map((source) => (
            <label
              key={source.id}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                source.enabled
                  ? 'bg-[var(--bg-ingrained)]'
                  : 'hover:bg-[var(--bg-card-hover)]'
              )}
            >
              <input
                type="checkbox"
                checked={source.enabled}
                onChange={() => onToggleSource(source.id)}
                className="accent-[var(--color-accent)]"
              />
              <span className="text-sm">
                {SOURCE_ICONS[source.type] || '📌'}{' '}
                {source.name || source.id}
              </span>
              <span className="text-xs text-[var(--color-text-subtle)] ml-auto">{source.type}</span>
            </label>
          ))}
        </div>
      </FormSection>

      {/* Level */}
      <FormSection label="Level" icon={GraduationCap}>
        <RadioGroup
          value={profile.level}
          options={[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
          ]}
          onChange={(v) => onUpdate({ level: v as Profile['level'] })}
        />
      </FormSection>

      {/* Depth */}
      <FormSection label="Depth" icon={Layers}>
        <RadioGroup
          value={profile.depth}
          options={[
            { value: 'beginner_friendly', label: 'Beginner friendly' },
            { value: 'executive', label: 'Executive summary' },
            { value: 'technical', label: 'Technical' },
          ]}
          onChange={(v) => onUpdate({ depth: v as Profile['depth'] })}
        />
      </FormSection>

      {/* Update Interval */}
      <FormSection label="Update Interval" icon={Clock}>
        <RadioGroup
          value={profile.interval}
          options={[
            { value: 'daily_6am', label: 'Every morning (6 AM)' },
            { value: 'twice_daily', label: 'Twice daily' },
            { value: 'realtime', label: 'Real-time' },
          ]}
          onChange={(v) => onUpdate({ interval: v as Profile['interval'] })}
        />
        <label className="flex items-center gap-2 mt-3 text-sm text-[var(--color-text-muted)]">
          <input
            type="checkbox"
            checked={profile.breaking_alerts}
            onChange={(e) => onUpdate({ breaking_alerts: e.target.checked })}
            className="accent-[var(--color-accent)]"
          />
          Breaking alerts for major releases
        </label>
      </FormSection>

      {/* Focus Areas */}
      <FormSection label="Focus Areas" icon={Target}>
        <div className="flex flex-wrap gap-2 mb-2">
          {profile.focus_areas.map((area) => (
            <Badge key={area} variant="paper" className="gap-1 pr-1">
              {area}
              <button
                onClick={() => onRemoveFocusArea(area)}
                className="ml-0.5 hover:text-[var(--color-text)] rounded-full"
              >
                <X size={10} />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newFocus}
            onChange={(e) => setNewFocus(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddFocus()}
            placeholder="Add focus area..."
            className="form-input flex-1"
          />
          <Button variant="ingrained" size="sm" onClick={handleAddFocus}>
            <Plus size={14} />
          </Button>
        </div>
      </FormSection>

      {/* Goal */}
      <FormSection label="Goal" icon={Flag}>
        <RadioGroup
          value={profile.goal}
          options={[
            { value: 'stay_current', label: 'Stay current for work' },
            { value: 'prepare_exams', label: 'Prepare for exams' },
            { value: 'teach_others', label: 'Teach others' },
          ]}
          onChange={(v) => onUpdate({ goal: v as Profile['goal'] })}
        />
      </FormSection>

      {/* Time Budget */}
      <FormSection label="Time Budget" icon={Timer}>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={profile.time_budget_min}
            onChange={(e) => onUpdate({ time_budget_min: Number(e.target.value) })}
            className="flex-1 accent-[var(--color-accent)]"
          />
          <span className="text-lg font-semibold text-[var(--color-text)] w-20 text-right tabular-nums">
            {profile.time_budget_min} <span className="text-xs font-normal text-[var(--color-text-muted)]">min/day</span>
          </span>
        </div>
      </FormSection>
    </div>
  )
}

function FormSection({ label, icon: Icon, children }: { label: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="border border-[var(--color-border)] rounded-xl p-4">
      <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5 block">
        <Icon size={12} className="text-[var(--color-text-subtle)]" />
        {label}
      </label>
      {children}
    </div>
  )
}

function RadioGroup({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm transition-colors border',
            value === opt.value
              ? 'bg-[var(--bg-ingrained)] border-[var(--color-border-strong)] text-[var(--color-text)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:bg-[var(--bg-card-hover)]'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
