import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import hero from "@/assets/hero-gallery.jpg";

const Index = () => {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div
          className="relative"
          aria-hidden
          style={{
            backgroundImage: `linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background)) 20%), url(${hero})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="container mx-auto py-24 sm:py-28">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                เก็บ จัดหมวด แชร์ ความทรงจำของคุณ
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                MemoRealm จัดการรูปภาพและวิดีโอได้ง่าย ๆ พร้อมโน้ต วันเวลา ลิงก์แชร์ และสิทธิ์ดาวน์โหลดต่อไฟล์
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button asChild variant="hero" size="lg">
                  <Link to="/auth">เริ่มใช้งานฟรี</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/gallery">ดูแกลเลอรีตัวอย่าง</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "var(--shadow-glow)" }} />
        </div>
      </section>

      <section className="container mx-auto py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>แยกหมวดหมู่สวยงาม</CardTitle>
              <CardDescription>กรองและค้นหาได้ไว เก็บเป็นระเบียบ</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">รองรับหมวดหมู่ที่กำหนดเองตามสไตล์ของคุณ</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>แชร์อย่างปลอดภัย</CardTitle>
              <CardDescription>สร้างลิงก์ แชร์เฉพาะคนที่ต้องการ</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">กำหนดได้ต่อไฟล์ว่าจะอนุญาตดาวน์โหลดหรือไม่</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>โน้ต + วันเวลา</CardTitle>
              <CardDescription>บันทึกรายละเอียดไว้พร้อมเวลาที่ชัดเจน</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">เตือนความจำได้ครบถ้วนในที่เดียว</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
};

export default Index;
