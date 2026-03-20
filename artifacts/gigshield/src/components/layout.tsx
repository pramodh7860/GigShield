import { Link, useLocation } from "wouter";
import { Shield, User, LogOut, LayoutDashboard, FileText, Settings, Activity } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isAuthPage = location === "/login" || location === "/register";
  if (isAuthPage) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto max-w-7xl px-4 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
          <div className="bg-primary p-1.5 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="font-display text-xl font-bold text-gradient">GigShield</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {!user && (
            <>
              <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</Link>
              <Link href="/faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link href={user.role === 'admin' ? "/admin/overview" : "/dashboard"} className="text-sm font-semibold hover:text-primary transition-colors">
                {user.role === 'admin' ? 'Admin Portal' : 'Dashboard'}
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} title="Log out">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold hover:text-primary transition-colors">Log in</Link>
              <Link href="/register">
                <Button size="sm" className="hidden sm:inline-flex">Get Covered</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  const links = user.role === 'admin' ? [
    { href: "/admin/overview", label: "Overview", icon: Activity },
    { href: "/admin/workers", label: "Workers", icon: User },
    { href: "/admin/claims", label: "Claims", icon: FileText },
    { href: "/admin/triggers", label: "Triggers", icon: Shield },
  ] : [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/claims", label: "My Claims", icon: FileText },
    { href: "/plans", label: "Coverage Plans", icon: Shield },
    { href: "/profile", label: "Profile", icon: Settings },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex flex-col gap-2 p-4">
          {links.map((link) => {
            const isActive = location === link.href || location.startsWith(`${link.href}/`);
            return (
              <Link key={link.href} href={link.href}>
                <div className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all cursor-pointer",
                  isActive 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </div>
              </Link>
            );
          })}
        </div>
      </aside>
      <main className="flex-1 bg-background/50 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
