-- Projects table
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Todos/Tasks table
create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade not null,
  title text not null,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  source text default 'manual' check (source in ('manual', 'image', 'coach')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Conversations table (for coach chat history)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_todos_project_id on todos(project_id);
create index if not exists idx_todos_user_id on todos(user_id);
create index if not exists idx_todos_status on todos(status);
create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_conversations_user_id on conversations(user_id);

-- Enable Row Level Security
alter table projects enable row level security;
alter table todos enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- RLS Policies for projects
create policy "Users can view their own projects"
  on projects for select
  using (auth.uid() = user_id or user_id is null);

create policy "Users can create their own projects"
  on projects for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can update their own projects"
  on projects for update
  using (auth.uid() = user_id or user_id is null);

create policy "Users can delete their own projects"
  on projects for delete
  using (auth.uid() = user_id or user_id is null);

-- RLS Policies for todos
create policy "Users can view their own todos"
  on todos for select
  using (auth.uid() = user_id or user_id is null);

create policy "Users can create their own todos"
  on todos for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can update their own todos"
  on todos for update
  using (auth.uid() = user_id or user_id is null);

create policy "Users can delete their own todos"
  on todos for delete
  using (auth.uid() = user_id or user_id is null);

-- RLS Policies for conversations
create policy "Users can view their own conversations"
  on conversations for select
  using (auth.uid() = user_id or user_id is null);

create policy "Users can create their own conversations"
  on conversations for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can update their own conversations"
  on conversations for update
  using (auth.uid() = user_id or user_id is null);

create policy "Users can delete their own conversations"
  on conversations for delete
  using (auth.uid() = user_id or user_id is null);

-- RLS Policies for messages
create policy "Users can view messages in their conversations"
  on messages for select
  using (
    conversation_id in (
      select id from conversations where user_id = auth.uid() or user_id is null
    )
  );

create policy "Users can create messages in their conversations"
  on messages for insert
  with check (
    conversation_id in (
      select id from conversations where user_id = auth.uid() or user_id is null
    )
  );

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

create trigger todos_updated_at
  before update on todos
  for each row execute function update_updated_at();

create trigger conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at();
