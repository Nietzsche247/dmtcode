alter table public.follows drop constraint if exists follows_entity_type_check;

alter table public.follows
  add constraint follows_entity_type_check
  check (entity_type = any (array[
    'article'::text,'theory'::text,'protocol'::text,
    'retreat'::text,'event'::text,'trial'::text,'symbol'::text]));