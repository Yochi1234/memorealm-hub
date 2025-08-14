import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Edit, Trash2, Share, Download, Eye, Calendar, FolderOpen } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface MediaItem {
  id: string;
  path: string;
  title: string | null;
  note: string | null;
  category_id: string | null;
  category_name?: string;
  downloadable: boolean;
  size: number | null;
  created_at: string;
  updated_at: string;
  mime_type: string | null;
  bucket: string;
}

interface Category {
  id: string;
  name: string;
}

const Gallery = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [editForm, setEditForm] = useState({ title: "", note: "", category_id: "", downloadable: true });

  useEffect(() => {
    if (user) {
      fetchMediaAndCategories();
    }
  }, [user]);

  const fetchMediaAndCategories = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch categories
      const categoriesResult = await supabase
        .from('categories' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (categoriesResult.error) throw categoriesResult.error;

      // Fetch media
      const mediaResult = await supabase
        .from('media' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (mediaResult.error) throw mediaResult.error;

      const categoriesData = (categoriesResult.data as any[]) || [];
      const mediaData = (mediaResult.data as any[]) || [];

      setCategories(categoriesData);
      
      // Add category names to media items
      const mediaWithCategories = mediaData.map((item: any) => ({
        ...item,
        category_name: categoriesData.find((cat: any) => cat.id === item.category_id)?.name || null
      }));
      
      setItems(mediaWithCategories);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (item: MediaItem) => {
    return supabase.storage.from(item.bucket).getPublicUrl(item.path).data.publicUrl;
  };

  const downloadFile = async (item: MediaItem) => {
    try {
      const { data, error } = await supabase.storage
        .from(item.bucket)
        .download(item.path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.title || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "ดาวน์โหลดเสร็จสิ้น" });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดาวน์โหลดได้",
        variant: "destructive"
      });
    }
  };

  const shareItem = async (item: MediaItem) => {
    try {
      // Create a share link (simplified for now)
      const shareUrl = `${window.location.origin}/share/${item.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({ 
        title: "คัดลอกลิงก์แล้ว", 
        description: "ลิงก์แชร์ถูกคัดลอกไปยังคลิปบอร์ดแล้ว" 
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถคัดลอกลิงก์ได้",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (item: MediaItem) => {
    setEditingItem(item);
    setEditForm({
      title: item.title || "",
      note: item.note || "",
      category_id: item.category_id || "",
      downloadable: item.downloadable
    });
  };

  const updateItem = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('media' as any)
        .update({
          title: editForm.title,
          note: editForm.note,
          category_id: editForm.category_id || null,
          downloadable: editForm.downloadable
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast({ title: "อัปเดตเสร็จสิ้น" });
      setEditingItem(null);
      fetchMediaAndCategories();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตได้",
        variant: "destructive"
      });
    }
  };

  const deleteItem = async (item: MediaItem) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(item.bucket)
        .remove([item.path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('media' as any)
        .delete()
        .eq('id', item.id);

      if (dbError) throw dbError;

      toast({ title: "ลบเสร็จสิ้น" });
      fetchMediaAndCategories();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบได้",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'ไม่ทราบขนาด';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) return null;

  if (loading) {
    return (
      <main className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">กำลังโหลด...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-10">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">แกลเลอรีของคุณ</h1>
            <p className="text-muted-foreground mt-2">
              จัดการและแชร์ไฟล์มีเดียของคุณ · {items.length} ไฟล์
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              {categories.length} หมวดหมู่
            </Badge>
          </div>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
            <Eye className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">ยังไม่มีไฟล์</h3>
          <p className="text-muted-foreground mb-4">
            เริ่มต้นด้วยการอัปโหลดไฟล์แรกของคุณ
          </p>
          <Button asChild>
            <a href="/upload">อัปโหลดไฟล์</a>
          </Button>
        </div>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className="relative">
                <img
                  src={getImageUrl(item)}
                  alt={item.title || "รูปภาพ"}
                  className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur-sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(item)}>
                        <Edit className="mr-2 h-4 w-4" />
                        แก้ไข
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => shareItem(item)}>
                        <Share className="mr-2 h-4 w-4" />
                        แชร์
                      </DropdownMenuItem>
                      {item.downloadable && (
                        <DropdownMenuItem onClick={() => downloadFile(item)}>
                          <Download className="mr-2 h-4 w-4" />
                          ดาวน์โหลด
                        </DropdownMenuItem>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            ลบ
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                            <AlertDialogDescription>
                              คุณแน่ใจหรือไม่ที่จะลบ "{item.title || 'ไฟล์นี้'}"? การดำเนินการนี้ไม่สามารถยกเลิกได้
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteItem(item)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              ลบ
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-1">
                    {item.title || "ไม่มีชื่อ"}
                  </CardTitle>
                  {item.category_name && (
                    <Badge variant="secondary" className="text-xs">
                      {item.category_name}
                    </Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {formatDate(item.created_at)}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                {item.note && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.note}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatFileSize(item.size)}</span>
                  <div className="flex items-center gap-2">
                    {item.downloadable ? (
                      <Badge variant="outline" className="text-xs">ดาวน์โหลดได้</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">ไม่ให้ดาวน์โหลด</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขไฟล์</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลของไฟล์ "{editingItem?.title || 'ไม่มีชื่อ'}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">ชื่อไฟล์</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="ใส่ชื่อไฟล์"
              />
            </div>
            <div>
              <label className="text-sm font-medium">หมวดหมู่</label>
              <Select
                value={editForm.category_id}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ไม่มีหมวดหมู่</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">โน้ต</label>
              <Textarea
                value={editForm.note}
                onChange={(e) => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                placeholder="เพิ่มโน้ตหรือคำอธิบาย"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="downloadable"
                checked={editForm.downloadable}
                onChange={(e) => setEditForm(prev => ({ ...prev, downloadable: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="downloadable" className="text-sm">
                อนุญาตให้ดาวน์โหลดได้
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              ยกเลิก
            </Button>
            <Button onClick={updateItem}>
              บันทึก
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Gallery;
