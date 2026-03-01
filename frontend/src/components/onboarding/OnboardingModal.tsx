import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Send } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { onboardingFields } from "@/lib/mock-data"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface OnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const navigate = useNavigate()
  const setOnboarded = useAuthStore((s) => s.setOnboarded)

  function handleSignup() {
    const field = onboardingFields.find((f) => f.id === selected)
    setOnboarded("Daniel", field?.label ?? "AI / ML")
    onOpenChange(false)
    navigate("/template")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">
            Stay Ahead in Your Field
          </DialogTitle>
          <DialogDescription className="text-base">
            Pick a field to get started — you'll customize it next.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {onboardingFields.map((field) => (
            <button
              key={field.id}
              onClick={() => setSelected(field.id)}
              className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                selected === field.id
                  ? "border-success bg-green-50"
                  : "border-border hover:border-border-strong"
              }`}
            >
              <span className="mb-1 text-2xl">{field.emoji}</span>
              <span className="text-sm font-semibold text-text">{field.label}</span>
              <span className="mt-1 text-xs text-text-muted">{field.detail}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={handleSignup}
            disabled={!selected}
            className="gap-2 px-8"
          >
            <Send className="h-4 w-4" />
            Sign up with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
