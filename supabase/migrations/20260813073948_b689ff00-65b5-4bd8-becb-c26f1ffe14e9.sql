
create or replace function public.url_decode(input text) returns text
language plpgsql immutable set search_path = public as $$
declare bin bytea = ''; byte text;
begin
  for byte in (select (regexp_matches(input, '(%..|.)', 'g'))[1]) loop
    if length(byte) = 3 then bin = bin || decode(substring(byte,2,2), 'hex');
    else bin = bin || byte::bytea; end if;
  end loop;
  return convert_from(bin, 'utf8');
exception when others then return input;
end $$;

create temp table lead_map on commit drop as
select id,
       created_at,
       ai_enriched_at,
       regexp_replace(split_part(public.url_decode((regexp_match(url, '[?&]url=([^&]+)'))[1]), '#', 1), '/$', '') as real_url
from public.article_leads
where url ilike '%bing.com/news/apiclick%' and url ~ '[?&]url=';

delete from lead_map where real_url is null or real_url not like 'http%';

-- drop redirect rows whose target already exists as a direct row
delete from public.article_leads a
using lead_map m
where a.id = m.id
  and a.is_approved = false
  and exists (select 1 from public.article_leads b where b.url = m.real_url);
delete from lead_map m where not exists (select 1 from public.article_leads a where a.id = m.id);

-- keep one redirect row per target url
delete from public.article_leads a
using lead_map m, lead_map k
where a.id = m.id
  and a.is_approved = false
  and k.real_url = m.real_url
  and k.id <> m.id
  and ( (k.ai_enriched_at is not null and m.ai_enriched_at is null)
     or (((k.ai_enriched_at is null) = (m.ai_enriched_at is null)) and k.created_at < m.created_at)
     or (((k.ai_enriched_at is null) = (m.ai_enriched_at is null)) and k.created_at = m.created_at and k.id < m.id) );
delete from lead_map m where not exists (select 1 from public.article_leads a where a.id = m.id);

update public.article_leads a
set url = m.real_url,
    outlet = regexp_replace(split_part(split_part(regexp_replace(m.real_url,'^https?://',''), '/', 1), ':', 1), '^www\.', '')
from lead_map m
where a.id = m.id;

-- collapse remaining duplicates with the same title from the same outlet
delete from public.article_leads a
using public.article_leads b
where a.is_approved = false
  and lower(a.title) = lower(b.title)
  and coalesce(a.outlet,'') = coalesce(b.outlet,'')
  and a.id <> b.id
  and (b.created_at < a.created_at or (b.created_at = a.created_at and b.id < a.id));

drop function public.url_decode(text);
