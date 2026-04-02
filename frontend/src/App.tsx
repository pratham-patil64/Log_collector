import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import LogTable from "./components/LogTable";
import Dashboard from "./components/Dashboard";
import { LayoutDashboard, List, Menu, X } from "lucide-react";
import { cn } from "./lib/utils";
import { Button } from "./components/ui/button";

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/logs", label: "Log Explorer", icon: List },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "border-r bg-muted/20 flex flex-col transition-all duration-300 ease-in-out z-50",
          isSidebarOpen ? "w-64" : "w-0 md:w-20 overflow-hidden"
        )}
      >
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className={cn("text-xl font-extrabold tracking-tight truncate", !isSidebarOpen && "md:hidden")}>
            Log Viewer
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex"
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground",
                  !isSidebarOpen && "md:justify-center md:px-2"
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className={cn("transition-opacity", !isSidebarOpen && "md:hidden")}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b flex items-center px-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-4"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-bold">
            System Monitoring
          </h2>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          <div className="w-full p-6">  
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/logs" element={<LogTable />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}