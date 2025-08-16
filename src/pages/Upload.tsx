import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";

const Upload = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [down, setDown] = useState(true);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }

    setCategories(data || []);
  };

  const createCategory = async () => {
    if (!user || !newCategoryName.trim()) return;

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: newCategoryName.trim(),
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างหมวดหมู่ได้",
        variant: "destructive"
      });
      return;
    }

    setCategories([...categories, data]);
    setSelectedCategory(data.id);
    setNewCategoryName("");
    setShowNewCategoryDialog(false);
    
    toast({
      title: "สำเร็จ",
      description: "สร้างหมวดหมู่ใหม่แล้ว"
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "ต้องเชื่อมต่อ Supabase ก่อน",
      description: "เชื่อม Supabase เพื่ออัปโหลดไฟล์จริงและบันทึกเมตาดาตา",
    });
  };

  return (
    <main className="container mx-auto max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>อัปโหลดสื่อ</CardTitle>
          <CardDescription>เพิ่มรูป/วิดีโอ จัดหมวดหมู่ ใส่โน้ต และตั้งค่าสิทธิ์ดาวน์โหลด</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="file">ไฟล์สื่อ</Label>
              <Input id="file" type="file" accept="image/*,video/*" multiple />
              <p className="text-xs text-muted-foreground">ลากไฟล์มาวางได้ รองรับภาพและวิดีโอ</p>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>หมวดหมู่</Label>
                <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Plus className="w-4 h-4 mr-1" />
                      สร้างหมวดหมู่
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>สร้างหมวดหมู่ใหม่</DialogTitle>
                      <DialogDescription>
                        ใส่ชื่อหมวดหมู่ที่ต้องการสร้าง
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Input
                        placeholder="ชื่อหมวดหมู่..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
                        ยกเลิก
                      </Button>
                      <Button onClick={createCategory} disabled={!newCategoryName.trim()}>
                        สร้าง
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="downloadable">อนุญาตให้ดาวน์โหลด</Label>
                <p className="text-xs text-muted-foreground">ปิดไว้ถ้าไม่ต้องการให้ผู้อื่นดาวน์โหลดไฟล์นี้</p>
              </div>
              <Switch id="downloadable" checked={down} onCheckedChange={setDown} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">โน้ต</Label>
              <Textarea id="note" placeholder="เขียนรายละเอียดเพิ่มเติม…" />
            </div>

            <Button variant="hero" type="submit">อัปโหลด</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default Upload;
