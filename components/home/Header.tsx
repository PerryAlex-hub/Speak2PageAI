"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NavLink = ({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="transition-colors duration-200 text-gray-600 hover:text-purple-500"
    >
      {children}
    </Link>
  );
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="container mx-auto px-4 sm:px-15 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0">
          <NavLink href="/" onClick={closeMenu}>
            <span className="flex items-center gap-2">
              <Image
                src="/icon.ico"
                alt="SpeakEasy logo"
                width={32}
                height={32}
                className="hover:rotate-12 transform transition duration-200 ease-in-out"
              />
              <span className="font-extrabold text-lg">SpeakEasy</span>
            </span>
          </NavLink>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="/#pricing">Pricing</NavLink>
          <SignedIn>
            <NavLink href="/posts">Your Posts</NavLink>
          </SignedIn>
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center">
          <SignedIn>
            <div className="flex gap-4 items-center">
              <NavLink href="/dashboard">Upload a Video</NavLink>
              <UserButton />
            </div>
          </SignedIn>

          <SignedOut>
            <SignInButton>
              <NavLink href="/sign-in">Sign In</NavLink>
            </SignInButton>
          </SignedOut>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-lg text-white hover:text-purple-500 transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
          <div className="flex flex-col gap-4 pt-4">
            <NavLink href="/#pricing" onClick={closeMenu}>
              Pricing
            </NavLink>
            <SignedIn>
              <NavLink href="/posts" onClick={closeMenu}>
                Your Posts
              </NavLink>
              <NavLink href="/dashboard" onClick={closeMenu}>
                Upload a Video
              </NavLink>
              <div className="pt-2">
                <UserButton />
              </div>
            </SignedIn>

            <SignedOut>
              <SignInButton>
                <NavLink href="/sign-in" onClick={closeMenu}>
                  Sign In
                </NavLink>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      )}
    </nav>
  );
}