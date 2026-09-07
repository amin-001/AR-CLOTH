/**
 * DashboardLayout Component
 *
 * This component provides the main layout structure for the dashboard pages.
 * It includes a collapsible sidebar with navigation links, a header with user actions,
 * and a main content area that renders child routes via Outlet.
 *
 * Features:
 * - Collapsible sidebar for better space management on smaller screens
 * - Navigation links to different dashboard sections
 * - User dropdown menu with profile info and logout functionality
 * - Responsive design that adapts to different screen sizes
 */

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import useTokenStore from "@/store"
import {
  CircleUser,
  Home,
  Menu,
  ShieldCheck,
  Loader2,
} from "lucide-react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import logo from "../assets/blackLogo.svg"
import { useState } from "react"

const DashboardLayout = () => {
  // Hooks for navigation and state management
  const navigate = useNavigate()
  const { toast } = useToast()

  // Get user data and token setter from global store
  const user = useTokenStore((state) => state.user)
  const { setToken } = useTokenStore()

  // State for sidebar collapse functionality
  const [collapsed, setCollapsed] = useState(false)

  // Logout function - clears token and redirects to login
  const logout = () => {
    setToken("")
    navigate("/auth/login")
    toast({
      title: "Logout successful",
    })
  }

  return (
    // Main grid layout container - responsive with collapsible sidebar
    <div
      className={`grid min-h-screen w-full bg-slate-950 text-slate-100 ${
        collapsed
          ? "md:grid-cols-[72px_1fr]" // Collapsed: narrow sidebar
          : "md:grid-cols-[240px_1fr]" // Expanded: full sidebar width
      }`}
    >
      {/* Sidebar - Hidden on mobile, visible on medium+ screens */}
      <aside className="hidden md:block border-r border-slate-800 bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-900/80">
        <div className="flex h-full flex-col">
          {/* Logo section with conditional sizing based on collapse state */}
          <div className="flex h-14 items-center border-b border-slate-800 px-4">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={logo}
                alt="Logo"
                className={collapsed ? "h-8 w-8" : "h-10 w-10"}
              />
            </Link>
          </div>

          {/* Navigation menu with active state styling */}
          <nav className="flex-1 px-2 py-4 text-sm font-medium space-y-1">
            {/* Home/Dashboard link */}
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors
                 text-slate-300 hover:bg-slate-800 hover:text-white
                 ${isActive ? "bg-slate-800 text-white" : ""}`
              }
            >
              <Home className="h-4 w-4" />
              {!collapsed && "Home"}
            </NavLink>

            {/* Fashion News link */}
            <NavLink
              to="/fashion-news"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors
                 text-slate-300 hover:bg-slate-800 hover:text-white
                 ${isActive ? "bg-slate-800 text-white" : ""}`
              }
            >
              <ShieldCheck className="h-4 w-4" />
              {!collapsed && "Fashion News"}
            </NavLink>

            <NavLink
              to="/image-ai-search"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors
                 text-slate-300 hover:bg-slate-800 hover:text-white
                 ${isActive ? "bg-slate-800 text-white" : ""}`
              }
            >
              <ShieldCheck className="h-4 w-4" />
              {!collapsed && "Image + AI Search"}
            </NavLink>

               

          </nav>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-col">
        {/* Top header bar with controls and user menu */}
        <header className="flex h-14 items-center gap-4 border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-900/90">
          {/* Sidebar toggle button - only visible on medium+ screens */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={() => setCollapsed((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Right side controls */}
          <div className="ml-auto flex items-center gap-3">

            <Button
              // onClick={() => navigate("http://localhost:3000/")}
              onClick={() =>   navigate(`avatar-canvas`)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Try On 3d Avatar
            </Button>

            {/* Button to navigate to avatar creation */}
            

            {/* User dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <CircleUser className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl border bg-popover text-popover-foreground shadow-lg"
              >
                {/* User profile section */}
                <div className="flex flex-col items-center gap-1 py-3 border-b border-border mb-2">
                  <CircleUser className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-semibold">
                    {user?.email}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted rounded px-2 py-0.5">
                    {user?.role?.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Menu items */}
                <DropdownMenuItem asChild>
                  <Link
                    to="/change-password"
                    className="flex items-center gap-2"
                  >
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    Change Password
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Logout button with destructive styling */}
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:bg-destructive/10"
                >
                  <Loader2 className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main content area where child routes are rendered */}
        <main className="flex-1 p-4 lg:p-6 overflow-hidden bg-slate-950">
          <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-4 shadow-[0_25px_45px_-20px_rgba(15,23,42,0.85)] backdrop-blur-xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
