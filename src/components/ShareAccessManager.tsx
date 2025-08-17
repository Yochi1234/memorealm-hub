import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Trash2, Check, X, UserPlus, Users, ShieldCheck } from "lucide-react";

interface ShareAccessManagerProps {
  shareId: string;
  mediaTitle: string;
}

interface ShareAccessItem {
  id: string;
  user_id: string;
  mode: any;
  created_at: string;
  profiles?: {
    display_name: string;
  } | null;
}

interface AccessRequest {
  id: string;
  requester_id: string;
  requester_email: string;
  message: string;
  status: string;
  created_at: string;
  profiles?: {
    display_name: string;
  } | null;
}

export const ShareAccessManager = ({ shareId, mediaTitle }: ShareAccessManagerProps) => {
  const { user } = useAuth();
  const [accessList, setAccessList] = useState<ShareAccessItem[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [accessMode, setAccessMode] = useState<'allowed' | 'blocked'>('allowed');
  const [shareSettings, setShareSettings] = useState<{access_mode: string}>({access_mode: 'open'});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shareId) {
      fetchAccessList();
      fetchAccessRequests();
      fetchShareSettings();
    }
  }, [shareId]);

  const fetchShareSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('shares')
        .select('access_mode')
        .eq('id', shareId)
        .single();

      if (error) throw error;
      setShareSettings(data);
    } catch (error) {
      console.error('Error fetching share settings:', error);
    }
  };

  const fetchAccessList = async () => {
    try {
      const { data, error } = await supabase
        .from('share_access')
        .select('id, user_id, mode, created_at')
        .eq('share_id', shareId);

      if (error) throw error;
      setAccessList((data || []).map(item => ({ ...item, profiles: null })));
    } catch (error) {
      console.error('Error fetching access list:', error);
    }
  };

  const fetchAccessRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('share_access_requests')
        .select('id, requester_id, requester_email, message, status, created_at')
        .eq('share_id', shareId)
        .eq('status', 'pending');

      if (error) throw error;
      setAccessRequests((data || []).map(item => ({ ...item, profiles: null })));
    } catch (error) {
      console.error('Error fetching access requests:', error);
    }
  };

  const updateShareAccessMode = async (mode: string) => {
    try {
      const { error } = await supabase
        .from('shares')
        .update({ access_mode: mode })
        .eq('id', shareId);

      if (error) throw error;
      setShareSettings({ access_mode: mode });
      toast({ title: "อัปเดตการตั้งค่าการแชร์แล้ว" });
    } catch (error) {
      console.error('Error updating share access mode:', error);
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    }
  };

  const addUserAccess = async () => {
    if (!newUserEmail.trim()) return;

    setLoading(true);
    try {
      // Find user by email from profiles
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', newUserEmail) // Assuming email lookup, might need auth.users integration
        .single();

      if (userError) {
        toast({ title: "ไม่พบผู้ใช้นี้", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from('share_access')
        .insert({
          share_id: shareId,
          user_id: userData.id,
          mode: accessMode as any
        });

      if (error) throw error;

      toast({ title: `เพิ่มผู้ใช้เข้า ${accessMode === 'allowed' ? 'whitelist' : 'blacklist'} แล้ว` });
      setNewUserEmail("");
      fetchAccessList();
    } catch (error) {
      console.error('Error adding user access:', error);
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const removeUserAccess = async (accessId: string) => {
    try {
      const { error } = await supabase
        .from('share_access')
        .delete()
        .eq('id', accessId);

      if (error) throw error;
      toast({ title: "ลบผู้ใช้แล้ว" });
      fetchAccessList();
    } catch (error) {
      console.error('Error removing user access:', error);
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    }
  };

  const handleAccessRequest = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('share_access_requests')
        .update({
          status: action,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // If approved, add to access list
      if (action === 'approved') {
        const request = accessRequests.find(r => r.id === requestId);
        if (request) {
          await supabase
            .from('share_access')
            .insert({
              share_id: shareId,
              user_id: request.requester_id,
              mode: 'allowed' as any
            });
        }
      }

      toast({ title: action === 'approved' ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว" });
      fetchAccessRequests();
      fetchAccessList();
    } catch (error) {
      console.error('Error handling access request:', error);
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'allowed': return 'default';
      case 'blocked': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'allowed': return 'อนุญาต';
      case 'blocked': return 'บล็อค';
      case 'pending': return 'รอการอนุมัติ';
      default: return mode;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          จัดการการเข้าถึง
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>จัดการการเข้าถึง: {mediaTitle}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings">การตั้งค่า</TabsTrigger>
            <TabsTrigger value="whitelist">Whitelist</TabsTrigger>
            <TabsTrigger value="blacklist">Blacklist</TabsTrigger>
            <TabsTrigger value="requests">คำขอ ({accessRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>โหมดการเข้าถึง</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant={shareSettings.access_mode === 'open' ? 'default' : 'outline'}
                    onClick={() => updateShareAccessMode('open')}
                    className="flex flex-col p-4 h-auto"
                  >
                    <Users className="h-6 w-6 mb-2" />
                    <span>เปิดให้ทุกคน</span>
                    <span className="text-xs text-muted-foreground">ทุกคนสามารถเข้าถึงได้</span>
                  </Button>
                  <Button 
                    variant={shareSettings.access_mode === 'restricted' ? 'default' : 'outline'}
                    onClick={() => updateShareAccessMode('restricted')}
                    className="flex flex-col p-4 h-auto"
                  >
                    <ShieldCheck className="h-6 w-6 mb-2" />
                    <span>จำกัดการเข้าถึง</span>
                    <span className="text-xs text-muted-foreground">ใช้ whitelist/blacklist</span>
                  </Button>
                  <Button 
                    variant={shareSettings.access_mode === 'private' ? 'default' : 'outline'}
                    onClick={() => updateShareAccessMode('private')}
                    className="flex flex-col p-4 h-auto"
                  >
                    <X className="h-6 w-6 mb-2" />
                    <span>ต้องอนุมัติ</span>
                    <span className="text-xs text-muted-foreground">ต้องขออนุญาตก่อนเข้าถึง</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whitelist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Whitelist - รายชื่อที่อนุญาต</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="อีเมลผู้ใช้"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                  <Button onClick={() => { setAccessMode('allowed'); addUserAccess(); }} disabled={loading}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    เพิ่ม
                  </Button>
                </div>
                <div className="space-y-2">
                  {accessList.filter(item => item.mode === 'allowed').map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">
                          {item.profiles?.display_name || item.user_id}
                        </span>
                        <Badge variant={getModeColor(item.mode)} className="ml-2">
                          {getModeLabel(item.mode)}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeUserAccess(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blacklist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Blacklist - รายชื่อที่บล็อค</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="อีเมลผู้ใช้"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                  <Button onClick={() => { setAccessMode('blocked'); addUserAccess(); }} disabled={loading}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    เพิ่ม
                  </Button>
                </div>
                <div className="space-y-2">
                  {accessList.filter(item => item.mode === 'blocked').map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">
                          {item.profiles?.display_name || item.user_id}
                        </span>
                        <Badge variant={getModeColor(item.mode)} className="ml-2">
                          {getModeLabel(item.mode)}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeUserAccess(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>คำขอการเข้าถึง</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {accessRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">ไม่มีคำขอรอการอนุมัติ</p>
                ) : (
                  <div className="space-y-3">
                    {accessRequests.map((request) => (
                      <div key={request.id} className="border rounded p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">
                              {request.profiles?.display_name || request.requester_email}
                            </span>
                            <p className="text-sm text-muted-foreground">
                              {new Date(request.created_at).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAccessRequest(request.id, 'approved')}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              อนุมัติ
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAccessRequest(request.id, 'rejected')}
                            >
                              <X className="h-4 w-4 mr-1" />
                              ปฏิเสธ
                            </Button>
                          </div>
                        </div>
                        {request.message && (
                          <p className="text-sm p-2 bg-muted rounded">
                            "{request.message}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};