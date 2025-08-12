import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Upload = () => {
  const { toast } = useToast();
  const [down, setDown] = useState(true);

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
              <Label>หมวดหมู่</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="travel">ท่องเที่ยว</SelectItem>
                  <SelectItem value="lifestyle">ไลฟ์สไตล์</SelectItem>
                  <SelectItem value="family">ครอบครัว</SelectItem>
                  <SelectItem value="nature">ธรรมชาติ</SelectItem>
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
