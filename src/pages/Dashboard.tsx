import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  FileText, 
  Share2, 
  Eye, 
  Download, 
  TrendingUp, 
  Calendar,
  HardDrive,
  Activity,
  BarChart3,
  Clock
} from "lucide-react";

interface DashboardStats {
  totalMedia: number;
  totalShares: number;
  totalViews: number;
  storageUsed: number;
  recentUploads: number;
  activeShares: number;
}

interface MediaItem {
  id: string;
  title: string;
  created_at: string;
  size: number;
  mime_type: string;
  views?: number;
}

interface ShareItem {
  id: string;
  token: string;
  created_at: string;
  expire_at: string | null;
  require_auth: boolean;
  allow_download: boolean;
  media: {
    title: string;
  };
}

const chartConfig = {
  uploads: {
    label: "Uploads",
    color: "hsl(var(--primary))",
  },
  views: {
    label: "Views", 
    color: "hsl(var(--secondary))",
  },
  shares: {
    label: "Shares",
    color: "hsl(var(--accent))",
  },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMedia: 0,
    totalShares: 0,
    totalViews: 0,
    storageUsed: 0,
    recentUploads: 0,
    activeShares: 0,
  });
  const [recentMedia, setRecentMedia] = useState<MediaItem[]>([]);
  const [recentShares, setRecentShares] = useState<ShareItem[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch media stats
      const { data: media, error: mediaError } = await supabase
        .from("media")
        .select("*")
        .eq("user_id", user?.id);

      if (mediaError) throw mediaError;

      // Fetch shares stats
      const { data: shares, error: sharesError } = await supabase
        .from("shares")
        .select("*, media(title)")
        .eq("user_id", user?.id);

      if (sharesError) throw sharesError;

      // Calculate stats
      const totalSize = media?.reduce((sum, item) => sum + (item.size || 0), 0) || 0;
      const recentUploads = media?.filter(item => {
        const uploadDate = new Date(item.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return uploadDate >= weekAgo;
      }).length || 0;

      const activeShares = shares?.filter(share => {
        if (!share.expire_at) return true;
        return new Date(share.expire_at) > new Date();
      }).length || 0;

      setStats({
        totalMedia: media?.length || 0,
        totalShares: shares?.length || 0,
        totalViews: 0, // Would need analytics table
        storageUsed: totalSize,
        recentUploads,
        activeShares,
      });

      setRecentMedia(media?.slice(0, 5) || []);
      setRecentShares(shares?.slice(0, 5) || []);

      // Generate chart data (mock data for demonstration)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
          uploads: Math.floor(Math.random() * 10),
          views: Math.floor(Math.random() * 50),
          shares: Math.floor(Math.random() * 15),
        };
      });
      setChartData(last7Days);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("ไม่สามารถโหลดข้อมูล dashboard ได้");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">ภาพรวมและการจัดการระบบของคุณ</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          <Activity className="w-4 h-4 mr-2" />
          รีเฟรช
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ไฟล์ทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMedia}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.recentUploads} ในสัปดาห์นี้
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การแชร์</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShares}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeShares} ลิงก์ที่ใช้งานได้
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การเข้าชม</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              รวมการเข้าชมทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">พื้นที่ใช้งาน</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.storageUsed)}</div>
            <Progress value={25} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              25% ของพื้นที่ทั้งหมด
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              กิจกรรมรายวัน
            </CardTitle>
            <CardDescription>
              สถิติการใช้งานใน 7 วันที่ผ่านมา
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="uploads" fill="var(--color-uploads)" />
                  <Bar dataKey="views" fill="var(--color-views)" />
                  <Bar dataKey="shares" fill="var(--color-shares)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              ไฟล์ล่าสุด
            </CardTitle>
            <CardDescription>
              ไฟล์ที่อัปโหลดล่าสุด
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMedia.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate max-w-[200px]">
                      {item.title || "ไม่มีชื่อ"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(item.size || 0)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {item.mime_type?.split('/')[0] || 'unknown'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Tables */}
      <Tabs defaultValue="shares" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shares">การแชร์ล่าสุด</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="shares">
          <Card>
            <CardHeader>
              <CardTitle>การแชร์ล่าสุด</CardTitle>
              <CardDescription>
                ลิงก์แชร์ที่สร้างล่าสุดและสถานะ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ไฟล์</TableHead>
                    <TableHead>สร้างเมื่อ</TableHead>
                    <TableHead>หมดอายุ</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การตั้งค่า</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentShares.map((share) => {
                    const isExpired = share.expire_at && new Date(share.expire_at) < new Date();
                    return (
                      <TableRow key={share.id}>
                        <TableCell className="font-medium">
                          {share.media?.title || "ไม่มีชื่อ"}
                        </TableCell>
                        <TableCell>{formatDate(share.created_at)}</TableCell>
                        <TableCell>
                          {share.expire_at ? formatDate(share.expire_at) : "ไม่หมดอายุ"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isExpired ? "destructive" : "default"}>
                            {isExpired ? "หมดอายุ" : "ใช้งานได้"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {share.require_auth && (
                              <Badge variant="outline" className="text-xs">Auth</Badge>
                            )}
                            {share.allow_download && (
                              <Badge variant="outline" className="text-xs">DL</Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Insights</CardTitle>
              <CardDescription>
                รายละเอียดการใช้งานและสถิติต่างๆ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">ประเภทไฟล์ที่นิยม</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>รูปภาพ</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>วิดีโอ</span>
                      <span>30%</span>
                    </div>
                    <Progress value={30} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>เอกสาร</span>
                      <span>25%</span>
                    </div>
                    <Progress value={25} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">เวลาใช้งานแอคทีฟ</h4>
                  <div className="text-2xl font-bold">9:00-17:00</div>
                  <p className="text-sm text-muted-foreground">
                    ช่วงเวลาที่มีการใช้งานมากที่สุด
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}