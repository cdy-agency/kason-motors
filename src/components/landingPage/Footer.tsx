import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Globe } from "lucide-react";
import {
  FaInstagram,
  FaFacebookF,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Inventory", href: "/inventory" },
  { label: "Blog & News", href: "/blog" },
  { label: "About Us", href: "/about-us" },
  { label: "Contact", href: "/contact" },
];

const carTypes = [
  { label: "SUV", href: "#" },
  { label: "Sedan", href: "#" },
  { label: "Pickup", href: "#" },
  { label: "Crossover", href: "#" },
  { label: "Electric", href: "#" },
];

const socials = [
  { icon: FaInstagram, href: "#", label: "Instagram" },
  { icon: FaFacebookF, href: "#", label: "Facebook" },
  { icon: FaXTwitter, href: "#", label: "Twitter" },
  { icon: FaYoutube, href: "#", label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-dark">
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Brand col */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image
                src="/logo.jpeg"
                alt="Kason Motors"
                width={38}
                height={38}
                className="rounded-xl object-cover"
                style={{ width: 38, height: 38 }}
              />
              <span className="font-bold text-white text-base tracking-tight">
                KASON <span className="text-primary">MOTORS</span>
              </span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Rwanda&apos;s most trusted car dealership. Quality vehicles,
              transparent pricing, and a team that puts you first.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-2">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all duration-150"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-xs tracking-widest uppercase mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/40 text-sm hover:text-primary transition-colors duration-150 flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-primary transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-xs tracking-widest uppercase mb-5">
              Contact Us
            </h4>
            <ul className="space-y-3.5">
              <li>
                <div
                  className="flex items-start gap-3 text-white/40 text-sm hover:text-white transition-colors group"
                >
                  <span className="mt-0.5 w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Phone size={12} className="text-primary" />
                  </span>
                  +250 799 525 895 / +250 793 154 837
                </div>
              </li>

              <li>
                <a
                  href="mailto:daniel@kasonev.com"
                  className="flex items-start gap-3 text-white/40 text-sm hover:text-white transition-colors group"
                >
                  <span className="mt-0.5 w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Mail size={12} className="text-primary" />
                  </span>
                  daniel@kasonev.com
                </a>
              </li>

              {/* Website (NEW) */}
              <li>
                <a
                  href="https://kasonev.en.alibaba.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-white/40 text-sm hover:text-white transition-colors group"
                >
                  <span className="mt-0.5 w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Globe size={12} className="text-primary" />
                  </span>
                  www.kasonev.com
                </a>
              </li>

              <li>
                <Link
                  href="https://maps.google.com/maps/place//data=!4m2!3m1!1s0x19dca7d0eecde367:0x8fd44212ce17858?entry=s&sa=X&ved=2ahUKEwiH4JnKjKOUAxVtU6QEHXKWCbEQ4kB6BAgSEAA&hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-white/40 text-sm hover:text-white transition-colors group"
                >
                  <span className="mt-0.5 w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <MapPin size={12} className="text-primary" />
                  </span>
                  Kigali, KG 1511 St, CHINA EV MALL Special Economic Zone
                </Link>
              </li>

              <li>
                <div className="flex items-start gap-3 text-white/40 text-sm">
                  <span className="mt-0.5 w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Clock size={12} className="text-primary" />
                  </span>
                  Monday - Sunday
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/25 text-xs">
            © 2026 Kason Motors. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {["Privacy Policy", "Terms of Service"].map((item) => (
              <Link
                key={item}
                href="#"
                className="text-white/25 text-xs hover:text-white/60 transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}