import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const MAX_RETRIES = 2;

export default function CompanyGate({ children }: { children: React.ReactNode }) {
  const { companies, loading } = useCompany();
  const { user } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkOnboarding = useCallback(async (retries = 0) => {
    if (!user) return;
    try {
      const { data, error: queryError } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (queryError) {
        if (retries < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * (retries + 1)));
          return checkOnboarding(retries + 1);
        }
        console.error("CompanyGate: profile query failed after retries", queryError);
        setError("Unable to load your profile. Please check your connection and reload.");
        setOnboardingChecked(true);
        return;
      }

      // No profile row yet — treat as not onboarded (not an error)
      setOnboardingCompleted(data?.onboarding_completed ?? false);
      setError(null);
    } catch {
      if (retries < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * (retries + 1)));
        return checkOnboarding(retries + 1);
      }
      setError("Unable to load your profile. Please check your connection and reload.");
    } finally {
      setOnboardingChecked(true);
    }
  }, [user]);

  useEffect(() => {
    if (!user || loading) return;
    setOnboardingChecked(false);
    setError(null);
    checkOnboarding();
  }, [user, loading, checkOnboarding]);

  if (loading || !onboardingChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3 max-w-sm px-4">
          <p className="text-sm text-destructive font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (!onboardingCompleted || companies.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
