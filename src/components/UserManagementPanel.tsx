import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, UserPlus, UserMinus, Search, Filter, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface UserData {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  role?: "admin" | "moderator" | "user";
  access_status?: "allowed" | "blocked" | "pending";
  last_sign_in?: string;
}

interface ProfileWithRelations {
  id: string;
  display_name: string | null;
  created_at: string;
  user_roles: { role: string }[] | null;
  access_control: { status: string; reason: string | null }[] | null;
}

export const UserManagementPanel = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [actionType, setActionType] = useState<"role" | "access" | null>(null);
  const [newRole, setNewRole] = useState<"admin" | "moderator" | "user">("user");
  const [newStatus, setNewStatus] = useState<"allowed" | "blocked" | "pending">("allowed");
  const [blockReason, setBlockReason] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with their roles and access control
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          display_name,
          created_at,
          user_roles!inner(role),
          access_control(status, reason)
        `);

      if (profilesError) throw profilesError;

      // Transform the data to match our UserData interface
      const combinedUsers: UserData[] = profiles ? profiles.map((profile: any) => ({
        id: profile.id,
        email: `user-${profile.id.slice(0, 8)}@example.com`, // Mock email since we can't access auth.users
        display_name: profile.display_name || "No Name",
        created_at: profile.created_at,
        role: (profile.user_roles?.[0]?.role as "admin" | "moderator" | "user") || "user",
        access_status: (profile.access_control?.[0]?.status as "allowed" | "blocked" | "pending") || "allowed",
        last_sign_in: undefined,
      })) : [];

      setUsers(combinedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Set up real-time subscriptions
    const profilesChannel = supabase
      .channel("profiles-management")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchUsers)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, fetchUsers)
      .on("postgres_changes", { event: "*", schema: "public", table: "access_control" }, fetchUsers)
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .upsert({
          user_id: selectedUser.id,
          role: newRole,
        });

      if (error) throw error;

      toast.success("อัปเดตบทบาทผู้ใช้สำเร็จ");
      setActionType(null);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("ไม่สามารถอัปเดตบทบาทได้");
    }
  };

  const handleAccessChange = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("access_control")
        .upsert({
          user_id: selectedUser.id,
          status: newStatus,
          reason: blockReason || null,
        });

      if (error) throw error;

      toast.success("อัปเดตสถานะการเข้าถึงสำเร็จ");
      setActionType(null);
      setSelectedUser(null);
      setBlockReason("");
      fetchUsers();
    } catch (error) {
      console.error("Error updating access:", error);
      toast.error("ไม่สามารถอัปเดตสถานะการเข้าถึงได้");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.access_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "moderator": return "default";
      default: return "secondary";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "blocked": return "destructive";
      case "pending": return "default";
      default: return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          การจัดการผู้ใช้
        </CardTitle>
        <CardDescription>
          จัดการบทบาทและสิทธิ์การเข้าถึงของผู้ใช้
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="ค้นหาผู้ใช้..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="allowed">อนุญาต</SelectItem>
              <SelectItem value="blocked">ถูกบล็อก</SelectItem>
              <SelectItem value="pending">รอดำเนินการ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>บทบาท</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>เข้าร่วมเมื่อ</TableHead>
                <TableHead>เข้าสู่ระบบล่าสุด</TableHead>
                <TableHead>การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.display_name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleColor(user.role)}>
                      {user.role === "admin" ? "ผู้ดูแลระบบ" :
                       user.role === "moderator" ? "ผู้ดูแล" : "ผู้ใช้"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(user.access_status)}>
                      {user.access_status === "allowed" ? "อนุญาต" :
                       user.access_status === "blocked" ? "ถูกบล็อก" : "รอดำเนินการ"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('th-TH')}
                  </TableCell>
                  <TableCell>
                    {user.last_sign_in ? 
                      new Date(user.last_sign_in).toLocaleDateString('th-TH') : 
                      "ไม่เคย"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role || "user");
                            setActionType("role");
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          เปลี่ยนบทบาท
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedUser(user);
                            setNewStatus(user.access_status || "allowed");
                            setActionType("access");
                          }}
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          จัดการการเข้าถึง
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Role Change Dialog */}
        <Dialog open={actionType === "role"} onOpenChange={() => setActionType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เปลี่ยนบทบาทผู้ใช้</DialogTitle>
              <DialogDescription>
                เปลี่ยนบทบาทของ {selectedUser?.display_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>บทบาทใหม่</Label>
                <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">ผู้ใช้</SelectItem>
                    <SelectItem value="moderator">ผู้ดูแล</SelectItem>
                    <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionType(null)}>
                ยกเลิก
              </Button>
              <Button onClick={handleRoleChange}>
                บันทึก
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Access Control Dialog */}
        <Dialog open={actionType === "access"} onOpenChange={() => setActionType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>จัดการการเข้าถึง</DialogTitle>
              <DialogDescription>
                เปลี่ยนสถานะการเข้าถึงของ {selectedUser?.display_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>สถานะการเข้าถึง</Label>
                <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allowed">อนุญาต</SelectItem>
                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                    <SelectItem value="blocked">บล็อก</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newStatus === "blocked" && (
                <div>
                  <Label>เหตุผลในการบล็อก</Label>
                  <Textarea
                    placeholder="ระบุเหตุผล..."
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionType(null)}>
                ยกเลิก
              </Button>
              <Button onClick={handleAccessChange} variant={newStatus === "blocked" ? "destructive" : "default"}>
                บันทึก
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};