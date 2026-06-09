create table public.community_reply_reactions (
  id uuid primary key default gen_random_uuid(),
  reply_id uuid not null references public.community_replies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('funcionou','vou_tentar','nao_funcionou')),
  created_at timestamptz not null default now(),
  unique (reply_id, user_id)
);

create index idx_community_reply_reactions_reply on public.community_reply_reactions(reply_id);
create index idx_community_reply_reactions_user on public.community_reply_reactions(user_id);

alter table public.community_reply_reactions enable row level security;

create policy "Reactions are visible to authenticated"
  on public.community_reply_reactions for select
  to authenticated using (true);

create policy "Users insert own reaction"
  on public.community_reply_reactions for insert
  to authenticated with check (auth.uid() = user_id);

create policy "Users delete own reaction"
  on public.community_reply_reactions for delete
  to authenticated using (auth.uid() = user_id);