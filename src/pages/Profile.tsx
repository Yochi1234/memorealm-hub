import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarDays, Images, Upload, Users, Share } from "lucide-react";

interface Stats {
  totalMedia: number;
  totalShares: number;
  totalViews: number;
  storageUsed: number;
}

interface Profile {
  display_name: string;
  bio: string;
  avatar_url: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalMedia: 0,
    totalShares: 0,
    totalViews: 0,
    storageUsed: 0
  });
  const [profile, setProfile] = useState<Profile>({
    display_name: "",
    bio: "",
    avatar_url: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchProfile();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Fetch media count and storage
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('size')
        .eq('user_id', user.id);

      if (mediaError) throw mediaError;

      const totalMedia = mediaData?.length || 0;
      const storageUsed = mediaData?.reduce((total, media) => total + (media.size || 0), 0) || 0;

      // Fetch shares count
      const { data: sharesData, error: sharesError } = await supabase
        .from('shares')
        .select('id')
        .eq('user_id', user.id);

      if (sharesError) throw sharesError;

      const totalShares = sharesData?.length || 0;

      setStats({
        totalMedia,
        totalShares,
        totalViews: 0, // Would need to implement view tracking
        storageUsed
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      // Direct database query with type assertion
      const result = await supabase
        .from('profiles' as any)
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (result.error && result.error.code !== 'PGRST116') {
        console.error('Profile fetch error:', result.error);
        return;
      }

      if (result.data) {
        setProfile({
          display_name: (result.data as any).display_name || "",
          bio: (result.data as any).bio || "",
          avatar_url: (result.data as any).avatar_url || ""
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles' as any)
        .upsert({
          id: user.id,
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url
        });

      if (error) throw error;

      toast({
        title: "โปรไฟล์อัพเดทแล้ว",
        description: "ข้อมูลโปรไฟล์ของคุณถูกบันทึกเรียบร้อยแล้ว"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัพเดทโปรไฟล์ได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user) return null;

  return (
    <div className="container mx-auto py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">จัดการโปรไฟล์และดูสถิติการใช้งาน</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รวมไฟล์สื่อ</CardTitle>
            <Images className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMedia}</div>
            <p className="text-xs text-muted-foreground">รูปภาพและวิดีโอ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การแชร์</CardTitle>
            <Share className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShares}</div>
            <p className="text-xs text-muted-foreground">ลิงก์แชร์ที่สร้าง</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">พื้นที่ใช้งาน</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.storageUsed)}</div>
            <p className="text-xs text-muted-foreground">ขนาดไฟล์รวม</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สมาชิกเมื่อ</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(user.created_at).toLocaleDateString('th-TH', { 
                month: 'short', 
                year: 'numeric' 
              })}
            </div>
            <p className="text-xs text-muted-foreground">วันที่สมัครสมาชิก</p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลบัญชี</CardTitle>
            <CardDescription>จัดการข้อมูลส่วนตัวของคุณ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  {(profile.display_name || user.email || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user.email}</p>
                <Badge variant="secondary">
                  {user.email_confirmed_at ? "อีเมลยืนยันแล้ว" : "รอการยืนยันอีเมล"}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="display_name">ชื่อที่แสดง</Label>
                <Input
                  id="display_name"
                  value={profile.display_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="ใส่ชื่อที่ต้องการแสดง"
                />
              </div>

              <div>
                <Label htmlFor="bio">เกี่ยวกับฉัน</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="เขียนอะไรเกี่ยวกับตัวคุณ..."
                  rows={3}
                />
              </div>

              <Button onClick={updateProfile} disabled={loading} className="w-full">
                {loading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>การตั้งค่าความเป็นส่วนตัว</CardTitle>
            <CardDescription>จัดการการแชร์และความเป็นส่วนตัว</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">ลิงก์โปรไฟล์สาธารณะ</p>
              <div className="flex space-x-2">
                <Input 
                  value={`${window.location.origin}/profile/${user.id}`} 
                  readOnly 
                  className="text-sm"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/profile/${user.id}`);
                    toast({ title: "คัดลอกลิงก์แล้ว!" });
                  }}
                >
                  คัดลอก
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                คนอื่นสามารถดูแกลเลอรี่สาธารณะของคุณผ่านลิงก์นี้
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">สถิติการใช้งาน</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">ไฟล์ทั้งหมด:</span>
                  <span className="ml-2 font-medium">{stats.totalMedia}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">การแชร์:</span>
                  <span className="ml-2 font-medium">{stats.totalShares}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;