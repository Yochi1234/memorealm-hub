-- Add access request management system for shares

-- First, update the mode enum in share_access to support more granular control
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'share_access_mode') THEN
        CREATE TYPE public.share_access_mode AS ENUM ('allowed', 'blocked', 'pending', 'requested');
    ELSE
        -- Add new enum values if they don't exist
        BEGIN
            ALTER TYPE public.share_access_mode ADD VALUE IF NOT EXISTS 'pending';
            ALTER TYPE public.share_access_mode ADD VALUE IF NOT EXISTS 'requested';
        EXCEPTION WHEN duplicate_object THEN
            -- Ignore if values already exist
            NULL;
        END;
    END IF;
END $$;

-- Update share_access table to use the new enum
ALTER TABLE public.share_access 
ALTER COLUMN mode TYPE share_access_mode USING mode::text::share_access_mode;

-- Add access requests table for managing pending requests
CREATE TABLE IF NOT EXISTS public.share_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID NOT NULL REFERENCES public.shares(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL,
    requester_email TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    UNIQUE(share_id, requester_id)
);

-- Enable RLS on share_access_requests
ALTER TABLE public.share_access_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for share_access_requests
CREATE POLICY "Share owners can manage access requests"
ON public.share_access_requests
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.shares s 
        WHERE s.id = share_access_requests.share_id 
        AND s.user_id = auth.uid()
    )
);

CREATE POLICY "Users can view their own requests"
ON public.share_access_requests
FOR SELECT
USING (requester_id = auth.uid());

CREATE POLICY "Anyone can create access requests"
ON public.share_access_requests
FOR INSERT
WITH CHECK (true);

-- Add trigger for updating timestamps
CREATE TRIGGER update_share_access_requests_updated_at
    BEFORE UPDATE ON public.share_access_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add notification system for access requests (optional)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR ALL
USING (auth.uid() = user_id);

-- Update shares table to support access control mode
ALTER TABLE public.shares 
ADD COLUMN IF NOT EXISTS access_mode TEXT DEFAULT 'open' CHECK (access_mode IN ('open', 'restricted', 'private'));

COMMENT ON COLUMN public.shares.access_mode IS 'open: anyone can view, restricted: whitelist/blacklist, private: approval required';