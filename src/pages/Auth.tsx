import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "โปรดเชื่อมต่อ Supabase",
        description: "เชื่อม Supabase เพื่อเปิดใช้ระบบล็อกอินจริง",
      });
    }, 600);
  };

  return (
    <main className="container mx-auto max-w-3xl py-10">
      <h1 className="sr-only">เข้าสู่ระบบ MemoRealm</h1>
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
              <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input id="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <Input id="password" type="password" placeholder="••••••••" required />
                </div>
                <Button type="submit" variant="hero" disabled={loading}>
                  {loading ? "กำลังดำเนินการ..." : "เข้าสู่ระบบ"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="name">ชื่อ</Label>
                  <Input id="name" type="text" placeholder="ชื่อของคุณ" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email2">อีเมล</Label>
                  <Input id="email2" type="email" placeholder="you@example.com" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password2">รหัสผ่าน</Label>
                  <Input id="password2" type="password" placeholder="••••••••" required />
                </div>
                <Button type="submit" variant="hero" disabled={loading}>
                  {loading ? "กำลังดำเนินการ..." : "สมัครสมาชิก"}
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
