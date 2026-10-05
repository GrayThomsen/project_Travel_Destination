-- Dette er en SQL-fil som definerer databasen for en reiseplanleggings applikation. Den oppretter to tabeller: "users" og "travel_destinations", med nødvendige kolonner, begrensninger og indekser.
-- Dette er du kan oprette en tilsvarende service som min i en service som SupaBase eller ligenende. Denne kode er genereret med AI, så hvis du møder udfordringer, så skriv til mig, så kan jeg hjælpe dig med at løse dem.

create table
    if not exists public.users (
        id uuid primary key default gen_random_uuid (),
        username text not null unique check (char_length(username) between 3 and 50),
        password_hash text not null,
        created_at timestamptz not null default now ()
    );

create table
    if not exists public.travel_destinations (
        id uuid primary key default gen_random_uuid (),
        user_id uuid not null references public.users (id) on delete cascade,
        location text not null,
        travel_time_from date not null,
        travel_time_to date not null,
        description text not null default '',
        created_at timestamptz not null default now (),
        constraint travel_dates_in_order check (travel_time_to >= travel_time_from)
    );

create index if not exists travel_destinations_user_id_idx on public.travel_destinations (user_id);

alter table public.users enable row level security;

alter table public.travel_destinations enable row level security;