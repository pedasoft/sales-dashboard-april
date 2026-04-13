create extension if not exists "pgcrypto";

create type manager_type_enum as enum ('sales', 'product');
create type product_enum as enum ('bEAM', 'bEAM Cloud', 'QDMS', 'Synergy CSP', 'eBA Plus', 'Ensemble');
create type theme_enum as enum ('mavi', 'yesil', 'kirmizimsi', 'gradyen', 'gece', 'gunduz');

create table if not exists sales_managers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint sales_managers_name_len check (char_length(name) <= 50)
);

create table if not exists product_managers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint product_managers_name_len check (char_length(name) <= 50)
);

create table if not exists targets (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null,
  manager_type manager_type_enum not null,
  manager_id uuid not null,
  target_amount numeric not null,
  created_at timestamptz not null default now(),
  constraint targets_month_range check (month between 1 and 12),
  constraint targets_target_non_negative check (target_amount >= 0),
  constraint targets_unique_key unique (year, month, manager_type, manager_id)
);

create index if not exists idx_targets_manager_year_month on targets (manager_type, manager_id, year, month);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_date date not null,
  customer_name text not null,
  product product_enum not null,
  amount numeric not null,
  sales_manager_id uuid not null references sales_managers(id) on update cascade,
  product_manager_id uuid not null references product_managers(id) on update cascade,
  notes text,
  created_at timestamptz not null default now(),
  constraint invoices_customer_name_len check (char_length(customer_name) <= 50),
  constraint invoices_amount_non_negative check (amount >= 0)
);

create index if not exists idx_invoices_invoice_date on invoices (invoice_date);
create index if not exists idx_invoices_sales_manager on invoices (sales_manager_id);
create index if not exists idx_invoices_product_manager on invoices (product_manager_id);
create index if not exists idx_invoices_date_sales on invoices (invoice_date, sales_manager_id);
create index if not exists idx_invoices_date_product on invoices (invoice_date, product_manager_id);

create table if not exists coefficients (
  id uuid primary key default gen_random_uuid(),
  manager_type manager_type_enum not null,
  manager_id uuid not null,
  coefficient numeric not null,
  created_at timestamptz not null default now(),
  constraint coefficients_value_range check (coefficient >= 0 and coefficient <= 1),
  constraint coefficients_unique_key unique (manager_type, manager_id)
);

create table if not exists commissions (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null,
  manager_type manager_type_enum not null,
  manager_id uuid not null,
  base_amount numeric not null,
  multiplier numeric not null default 1,
  extra_amount numeric not null default 0,
  total_amount numeric not null,
  created_at timestamptz not null default now(),
  constraint commissions_month_range check (month between 1 and 12)
);

create index if not exists idx_commissions_year_month_manager on commissions (year, month, manager_type, manager_id);

create table if not exists ui_settings (
  id uuid primary key default gen_random_uuid(),
  theme theme_enum not null,
  created_at timestamptz not null default now()
);

create or replace function validate_manager_reference(input_manager_type manager_type_enum, input_manager_id uuid)
returns boolean
language plpgsql
as $$
begin
  if input_manager_type = 'sales' then
    return exists (select 1 from sales_managers where id = input_manager_id);
  end if;

  if input_manager_type = 'product' then
    return exists (select 1 from product_managers where id = input_manager_id);
  end if;

  return false;
end;
$$;

create or replace function trg_validate_targets_manager()
returns trigger
language plpgsql
as $$
begin
  if not validate_manager_reference(new.manager_type, new.manager_id) then
    raise exception 'Invalid manager reference for targets';
  end if;
  return new;
end;
$$;

create or replace function trg_validate_coefficients_manager()
returns trigger
language plpgsql
as $$
begin
  if not validate_manager_reference(new.manager_type, new.manager_id) then
    raise exception 'Invalid manager reference for coefficients';
  end if;
  return new;
end;
$$;

create or replace function trg_validate_commissions_manager()
returns trigger
language plpgsql
as $$
begin
  if not validate_manager_reference(new.manager_type, new.manager_id) then
    raise exception 'Invalid manager reference for commissions';
  end if;
  return new;
end;
$$;

drop trigger if exists before_targets_validate_manager on targets;
create trigger before_targets_validate_manager
before insert or update on targets
for each row
execute function trg_validate_targets_manager();

drop trigger if exists before_coefficients_validate_manager on coefficients;
create trigger before_coefficients_validate_manager
before insert or update on coefficients
for each row
execute function trg_validate_coefficients_manager();

drop trigger if exists before_commissions_validate_manager on commissions;
create trigger before_commissions_validate_manager
before insert or update on commissions
for each row
execute function trg_validate_commissions_manager();

insert into ui_settings (theme)
select 'mavi'::theme_enum
where not exists (select 1 from ui_settings);

alter table sales_managers disable row level security;
alter table product_managers disable row level security;
alter table targets disable row level security;
alter table invoices disable row level security;
alter table coefficients disable row level security;
alter table commissions disable row level security;
alter table ui_settings disable row level security;
