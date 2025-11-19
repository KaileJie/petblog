export type Subscription = {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  price_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionInsert = {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  price_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string | null;
  trial_start?: string | null;
  trial_end?: string | null;
};

export type SubscriptionUpdate = {
  status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string | null;
  trial_start?: string | null;
  trial_end?: string | null;
};

