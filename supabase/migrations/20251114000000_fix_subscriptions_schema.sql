-- Migration: Ensure subscriptions table schema matches webhook expectations
-- This migration ensures all required fields exist and are properly configured

-- Verify all required columns exist (idempotent - won't fail if columns already exist)
DO $$ 
BEGIN
  -- Add columns if they don't exist (PostgreSQL doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN stripe_customer_id text UNIQUE NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN stripe_subscription_id text UNIQUE NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN status text NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'price_id'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN price_id text NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'current_period_start'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN current_period_start timestamp with time zone NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'current_period_end'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN current_period_end timestamp with time zone NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'cancel_at_period_end'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN cancel_at_period_end boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'canceled_at'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN canceled_at timestamp with time zone;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'trial_start'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN trial_start timestamp with time zone;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'trial_end'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN trial_end timestamp with time zone;
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate (ensures correct policy)
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure service role policy exists
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Ensure unique constraint on stripe_subscription_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscriptions_stripe_subscription_id_key'
  ) THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
  END IF;
END $$;

