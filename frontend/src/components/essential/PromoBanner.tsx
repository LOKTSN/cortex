import { Link } from "react-router-dom"

export function PromoBanner() {
  return (
    <div className="mb-6 flex items-center justify-between rounded-xl bg-bg-muted px-6 py-4">
      <div>
        <p className="font-semibold text-text">
          Unlock Your Free Builder Credit for Hack the East
        </p>
        <p className="text-sm text-text-muted">
          Sign up to claim your credits and start building.
        </p>
      </div>
      <Link
        to="/?signup=true"
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
      >
        Signup
      </Link>
    </div>
  )
}
