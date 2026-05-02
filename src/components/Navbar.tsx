import { Ghost } from "lucide-react";
import { Link } from "react-router-dom";

export const Navbar = () => (
  <nav className="fixed top-0 inset-x-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
    <div className="container flex items-center justify-between h-16">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-elegant">
          <Ghost className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-black text-gradient">alshbh</span>
      </Link>
      <Link to="/admin" className="text-xs text-muted-foreground hover:text-primary transition-smooth">
        الإدارة
      </Link>
    </div>
  </nav>
);
