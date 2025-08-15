import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "moderator" | "user" | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching user role:", error);
        }

        setRole(data?.role || "user");
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole("user");
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    // Set up real-time subscription for role changes
    const channel = supabase
      .channel("user-role-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            setRole(payload.new.role);
          } else if (payload.eventType === "DELETE") {
            setRole("user");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const hasRole = (requiredRole: UserRole) => {
    if (!requiredRole || !role) return false;
    const roleHierarchy = { admin: 3, moderator: 2, user: 1 };
    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  return { role, loading, hasRole };
};