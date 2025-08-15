import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface RealtimeStats {
  totalMedia: number;
  totalShares: number;
  totalUsers: number;
  activeUsers: number;
  storageUsed: number;
  recentActivity: ActivityLog[];
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  created_at: string;
  profiles?: {
    display_name: string;
  };
}

export const useRealtimeData = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<RealtimeStats>({
    totalMedia: 0,
    totalShares: 0,
    totalUsers: 0,
    activeUsers: 0,
    storageUsed: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch media count
      const { count: mediaCount } = await supabase
        .from("media")
        .select("*", { count: "exact", head: true });

      // Fetch shares count
      const { count: sharesCount } = await supabase
        .from("shares")
        .select("*", { count: "exact", head: true });

      // Fetch users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch storage usage
      const { data: mediaData } = await supabase
        .from("media")
        .select("size");

      const totalStorage = mediaData?.reduce((sum, item) => sum + (item.size || 0), 0) || 0;

      // Fetch recent activity
      const { data: activityData } = await supabase
        .from("access_logs")
        .select(`
          id,
          user_id,
          action,
          resource,
          created_at
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      // Get display names for activity logs
      const activityWithProfiles = await Promise.all(
        (activityData || []).map(async (log) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", log.user_id)
            .single();

          return {
            ...log,
            profiles: profile ? { display_name: profile.display_name } : { display_name: "Unknown User" }
          };
        })
      );

      setStats({
        totalMedia: mediaCount || 0,
        totalShares: sharesCount || 0,
        totalUsers: usersCount || 0,
        activeUsers: Math.floor((usersCount || 0) * 0.3), // Mock active users
        storageUsed: totalStorage,
        recentActivity: activityWithProfiles,
      });
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();

    if (!user) return;

    // Set up real-time subscriptions
    const mediaChannel = supabase
      .channel("media-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "media" },
        () => fetchInitialData()
      )
      .subscribe();

    const sharesChannel = supabase
      .channel("shares-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shares" },
        () => fetchInitialData()
      )
      .subscribe();

    const profilesChannel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchInitialData()
      )
      .subscribe();

    const activityChannel = supabase
      .channel("activity-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "access_logs" },
        () => fetchInitialData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(mediaChannel);
      supabase.removeChannel(sharesChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(activityChannel);
    };
  }, [user]);

  return { stats, loading, refresh: fetchInitialData };
};