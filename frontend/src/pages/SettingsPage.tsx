import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CurationSettings } from "@/components/settings/CurationSettings"
import { MySubscriptions } from "@/components/settings/MySubscriptions"
import { InviteUser } from "@/components/settings/InviteUser"

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <h1 className="mb-6 text-3xl font-bold">Setting</h1>

      <Tabs defaultValue="curation">
        <TabsList>
          <TabsTrigger value="curation">Curation Setting</TabsTrigger>
          <TabsTrigger value="subscriptions">My Subscriptions</TabsTrigger>
          <TabsTrigger value="invite">Invite user</TabsTrigger>
        </TabsList>

        <TabsContent value="curation">
          <CurationSettings />
        </TabsContent>
        <TabsContent value="subscriptions">
          <MySubscriptions />
        </TabsContent>
        <TabsContent value="invite">
          <InviteUser />
        </TabsContent>
      </Tabs>
    </div>
  )
}
