import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import img1 from "@/assets/gallery-1.jpg";
import img2 from "@/assets/gallery-2.jpg";
import img3 from "@/assets/gallery-3.jpg";
import img4 from "@/assets/gallery-4.jpg";
import img5 from "@/assets/gallery-5.jpg";
import img6 from "@/assets/gallery-6.jpg";

interface Item {
  id: string;
  src: string;
  title: string;
  category: string;
  note: string;
  datetime: string;
  downloadable: boolean;
}

const sampleItems: Item[] = [
  { id: "1", src: img1, title: "ภูเขายามเช้า", category: "ท่องเที่ยว", note: "ทริปเชียงใหม่", datetime: "2025-05-28 06:14", downloadable: true },
  { id: "2", src: img2, title: "เช้าอุ่นๆ", category: "ไลฟ์สไตล์", note: "คาเฟ่ประจำ", datetime: "2025-06-02 09:10", downloadable: false },
  { id: "3", src: img3, title: "เมืองยามค่ำ", category: "บุคคล", note: "Skyline วันฝนตก", datetime: "2025-06-12 19:22", downloadable: true },
  { id: "4", src: img4, title: "หยดน้ำบนใบไม้", category: "ธรรมชาติ", note: "ลองเลนส์มาโคร", datetime: "2025-07-01 07:01", downloadable: true },
  { id: "5", src: img5, title: "ตรอกนีออน", category: "สตรีท", note: "เดินเล่นหลังฝน", datetime: "2025-07-11 21:45", downloadable: false },
  { id: "6", src: img6, title: "อบอุ่นในบ้าน", category: "ครอบครัว", note: "วันเกิดคุณแม่", datetime: "2025-07-20 18:03", downloadable: true },
];

const Gallery = () => {
  const { toast } = useToast();
  const items = useMemo(() => sampleItems, []);

  const share = async (id: string) => {
    const fakeUrl = `${window.location.origin}/share/${id}`;
    try {
      await navigator.clipboard.writeText(fakeUrl);
      toast({ title: "คัดลอกลิงก์แล้ว", description: fakeUrl });
    } catch {
      toast({ title: "ไม่สามารถคัดลอกลิงก์ได้", description: fakeUrl });
    }
  };

  return (
    <main className="container mx-auto py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">แกลเลอรีของคุณ</h1>
        <p className="text-muted-foreground">ตัวอย่างข้อมูล (ยังไม่เชื่อมต่อ Supabase)</p>
      </header>

      <section aria-label="รายการสื่อ" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Card key={it.id} className="overflow-hidden group">
            <img
              src={it.src}
              alt={`${it.title} – หมวดหมู่ ${it.category}`}
              className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{it.title}</CardTitle>
                <Badge variant="secondary">{it.category}</Badge>
              </div>
              <CardDescription>
                <time dateTime={it.datetime}>{it.datetime}</time>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">โน้ต: {it.note}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => share(it.id)}>แชร์ลิงก์</Button>
                <Button
                  variant="secondary"
                  asChild={!it.downloadable}
                  disabled={!it.downloadable}
                >
                  {it.downloadable ? (
                    <a href={it.src} download>
                      ดาวน์โหลด
                    </a>
                  ) : (
                    <span>ปิดดาวน์โหลด</span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
};

export default Gallery;
