import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Ghost, Loader2, Lock } from "lucide-react";

const ADMIN_EMAIL = "admin@alshbh.local";

const AdminLogin = () => {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav("/admin/dashboard", { replace: true });
    });
  }, [nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().toLowerCase() !== "admin") {
      toast.error("اسم المستخدم غير صحيح");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    });
    setLoading(false);
    if (error) {
      toast.error("بيانات الدخول غير صحيحة");
      return;
    }
    toast.success("تم تسجيل الدخول");
    nav("/admin/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/30 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-md bg-gradient-card rounded-3xl p-8 glow-border shadow-card-soft">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mb-4">
            <Ghost className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black">لوحة تحكم الشبح</h1>
          <p className="text-sm text-muted-foreground mt-1">سجل دخولك للمتابعة</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="mb-2 block">اسم المستخدم</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" required className="h-12" />
          </div>
          <div>
            <Label className="mb-2 block">كلمة المرور</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-primary text-primary-foreground font-bold">
            {loading ? <Loader2 className="animate-spin" /> : (<><Lock className="w-4 h-4 ml-2" /> دخول</>)}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
