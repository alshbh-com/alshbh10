import { useEffect, useState } from "react";
import { useNavigate, NavLink, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Ghost, LayoutDashboard, Users, Settings, LogOut, Loader2, BarChart3, Wallet } from "lucide-react";
import { toast } from "sonner";

const AdminLayout = () => {
  const nav = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) nav("/admin", { replace: true });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) nav("/admin", { replace: true });
      else setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    nav("/admin");
  };

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary w-8 h-8" />
    </div>
  );

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth ${
      isActive ? "bg-gradient-primary text-primary-foreground shadow-elegant" : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 lg:min-h-screen border-b lg:border-b-0 lg:border-l border-border bg-card/50 backdrop-blur-sm">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Ghost className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-black text-gradient">alshbh</div>
              <div className="text-xs text-muted-foreground">لوحة التحكم</div>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            <NavLink to="/admin/dashboard" end className={linkClass}>
              <LayoutDashboard className="w-5 h-5" />
              <span>الإحصائيات</span>
            </NavLink>
            <NavLink to="/admin/dashboard/leads" className={linkClass}>
              <Users className="w-5 h-5" />
              <span>العملاء</span>
            </NavLink>
            <NavLink to="/admin/dashboard/analytics" className={linkClass}>
              <BarChart3 className="w-5 h-5" />
              <span>الزيارات</span>
            </NavLink>
            <NavLink to="/admin/dashboard/debts" className={linkClass}>
              <Wallet className="w-5 h-5" />
              <span>المديونيات</span>
            </NavLink>
            <NavLink to="/admin/dashboard/settings" className={linkClass}>
              <Settings className="w-5 h-5" />
              <span>الإعدادات</span>
            </NavLink>
          </nav>

          <Button onClick={logout} variant="ghost" className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10 mt-4">
            <LogOut className="w-5 h-5 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
