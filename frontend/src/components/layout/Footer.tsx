import logoSvg from "@/assets/logo.svg"
import dumplingsSvg from "@/assets/dumplings.svg"

export function Footer() {
  return (
    <footer className="bg-accent text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <img src={logoSvg} alt="Frontexh AI" className="h-7 brightness-0 invert" />
        <div className="flex items-center gap-2 text-sm text-white/70">
          Made by Dumplings
          <img src={dumplingsSvg} alt="Dumplings" className="h-10 w-10" />
        </div>
        <button className="text-sm text-white/70 hover:text-white cursor-pointer">
          Contact Us
        </button>
      </div>
    </footer>
  )
}
