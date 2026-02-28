import { Link, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import logoSvg from "@/assets/logo.svg"
import essentialIcon from "@/assets/boxicons_Essential.svg"
import catchupIcon from "@/assets/eos-icons_catchup.svg"
import edgeIcon from "@/assets/your_edge.svg"

const navItems = [
  { to: "/", label: "Essential", icon: essentialIcon },
  { to: "/catchup", label: "Studio", icon: catchupIcon },
  { to: "/edge", label: "Your Edge", icon: edgeIcon },
]

export function Nav() {
  const location = useLocation()
  const { isOnboarded, userName } = useAuthStore()

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between border-b bg-white px-6 py-3">
      <Link to="/" className="flex items-center gap-2">
        <img src={logoSvg} alt="Frontexh AI" className="h-4" />
      </Link>

      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-bg-muted text-text"
                  : "text-text-muted hover:bg-bg-muted hover:text-text"
              }`}
            >
              <img src={item.icon} alt="" className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </div>

      <div>
        {isOnboarded ? (
          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:bg-bg-muted"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs text-white">
              {userName.charAt(0)}
            </div>
            {userName}
          </Link>
        ) : (
          <Link
            to="/?signup=true"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Signup
          </Link>
        )}
      </div>
    </nav>
  )
}
