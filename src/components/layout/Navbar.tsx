import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Book, User, Menu, X, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";

// Define interfaces for component props
interface NavLinkProps {
  path: string;
  name: string;
  className?: string;
  onClick?: () => void;
}

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoize nav links
  const navLinks = useMemo(() => [
    { name: "Home", path: "/" },
    { name: "Courses", path: "/courses" },
    { name: "About", path: "/about" },
  ], []);

  // Memoize functions to prevent recreating on each render
  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  // Improved and more robust handleLogout function
  const handleLogout = useCallback(async () => {
    try {
      console.log("Logout initiated");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error logging out:", error);
        toast.error("Error logging out: " + error.message);
        return;
      }
      
      // Clear any local state related to user
      setUser(null);
      setUserRole(null);
      
      // Force a page reload to ensure all state is cleared
      toast.success("Logged out successfully");
      
      // Navigate and then reload for a fresh state
      navigate("/");
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Error logging out. Please try again.");
    }
  }, [navigate]);

  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const navigateToLogin = useCallback(() => {
    navigate("/login");
    setIsMenuOpen(false);
  }, [navigate]);

  const navigateToRegister = useCallback(() => {
    navigate("/register");
    setIsMenuOpen(false);
  }, [navigate]);

  const logoutAndCloseMenu = useCallback(() => {
    handleLogout();
    // Close menu immediately for better UX
    setIsMenuOpen(false);
  }, [handleLogout]);

  useEffect(() => {
    const getUserAndRole = async () => {
      try {
        // Get current session - this is lightweight and quick
        const { data } = await supabase.auth.getSession();
        const currentUser = data.session?.user || null;
        
        if (!currentUser) {
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }

        setUser(currentUser);
        
        // Optimize database query - only select what we need
        const { data: profile, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single();
          
        if (!error && profile) {
          setUserRole(profile.role);
        } else {
          setUserRole(null);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    getUserAndRole();

    // Auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      // Only trigger updates on meaningful events
      if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED', 'TOKEN_REFRESHED'].includes(event)) {
        const currentUser = session?.user || null;
        setUser(currentUser);
        
        if (currentUser) {
          // Optimize database query - only select what we need
          const { data: profile, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', currentUser.id)
            .single();
            
          if (!error && profile) {
            setUserRole(profile.role);
          } else {
            setUserRole(null);
          }
        } else {
          setUserRole(null);
        }
      }
    });

    // Add a global event listener for any logout links
    const handleGlobalLogout = (e) => {
      // Check if the clicked element is a logout link
      const target = e.target;
      
      if (
        (target.tagName === 'A' || target.tagName === 'BUTTON' || target.tagName === 'SPAN') && 
        target.textContent.trim() === 'Log out'
      ) {
        console.log('Global logout handler triggered');
        e.preventDefault();
        handleLogout();
      }
    };

    document.addEventListener('click', handleGlobalLogout);

    return () => {
      authListener.subscription.unsubscribe();
      document.removeEventListener('click', handleGlobalLogout);
    };
  }, [handleLogout]);

  // Memoize NavLink component to avoid recreating it on each render
  const NavLink = useMemo(() => React.memo(({ path, name, className, onClick }: NavLinkProps) => (
    <Link
      to={path}
      onClick={onClick}
      className={className || `text-sm font-medium transition-colors ${
        isActive(path)
          ? "text-brand-purple"
          : "text-foreground/70 hover:text-foreground"
      }`}
    >
      {name}
    </Link>
  )), [isActive]);

  // Memoize desktop and mobile menu elements to reduce rerendering
  const desktopLinks = useMemo(() => (
    <div className="flex gap-6">
      {navLinks.map((link) => (
        <NavLink 
          key={link.path}
          path={link.path}
          name={link.name}
        />
      ))}
      {user && (
        <>
          <NavLink
            path="/dashboard"
            name="Dashboard"
          />
          <NavLink
            path="/account-settings"
            name="Account"
          />
        </>
      )}
    </div>
  ), [navLinks, user, NavLink]);

  const mobileLinks = useMemo(() => (
    <div className="flex flex-col gap-4">
      {navLinks.map((link) => (
        <NavLink
          key={link.path}
          path={link.path}
          name={link.name}
          onClick={() => setIsMenuOpen(false)}
          className={`text-sm font-medium p-2 transition-colors ${
            isActive(link.path)
              ? "text-brand-purple bg-secondary rounded-md"
              : "text-foreground/70 hover:text-foreground"
          }`}
        />
      ))}
      {user && (
        <>
          <NavLink
            path="/dashboard"
            name="Dashboard"
            onClick={() => setIsMenuOpen(false)}
            className={`text-sm font-medium p-2 transition-colors ${
              isActive("/dashboard")
                ? "text-brand-purple bg-secondary rounded-md"
                : "text-foreground/70 hover:text-foreground"
            }`}
          />
          <NavLink
            path="/account-settings"
            name="Account"
            onClick={() => setIsMenuOpen(false)}
            className={`text-sm font-medium p-2 transition-colors ${
              isActive("/account-settings")
                ? "text-brand-purple bg-secondary rounded-md"
                : "text-foreground/70 hover:text-foreground"
            }`}
          />
        </>
      )}
    </div>
  ), [navLinks, user, isActive, NavLink]);

  return (
    <nav className="py-4 px-6 lg:px-8 border-b border-border bg-background/95 backdrop-blur-sm fixed w-full z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Book className="h-6 w-6 text-brand-purple" />
          <span className="font-bold text-xl text-foreground">
            Smart<span className="text-brand-purple">Learn</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {desktopLinks}

          {user ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleLogout} aria-label="Log out">
                <LogOut className="mr-2 h-4 w-4" />
                <span className="hidden md:inline">Log out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigateToLogin}>
                <User className="mr-2 h-4 w-4" />
                <span className="hidden md:inline">Log in</span>
              </Button>
              <Button size="sm" onClick={navigateToRegister}>
                Register
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground p-2 focus:outline-none"
          onClick={handleMenuToggle}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        
        {/* This handles the "Log out" text in the top-right corner of the navbar 
            which appears to be separate from the Button components */}
        {user && (
          <div className="absolute right-6 top-4 md:hidden">
            <button
              onClick={handleLogout}
              className="text-sm text-foreground/70 hover:text-foreground cursor-pointer"
            >
              Log out
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border animate-fade-in p-4">
          {mobileLinks}
          <div className="mt-4 pt-4 border-t border-border">
            {user ? (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={logoutAndCloseMenu}
                aria-label="Log out"
              >
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={navigateToLogin}
                >
                  <User className="mr-2 h-4 w-4" /> Log in
                </Button>
                <Button
                  onClick={navigateToRegister}
                  className="w-full"
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standalone header links (appears to be rendered separately) */}
      {user && (
        <div className="fixed top-4 right-4 z-50 md:hidden flex items-center gap-4">
          <Link to="/dashboard" className="text-sm font-medium text-foreground/70 hover:text-foreground">
            Dashboard
          </Link>
          <Link to="/account" className="text-sm font-medium text-foreground/70 hover:text-foreground">
            Account
          </Link>
          <button 
            onClick={handleLogout}
            className="text-sm font-medium text-foreground/70 hover:text-foreground cursor-pointer"
            aria-label="Log out"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
};

// Wrap in memo to prevent unnecessary re-renders
export default React.memo(Navbar);
