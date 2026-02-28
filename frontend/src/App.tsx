import { BrowserRouter, Routes, Route } from "react-router-dom"
import { CopilotKit } from "@copilotkit/react-core"
import "@copilotkit/react-ui/styles.css"
import { Shell } from "@/components/layout/Shell"
import { EssentialPage } from "@/pages/EssentialPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { CatchupPage } from "@/pages/CatchupPage"
import { EdgePage } from "@/pages/EdgePage"

function App() {
  return (
    <CopilotKit runtimeUrl="/copilotkit">
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<EssentialPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/catchup/:slug" element={<CatchupPage />} />
            <Route path="/catchup" element={<CatchupPage />} />
            <Route path="/edge" element={<EdgePage />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </CopilotKit>
  )
}

export default App
