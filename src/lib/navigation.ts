export const PRIMARY_NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Inventory", href: "/inventory" },
] as const;

export const DISCOVER_NAV_LINKS = [
  { label: "About Us", href: "/about-us" },
  { label: "Blog & News", href: "/blog" },
  { label: "Our Services", href: "/services" },
  { label: "Contact Us", href: "/contact" },
  { label: "Maintenance", href: "/mentenance" },
] as const;

export const SITE_NAV_LINKS = [
  ...PRIMARY_NAV_LINKS,
  ...DISCOVER_NAV_LINKS,
];
