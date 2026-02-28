import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PulsePage } from '@/pages/PulsePage'
import { LearningPage } from '@/pages/LearningPage'
import { TemplatePage } from '@/pages/TemplatePage'
import { KBPage } from '@/pages/KBPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/pulse" replace />} />
          <Route path="pulse" element={<PulsePage />} />
          <Route path="learn/:slug" element={<LearningPage />} />
          <Route path="template" element={<TemplatePage />} />
          <Route path="kb" element={<KBPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
