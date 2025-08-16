import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut } from "lucide-react";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
  }`;

const SiteHeader = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="remembranceGraX Home">
          <div className="h-6 w-6 rounded-md" style={{ backgroundImage: "var(--gradient-primary)" }} />
          <span className="text-base font-semibold">remembranceGraX</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <NavLink to="/gallery" className={navLinkClass}>
                แกลเลอรี
              </NavLink>
              <NavLink to="/upload" className={navLinkClass}>
                อัปโหลด
              </NavLink>
              <NavLink to="/dashboard" className={navLinkClass}>
                แดชบอร์ด
              </NavLink>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      โปรไฟล์
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    ออกจากระบบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button asChild variant="outline">
                <Link to="/auth">เข้าสู่ระบบ</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default SiteHeader;
