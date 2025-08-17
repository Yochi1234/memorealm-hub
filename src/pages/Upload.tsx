import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, MoreHorizontal, Trash2 } from "lucide-react";

const Upload = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [down, setDown] = useState(true);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [note, setNote] = useState("");

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

  const deleteCategory = async (categoryId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบหมวดหมู่ได้",
        variant: "destructive"
      });
      return;
    }

    setCategories(categories.filter(cat => cat.id !== categoryId));
    if (selectedCategory === categoryId) {
      setSelectedCategory("");
    }
    
    toast({
      title: "สำเร็จ",
      description: "ลบหมวดหมู่แล้ว"
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาเข้าสู่ระบบก่อน",
        variant: "destructive"
      });
      return;
    }

    if (!files || files.length === 0) {
      toast({
        title: "เกิดข้อผิดพลาด", 
        description: "กรุณาเลือกไฟล์ที่ต้องการอัปโหลด",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Save metadata to database
        const { error: dbError } = await supabase
          .from('media')
          .insert({
            user_id: user.id,
            path: uploadData.path,
            title: file.name.split('.')[0], // filename without extension
            note: note.trim() || null,
            category_id: selectedCategory || null,
            downloadable: down,
            size: file.size,
            mime_type: file.type,
            bucket: 'media'
          });

        if (dbError) throw dbError;

        return uploadData.path;
      });

      await Promise.all(uploadPromises);

      toast({
        title: "อัปโหลดสำเร็จ",
        description: `อัปโหลดไฟล์ ${files.length} ไฟล์เรียบร้อยแล้ว`
      });

      // Reset form
      setFiles(null);
      setNote("");
      setSelectedCategory("");
      
      // Reset file input
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปโหลดไฟล์ได้",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
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
              <Input 
                id="file" 
                type="file" 
                accept="image/*,video/*" 
                multiple 
                onChange={(e) => setFiles(e.target.files)}
              />
              <p className="text-xs text-muted-foreground">ลากไฟล์มาวางได้ รองรับภาพและวิดีโอ</p>
            </div>

            <div className="grid gap-4">
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

              {/* Category List with Delete Buttons */}
              {categories.length > 0 && (
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="text-sm text-muted-foreground">หมวดหมู่ที่มี:</div>
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
                      <div 
                        className={`cursor-pointer flex-1 ${selectedCategory === category.id ? 'font-medium text-primary' : ''}`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        {category.name}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>ลบหมวดหมู่</AlertDialogTitle>
                            <AlertDialogDescription>
                              คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ "{category.name}"? การกระทำนี้ไม่สามารถยกเลิกได้
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteCategory(category.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              ลบ
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Category Display */}
              {selectedCategory && (
                <div className="text-sm text-muted-foreground">
                  หมวดหมู่ที่เลือก: <span className="font-medium text-foreground">
                    {categories.find(cat => cat.id === selectedCategory)?.name}
                  </span>
                </div>
              )}
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
              <Textarea 
                id="note" 
                placeholder="เขียนรายละเอียดเพิ่มเติม…" 
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button variant="hero" type="submit" disabled={uploading}>
              {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default Upload;
