import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  // Redirect if already logged in
  if (!authLoading && user) {
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      toast({
        title: "เข้าสู่ระบบไม่สำเร็จ",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับกลับ!",
      });
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: formData.name,
        }
      }
    });

    if (error) {
      toast({
        title: "สมัครสมาชิกไม่สำเร็จ",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "สมัครสมาชิกสำเร็จ",
        description: "โปรดตรวจสอบอีเมลเพื่อยืนยันบัญชี",
      });
    }
    
    setLoading(false);
  };

  return (
    <main className="container mx-auto max-w-3xl py-10">
      <h1 className="sr-only">เข้าสู่ระบบ remembranceGraX</h1>
      <Card>
        <CardHeader>
          <CardTitle>ยินดีต้อนรับกลับ</CardTitle>
          <CardDescription>เข้าสู่ระบบหรือสมัครสมาชิกใหม่</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList>
              <TabsTrigger value="signin">เข้าสู่ระบบ</TabsTrigger>
              <TabsTrigger value="signup">สมัครสมาชิก</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form className="mt-6 grid gap-4" onSubmit={handleSignIn}>
                <div className="grid gap-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    placeholder="you@example.com" 
                    value={formData.email}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <Input 
                    id="password" 
                    name="password"
                    type="password" 
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <Button type="submit" variant="hero" disabled={loading}>
                  {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form className="mt-6 grid gap-4" onSubmit={handleSignUp}>
                <div className="grid gap-2">
                  <Label htmlFor="name">ชื่อ</Label>
                  <Input 
                    id="name" 
                    name="name"
                    type="text" 
                    placeholder="ชื่อของคุณ"
                    value={formData.name}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email2">อีเมล</Label>
                  <Input 
                    id="email2" 
                    name="email"
                    type="email" 
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password2">รหัสผ่าน</Label>
                  <Input 
                    id="password2" 
                    name="password"
                    type="password" 
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <Button type="submit" variant="hero" disabled={loading}>
                  {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
};

export default Auth;
