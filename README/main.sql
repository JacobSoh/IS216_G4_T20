-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
CREATE TABLE public.profile (
  id uuid NOT NULL DEFAULT auth.uid(),
  first_name character varying,
  middle_name character varying,
  last_name character varying,
  address character varying,
  username character varying NOT NULL UNIQUE,
  avatar_bucket text DEFAULT 'avatar'::text,
  object_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  wallet_balance numeric DEFAULT 0.00 CHECK (wallet_balance >= 0::numeric),
  wallet_held numeric DEFAULT 0.00 CHECK (wallet_held >= 0::numeric),
  verified boolean DEFAULT false,
  CONSTRAINT profile_pkey PRIMARY KEY (id),
  CONSTRAINT profile_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.auction (
  aid uuid NOT NULL DEFAULT gen_random_uuid(),
  oid uuid NOT NULL,
  name text NOT NULL,
  start_time timestamp with time zone NOT NULL,
  description text,
  thumbnail_bucket text NOT NULL DEFAULT 'thumbnail'::text,
  object_path text NOT NULL,
  time_interval integer NOT NULL,
  timer_started_at timestamp with time zone,
  timer_duration_seconds integer,
  auction_end boolean NOT NULL DEFAULT false,
  CONSTRAINT auction_pkey PRIMARY KEY (aid),
  CONSTRAINT auction_oid_fkey FOREIGN KEY (oid) REFERENCES public.profile(id)
);
CREATE TABLE public.auction_chat (
  chat_id uuid NOT NULL DEFAULT gen_random_uuid(),
  aid uuid NOT NULL,
  uid uuid NOT NULL,
  message text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT auction_chat_pkey PRIMARY KEY (chat_id),
  CONSTRAINT auction_chat_aid_fkey FOREIGN KEY (aid) REFERENCES public.auction(aid),
  CONSTRAINT auction_chat_uid_fkey FOREIGN KEY (uid) REFERENCES public.profile(id)
);
CREATE TABLE public.item (
  iid uuid NOT NULL DEFAULT gen_random_uuid(),
  aid uuid,
  oid uuid NOT NULL,
  min_bid numeric NOT NULL CHECK (min_bid >= 0::numeric),
  title character varying NOT NULL,
  description character varying NOT NULL,
  item_bucket text NOT NULL DEFAULT 'item'::text,
  object_path text NOT NULL,
  bid_increment integer,
  sold boolean NOT NULL DEFAULT false,
  CONSTRAINT item_pkey PRIMARY KEY (iid),
  CONSTRAINT item_oid_fkey FOREIGN KEY (oid) REFERENCES public.profile(id),
  CONSTRAINT item_aid_fkey FOREIGN KEY (aid) REFERENCES public.auction(aid)
);
CREATE TABLE public.bid_history (
  bid_id uuid NOT NULL DEFAULT gen_random_uuid(),
  iid uuid NOT NULL,
  aid uuid NOT NULL,
  uid uuid NOT NULL,
  oid uuid NOT NULL,
  bid_amount numeric NOT NULL CHECK (bid_amount >= 0::numeric),
  bid_datetime timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bid_history_pkey PRIMARY KEY (bid_id),
  CONSTRAINT bid_history_iid_fkey FOREIGN KEY (iid) REFERENCES public.item(iid),
  CONSTRAINT bid_history_aid_fkey FOREIGN KEY (aid) REFERENCES public.auction(aid),
  CONSTRAINT bid_history_uid_fkey FOREIGN KEY (uid) REFERENCES public.profile(id),
  CONSTRAINT bid_history_oid_fkey FOREIGN KEY (oid) REFERENCES public.profile(id)
);
CREATE TABLE public.category (
  category_name text NOT NULL UNIQUE,
  description text,
  poop_bucket text,
  object_path text,
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  CONSTRAINT category_pkey PRIMARY KEY (category_name)
);
CREATE TABLE public.wallet_transaction (
  tid uuid NOT NULL DEFAULT gen_random_uuid(),
  uid uuid NOT NULL,
  transaction_type character varying NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  reference_id text,
  related_item_id uuid,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT wallet_transaction_pkey PRIMARY KEY (tid),
  CONSTRAINT wallet_transaction_uid_fkey FOREIGN KEY (uid) REFERENCES public.profile(id),
  CONSTRAINT wallet_transaction_related_item_id_fkey FOREIGN KEY (related_item_id) REFERENCES public.item(iid)
);
CREATE TABLE public.current_bid (
  bid_datetime timestamp with time zone NOT NULL,
  current_price numeric NOT NULL CHECK (current_price >= 0::numeric),
  oid uuid DEFAULT gen_random_uuid(),
  uid uuid,
  aid uuid,
  iid uuid NOT NULL,
  funds_held boolean DEFAULT false,
  hold_transaction_id uuid,
  CONSTRAINT current_bid_pkey PRIMARY KEY (iid),
  CONSTRAINT current_bid_oid_fkey FOREIGN KEY (oid) REFERENCES public.profile(id),
  CONSTRAINT current_bid_uid_fkey FOREIGN KEY (uid) REFERENCES public.profile(id),
  CONSTRAINT current_bid_aid_fkey FOREIGN KEY (aid) REFERENCES public.auction(aid),
  CONSTRAINT current_bid_iid_fkey FOREIGN KEY (iid) REFERENCES public.item(iid),
  CONSTRAINT current_bid_hold_transaction_id_fkey FOREIGN KEY (hold_transaction_id) REFERENCES public.wallet_transaction(tid)
);
CREATE TABLE public.dashboard (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  oid uuid NOT NULL,
  title text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dashboard_pkey PRIMARY KEY (id),
  CONSTRAINT dashboard_oid_fkey FOREIGN KEY (oid) REFERENCES auth.users(id)
);
CREATE TABLE public.enquiry (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text DEFAULT ''::text,
  email text DEFAULT ''::text,
  subject text,
  message text,
  Resolved boolean DEFAULT false,
  CONSTRAINT enquiry_pkey PRIMARY KEY (id)
);
CREATE TABLE public.item_category (
  itemid uuid NOT NULL,
  category_name character varying NOT NULL,
  CONSTRAINT fk_item FOREIGN KEY (itemid) REFERENCES public.item(iid),
  CONSTRAINT fk_category FOREIGN KEY (category_name) REFERENCES public.category(category_name)
);
CREATE TABLE public.items_sold (
  sid uuid NOT NULL DEFAULT gen_random_uuid(),
  iid uuid NOT NULL UNIQUE,
  aid uuid,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  final_price numeric NOT NULL CHECK (final_price >= 0::numeric),
  sold_at timestamp with time zone NOT NULL DEFAULT now(),
  payment_transaction_id uuid,
  CONSTRAINT items_sold_pkey PRIMARY KEY (sid),
  CONSTRAINT items_sold_iid_fkey FOREIGN KEY (iid) REFERENCES public.item(iid),
  CONSTRAINT items_sold_buyer_fkey FOREIGN KEY (buyer_id) REFERENCES public.profile(id),
  CONSTRAINT items_sold_seller_fkey FOREIGN KEY (seller_id) REFERENCES public.profile(id),
  CONSTRAINT items_sold_payment_tx_fkey FOREIGN KEY (payment_transaction_id) REFERENCES public.wallet_transaction(tid),
  CONSTRAINT items_sold_aid_fkey FOREIGN KEY (aid) REFERENCES public.auction(aid)
);
CREATE TABLE public.persona (
  id text NOT NULL,
  oid uuid NOT NULL,
  status character varying NOT NULL DEFAULT 'created'::character varying,
  decision character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT persona_pkey PRIMARY KEY (id),
  CONSTRAINT persona_oid_fkey FOREIGN KEY (oid) REFERENCES auth.users(id)
);
CREATE TABLE public.review (
  reviewee_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  time_created timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
  review text NOT NULL,
  stars smallint NOT NULL CHECK (stars >= 1 AND stars <= 5),
  CONSTRAINT review_pkey PRIMARY KEY (reviewer_id, time_created, reviewee_id),
  CONSTRAINT review_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public.profile(id),
  CONSTRAINT review_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profile(id)
);

CREATE OR REPLACE FUNCTION public.add_to_wallet(user_id uuid, add_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE profile
    SET wallet_balance = wallet_balance + add_amount
    WHERE id = user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auth_user_exists(p_email text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(p_email)
  );
$function$;

CREATE OR REPLACE FUNCTION public.hold_bid_funds(user_id uuid, hold_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
    available_balance numeric;
BEGIN
    -- Get current available balance
    SELECT wallet_balance INTO available_balance
    FROM profile
    WHERE id = user_id;
    
    -- Check if sufficient funds
    IF available_balance >= hold_amount THEN
        -- Move funds from available to held
        UPDATE profile
        SET wallet_balance = wallet_balance - hold_amount,
            wallet_held = wallet_held + hold_amount
        WHERE id = user_id;
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.insert_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$begin
  insert into public.profile (id, username, avatar_bucket)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'username', ''),
    'avatar'
  )
  on conflict (id) do nothing;

  return new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_withdrawal(user_id uuid, withdrawal_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
    available_balance numeric;
BEGIN
    SELECT wallet_balance INTO available_balance
    FROM profile
    WHERE id = user_id;
    
    IF available_balance >= withdrawal_amount THEN
        UPDATE profile
        SET wallet_balance = wallet_balance - withdrawal_amount
        WHERE id = user_id;
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.release_held_funds(user_id uuid, release_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE profile
    SET wallet_balance = wallet_balance + release_amount,
        wallet_held = wallet_held - release_amount
    WHERE id = user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.review_stats(p_reviewee uuid)
 RETURNS TABLE(total integer, total_stars numeric, avg_rating numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select
    count(*)                                        as total,
    coalesce(sum(stars)::numeric, 0)               as total_stars,
    coalesce(avg(stars)::numeric, 0)               as avg_rating
  from public.review
  where reviewee_id = p_reviewee
$function$;

CREATE OR REPLACE FUNCTION public.transfer_to_seller(buyer_id uuid, seller_id uuid, transfer_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Deduct from buyer's held funds
    UPDATE profile
    SET wallet_held = wallet_held - transfer_amount
    WHERE id = buyer_id;
    
    -- Add to seller's available balance
    UPDATE profile
    SET wallet_balance = wallet_balance + transfer_amount
    WHERE id = seller_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upd_profile_last_updated()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  NEW.updated_at := now();
  return NEW;
end;
$function$;

CREATE TRIGGER auth_insert_trigger AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION insert_new_user();