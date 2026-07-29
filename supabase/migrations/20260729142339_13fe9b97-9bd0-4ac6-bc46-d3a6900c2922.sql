-- 1. New enum types.
do $$ begin
  create type public.symbol_visibility_status as enum ('private','public','hidden');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.symbol_moderation_status as enum ('unreviewed','reviewed','denied','reported');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.symbol_evidence_status as enum ('raw','eligible','ineligible','candidate_match','reviewed_convergence','controlled_replication');
exception when duplicate_object then null; end $$;

-- 2. New columns.
alter table public.symbol_submissions
  add column if not exists visibility_status  public.symbol_visibility_status not null default 'public',
  add column if not exists moderation_status  public.symbol_moderation_status not null default 'unreviewed',
  add column if not exists evidence_status    public.symbol_evidence_status   not null default 'raw',
  add column if not exists published_at       timestamptz,
  add column if not exists review_due_at      timestamptz,
  add column if not exists is_curated_example boolean not null default false;

-- 3. Column documentation.
comment on column public.symbol_submissions.visibility_status is 'Who can see this row. private = only the author. public = published and readable by anyone. hidden = withdrawn from public view but never deleted.';

comment on column public.symbol_submissions.moderation_status is 'What a human moderator has actually done. unreviewed = nobody has looked at it yet. reviewed = a moderator looked and let it stand. denied = a moderator rejected it. reported = a reader flagged it and it awaits a decision. There is deliberately no stored overdue value. Overdue is derived as moderation_status = unreviewed and review_due_at < now(), so it can never go stale.';

comment on column public.symbol_submissions.evidence_status is 'How this row may be used as evidence. raw = an observer report with nothing established about it. eligible = meets the criteria to enter convergence analysis. ineligible = excluded from convergence analysis, for example a curated example that is not an observer submission. candidate_match = resembles another record and awaits assessment. reviewed_convergence = a reviewer has assessed the match. controlled_replication = arose from a controlled, blinded protocol. Being published does not change this field.';

comment on column public.symbol_submissions.published_at is 'When the row first became publicly visible. Null means it has never been public. Never backfilled with a guess.';

comment on column public.symbol_submissions.review_due_at is 'published_at plus 72 hours. The deadline by which a moderator was meant to look at it. Null where no review clock applies.';

comment on column public.symbol_submissions.is_curated_example is 'True for illustrative examples added by the site operator. These are not observer submissions and are excluded from evidence and convergence totals.';

comment on column public.symbol_submissions.status is 'LEGACY. Kept because row level security policies and existing queries depend on it. It is now kept in sync with visibility_status by the sync_symbol_submission_status trigger. New code should read visibility_status, moderation_status and evidence_status instead.';

-- 4. Backfill, by explicit row id.
update public.symbol_submissions set
  visibility_status  = 'public',
  moderation_status  = 'reviewed',
  evidence_status    = 'ineligible',
  is_curated_example = true,
  published_at       = created_at,
  review_due_at      = null
where id in (
  'b7c17e05-fd50-4946-93ce-3f4c98567678',
  '496025a2-1735-42d0-8069-b1b86c2b10df',
  '9ed7c4e9-9577-445c-8d49-be7a80cb3bd2',
  '8a8414f4-006e-426d-b5b5-544ba8136fcf',
  '82b9c679-fca0-43c6-89b0-9ade52847468'
);

update public.symbol_submissions set
  visibility_status  = 'public',
  moderation_status  = 'unreviewed',
  evidence_status    = 'raw',
  is_curated_example = false,
  published_at       = created_at,
  review_due_at      = created_at + interval '72 hours'
where id = '67245a6e-f350-4248-b50f-74195c4798f3';

-- 5. Two way sync with the legacy status column.
create or replace function public.sync_symbol_submission_status()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if TG_OP = 'INSERT' then
    if NEW.status = 'approved' then
      NEW.visibility_status := 'public';
    elsif NEW.status = 'rejected' then
      NEW.visibility_status := 'hidden';
    else
      NEW.visibility_status := 'private';
    end if;
  else
    if NEW.visibility_status is distinct from OLD.visibility_status then
      if NEW.visibility_status = 'public' then
        NEW.status := 'approved';
      elsif NEW.visibility_status = 'hidden' then
        NEW.status := 'rejected';
      else
        NEW.status := 'pending';
      end if;
    elsif NEW.status is distinct from OLD.status then
      if NEW.status = 'approved' then
        NEW.visibility_status := 'public';
      elsif NEW.status = 'rejected' then
        NEW.visibility_status := 'hidden';
      else
        NEW.visibility_status := 'private';
      end if;
    end if;

    if NEW.status = 'rejected'
       and OLD.status is distinct from NEW.status
       and NEW.moderation_status is not distinct from OLD.moderation_status then
      NEW.moderation_status := 'denied';
    end if;

    if NEW.moderated_at is not null
       and OLD.moderated_at is null
       and NEW.moderation_status = 'unreviewed' then
      NEW.moderation_status := 'reviewed';
    end if;
  end if;

  if NEW.visibility_status = 'public' and NEW.published_at is null then
    NEW.published_at := now();
    if not NEW.is_curated_example then
      NEW.review_due_at := now() + interval '72 hours';
    end if;
  end if;

  return NEW;
end;
$function$;

drop trigger if exists sync_symbol_submission_status_trg on public.symbol_submissions;
create trigger sync_symbol_submission_status_trg
  before insert or update on public.symbol_submissions
  for each row execute function public.sync_symbol_submission_status();