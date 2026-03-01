import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Shell } from "@/components/layout/Shell"
import { EssentialPage } from "@/pages/EssentialPage"
import { CatchupPage } from "@/pages/CatchupPage"
import { EdgePage } from "@/pages/EdgePage"
import { LearningPage } from "@/pages/LearningPage"
import { TemplatePage } from "@/pages/TemplatePage"

function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<EssentialPage />} />
          <Route path="/catchup/:slug" element={<CatchupPage />} />
          <Route path="/catchup" element={<CatchupPage />} />
          <Route path="/edge" element={<EdgePage />} />
          <Route path="/learn/:slug" element={<LearningPage />} />
          <Route path="/template" element={<TemplatePage />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}

export default App
