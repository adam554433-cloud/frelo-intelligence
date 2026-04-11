export const nav = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { id: "chat", label: "Ask Anything", href: "/chat", icon: "MessageSquare" },
  { id: "brief", label: "Strategic Brief", href: "/brief", icon: "Briefcase" },
  { id: "avatars", label: "Avatars", href: "/avatars", icon: "Users" },
  { id: "hypotheses", label: "Hypotheses", href: "/hypotheses", icon: "FlaskConical" },
  { id: "simulate", label: "Simulate", href: "/simulate", icon: "Theater" },
  { id: "alerts", label: "Alerts", href: "/alerts", icon: "Bell" },
  { id: "items", label: "Evidence", href: "/items", icon: "Database" },
  { id: "competitors", label: "Competitors", href: "/competitors", icon: "Swords" },
  { id: "settings", label: "Settings", href: "/settings", icon: "Settings" },
] as const;

export type NavItem = (typeof nav)[number];
