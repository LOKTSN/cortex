import { CopilotKit } from '@copilotkit/react-core'

// Pages — to be implemented
// import { PulsePage } from '@/pages/PulsePage'
// import { LearningPage } from '@/pages/LearningPage'
// import { TemplatePage } from '@/pages/TemplatePage'
// import { KnowledgePage } from '@/pages/KnowledgePage'

export default function App() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <div className="min-h-dvh bg-[var(--bg-base)]">
        {/* Navigation + routing to be added */}
        <main className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">
            Cortex
          </h1>
          <p className="text-[var(--color-text-muted)] mt-2">
            AI Learning Companion — scaffold ready
          </p>
        </main>
      </div>
    </CopilotKit>
  )
}
