"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MapPin,
  Phone,
  Clock,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  User,
  LogOut,
  Info,
  Wrench,
  Mail,
  ClipboardList,
  Newspaper,
} from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Inventory", href: "/inventory" },
];

const discoverLinks = [
  { label: "About Us", href: "/about-us", icon: <Info size={15} /> },
  { label: "Blog & News", href: "/blog", icon: <Newspaper size={15} /> },
  { label: "Our Services", href: "/services", icon: <Wrench size={15} /> },
  { label: "Contact Us", href: "/contact", icon: <Mail size={15} /> },
  { label: "Maintenance ", href: "/mentenance", icon: <ClipboardList size={15} /> },
];

type NavbarProps = {
  user?: { fullName: string; email: string; role: string } | null;
};

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [mobileDiscoverOpen, setMobileDiscoverOpen] = useState(false);
  const discoverRef = useRef<HTMLDivElement>(null);

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isDiscoverActive = discoverLinks.some((l) => isLinkActive(l.href));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Close discover dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (discoverRef.current && !discoverRef.current.contains(e.target as Node)) {
        setDiscoverOpen(false);
      }
    };
    if (discoverOpen) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [discoverOpen]);

  useEffect(() => {
    const handler = () => setUserMenuOpen(false);
    if (userMenuOpen) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [userMenuOpen]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const initials = user?.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* ── Top Bar ── */}
      <div
        className={`w-full z-50 transition-all duration-300 bg-gray-dark/80 ${
          scrolled ? "hidden" : "block"
        }`}
      >
        <div className="max-w-7xl mx-auto py-2 flex items-center gap-3 sm:gap-5 text-xs text-font/60">
          <span className="flex items-center gap-1.5">
            <MapPin size={12} />
            <span className="hidden sm:inline">KG 1511 St</span>
            <span className="sm:hidden">CHINA EV MALL Special Economic Zone</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Phone size={12} /> +250 799 525 895 / +250 793 154 837
          </span>
          <span className="hidden md:flex items-center gap-1.5">
            <Clock size={12} /> Monday - Sunday
          </span>
        </div>
      </div>

      {/* ── Main Navbar ── */}
      <nav
        className={`w-full z-50 transition-all duration-500 ${
          scrolled
            ? "fixed top-0 left-0 right-0 border-b border-line/15 bg-gray-dark/95 shadow-lg backdrop-blur-md"
            : "relative bg-gray-dark"
        }`}
      >
        <div className="max-w-7xl mx-auto py-3 sm:py-4 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo.jpeg"
              alt="Kason Motors"
              width={44}
              height={44}
              className="w-auto h-9 sm:h-11 object-contain rounded-full"
            />
            <span className="text-base sm:text-xl font-bold tracking-tight text-font">
              KASON <span className="text-primary">MOTORS</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-semibold rounded transition-all duration-200 ${
                    isActive ? "text-primary" : "text-font hover:text-font/75"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </Link>
              );
            })}

            {/* Discover Dropdown */}
            <div className="relative" ref={discoverRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDiscoverOpen((v) => !v);
                }}
                className={`relative flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded transition-all duration-200 ${
                  isDiscoverActive ? "text-primary" : "text-font hover:text-font/75"
                }`}
              >
                Discover
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${discoverOpen ? "rotate-180" : ""}`}
                />
                {isDiscoverActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full"
                  />
                )}
              </button>

              <AnimatePresence>
                {discoverOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-52 bg-gray-dark border border-line/25 rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    {discoverLinks.map((link) => {
                      const isActive = isLinkActive(link.href);
                      return (
                        <Link
                          key={link.label}
                          href={link.href}
                          onClick={() => setDiscoverOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors ${
                            isActive
                              ? "text-primary bg-primary/10"
                              : "text-font hover:bg-white/10 hover:text-primary"
                          }`}
                        >
                          <span className="text-primary">{link.icon}</span>
                          {link.label}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right — Auth */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen((v) => !v);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 text-sm font-semibold text-font transition-all duration-200 hover:bg-white/10"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-font">
                    {initials}
                  </span>
                  {user.fullName.split(" ")[0]}
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-line overflow-hidden z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-4 py-3 border-b border-line bg-subtle">
                        <p className="text-xs font-bold text-gray-dark truncate">{user.fullName}</p>
                        <p className="text-[11px] text-gray-mid truncate mt-0.5">{user.email}</p>
                      </div>
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-dark hover:bg-subtle hover:text-primary transition-colors"
                        >
                          <User size={14} className="text-gray-mid" /> Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-dark hover:bg-red-50 hover:text-red-500 transition-colors w-full"
                      >
                        <LogOut size={14} className="text-gray-mid" />
                        {isLoggingOut ? "Signing out..." : "Log Out"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-5 py-2 text-sm font-semibold text-font transition-all duration-300 hover:bg-white/25"
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded text-font transition-colors hover:bg-white/10 md:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Sidebar ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-60 bg-ink/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 z-70 flex h-full w-72 max-w-[calc(100vw-0.75rem)] flex-col border-r border-line/20 bg-gray-dark shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-line/25 px-5 py-4">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                  <Image
                    src="/logo.jpeg"
                    alt="Kason Motors"
                    width={36}
                    height={36}
                    className="h-9 w-auto object-contain rounded-full"
                  />
                  <span className="text-base font-bold text-font">
                    KASON <span className="text-primary">MOTORS</span>
                  </span>
                </Link>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg p-1.5 text-font transition-colors hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
                <p className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-font/60">
                  Menu
                </p>

                {/* Regular links */}
                {navLinks.map((link, i) => {
                  const isActive = isLinkActive(link.href);
                  return (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-primary text-font shadow-md"
                            : "text-font hover:bg-white/10 hover:text-primary"
                        }`}
                      >
                        <span>{link.label}</span>
                        <ChevronRight size={16} className={isActive ? "text-font/70" : "text-font/50"} />
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Mobile Discover section */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.07 }}
                >
                  <button
                    onClick={() => setMobileDiscoverOpen((v) => !v)}
                    className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      isDiscoverActive
                        ? "bg-primary text-font shadow-md"
                        : "text-font hover:bg-white/10 hover:text-primary"
                    }`}
                  >
                    <span>Discover</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${mobileDiscoverOpen ? "rotate-180" : ""} ${isDiscoverActive ? "text-font/70" : "text-font/50"}`}
                    />
                  </button>

                  <AnimatePresence>
                    {mobileDiscoverOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-primary/30 pl-3">
                          {discoverLinks.map((link) => {
                            const isActive = isLinkActive(link.href);
                            return (
                              <Link
                                key={link.label}
                                href={link.href}
                                onClick={() => setMenuOpen(false)}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                                  isActive
                                    ? "text-primary"
                                    : "text-font/80 hover:text-primary hover:bg-white/10"
                                }`}
                              >
                                <span className="text-primary">{link.icon}</span>
                                {link.label}
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (navLinks.length + 1) * 0.07 }}
                  className="mt-4 px-1"
                >
                  {user ? (
                    <div className="overflow-hidden rounded-xl border border-line/25 bg-bg">
                      <div className="flex items-center gap-2.5 px-4 py-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-xs font-bold text-primary">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-font">{user.fullName}</p>
                          <p className="text-[10px] capitalize text-font/60">{user.role}</p>
                        </div>
                      </div>
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 border-t border-line/25 px-4 py-2.5 text-sm text-font transition-colors hover:bg-white/10 hover:text-primary"
                        >
                          <User size={14} className="text-font/60" /> Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => { setMenuOpen(false); handleLogout(); }}
                        className="flex w-full items-center gap-2.5 border-t border-line/25 px-4 py-2.5 text-sm text-font transition-colors hover:bg-white/10 hover:text-accent"
                      >
                        <LogOut size={14} className="text-font/60" /> Log Out
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-font shadow-md transition-all hover:bg-primary-dark"
                    >
                      Log In to Your Account
                    </Link>
                  )}
                </motion.div>
              </nav>

              {/* Footer */}
              <div className="border-t border-line/25 bg-bg px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-font/60">
                  Contact
                </p>
                <div className="flex flex-col gap-2.5 text-xs text-font/75">
                  <span className="flex items-center gap-2">
                    <MapPin size={13} className="text-primary" /> KG 11 Ave, Kigali, Rwanda
                  </span>
                  <span className="flex items-center gap-2">
                    <Phone size={13} className="text-primary" /> +250 791 000 000
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock size={13} className="text-primary" /> Mon–Fri: 8:00–17:00
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}