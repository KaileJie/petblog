"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-gradient-to-b from-background to-background/95 backdrop-blur-md support-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo/Brand */}
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <span className="text-xl font-bold text-primary">🐾</span>
          </div>
          <span className="text-base sm:text-lg font-semibold text-foreground">PawStories</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#stories"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground font-bold"
          >
            Stories
          </Link>
          <Link
            href="#community"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground font-bold"
          >
            Community
          </Link>
          <Link
            href="#about"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground font-bold"
          >
            About
          </Link>
          <Link
            href="#contact"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground font-bold"
          >
            Contact
          </Link>
        </div>

        {/* CTA Button - Desktop */}
        <div className="hidden md:block">
          <Link href="/auth/login">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Sign In</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2.5 rounded-lg hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-md animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-3 px-4 py-4">
            <Link 
              href="#stories" 
              className="text-base font-medium text-muted-foreground hover:text-foreground py-2 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Stories
            </Link>
            <Link 
              href="#community" 
              className="text-base font-medium text-muted-foreground hover:text-foreground py-2 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Community
            </Link>
            <Link 
              href="#about" 
              className="text-base font-medium text-muted-foreground hover:text-foreground py-2 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <Link 
              href="#contact" 
              className="text-base font-medium text-muted-foreground hover:text-foreground py-2 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <div className="pt-2">
              <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
