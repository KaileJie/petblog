-- Create subscriptions table
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stripe_customer_id text unique not null,
  stripe_subscription_id text unique not null,
  status text not null check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  price_id text not null,
  current_period_start timestamp with time zone not null,
  current_period_end timestamp with time zone not null,
  cancel_at_period_end boolean default false,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.subscriptions is 'Stripe subscription records linked to user profiles';

-- Enable Row Level Security
alter table public.subscriptions enable row level security;

-- Create policy: Users can view their own subscription
create policy "Users can view own subscription"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Create policy: Service role can manage all subscriptions (for webhooks)
create policy "Service role can manage subscriptions"
  on public.subscriptions
  for all
  to service_role
  using (true)
  with check (true);

-- Create indexes for faster queries
create index if not exists idx_subscriptions_user_id 
on public.subscriptions(user_id);

create index if not exists idx_subscriptions_stripe_customer_id 
on public.subscriptions(stripe_customer_id);

create index if not exists idx_subscriptions_stripe_subscription_id 
on public.subscriptions(stripe_subscription_id);

create index if not exists idx_subscriptions_status 
on public.subscriptions(status);

-- Create function to update updated_at timestamp
create or replace function public.handle_subscription_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Create trigger to update updated_at on subscription update
create trigger on_subscription_updated
  before update on public.subscriptions
  for each row
  execute function public.handle_subscription_updated_at();

