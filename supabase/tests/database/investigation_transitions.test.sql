begin;
select plan(12);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'decision-owner@example.test', crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated', 'decision-outsider@example.test', crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now());

set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';

insert into public.experiments (id, owner_id, name) values
  ('55555555-0000-0000-0000-000000000001', auth.uid(), 'Decision evidence');
insert into public.runs (id, owner_id, experiment_id, name) values
  ('55555555-0000-0000-0000-000000000011', auth.uid(), '55555555-0000-0000-0000-000000000001', 'Run A'),
  ('55555555-0000-0000-0000-000000000012', auth.uid(), '55555555-0000-0000-0000-000000000001', 'Run B');

select lives_ok(
  $$select public.create_investigation_from_finding(
    '55555555-0000-0000-0000-000000000011', '55555555-0000-0000-0000-000000000012',
    'Does A justify another run?', 'selection-owned-pair', '{"finding":"temporary audit"}', '{"title":"Different conditions"}'
  )$$,
  'owner can confirm the first finding transactionally'
);
select is((select count(*)::integer from public.investigations), 1, 'one investigation is durable');

select throws_ok(
  $$select public.confirm_investigation_challenge(
    (select id from public.investigations limit 1), 0,
    '{"researcherContext":"intentional sanity check","retainedLimitation":"not directly comparable"}'
  )$$,
  '40001', 'stale analysis revision', 'stale challenge revision is rejected'
);
select lives_ok(
  $$select public.confirm_investigation_challenge(
    (select id from public.investigations limit 1), 1,
    '{"researcherContext":"intentional sanity check","retainedLimitation":"not directly comparable"}'
  )$$,
  'current challenge creates revision two'
);
select lives_ok(
  $$select public.save_investigation_plan(
    (select id from public.investigations limit 1), 2,
    '{"version":1,"candidatePoolA":1000,"candidatePoolB":1000}',
    '{"limitations":[]}', repeat('a', 64)
  )$$,
  'validated draft is versioned and saved'
);
select throws_ok(
  $$select public.approve_investigation_plan(
    (select id from public.investigations limit 1), 1, repeat('b', 64),
    'approved', 'matched protocol', null
  )$$,
  '40001', 'stale plan version or digest', 'stale digest is rejected'
);
select lives_ok(
  $$select public.approve_investigation_plan(
    (select id from public.investigations limit 1), 1, repeat('a', 64),
    'approved', 'matched protocol', null
  )$$,
  'exact draft can be approved'
);
select throws_ok(
  $$update public.plan_versions set body = '{"changed":true}' where version = 1$$,
  'approved plan versions are immutable',
  'approved plan content cannot be changed'
);
select lives_ok(
  $$select public.save_investigation_plan(
    (select id from public.investigations limit 1), 2,
    '{"version":1,"candidatePoolA":1000,"candidatePoolB":1000,"batchSize":16}',
    '{"limitations":[]}', repeat('c', 64)
  )$$,
  'editing after approval creates a new draft'
);
select is((select max(version) from public.plan_versions), 2, 'approved content is preserved as version one');
select throws_ok(
  $$update public.investigation_events set payload = '{}'::jsonb$$,
  '42501',
  'permission denied for table investigation_events',
  'event history is append-only to authenticated users'
);

set local request.jwt.claims = '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated"}';
select is((select count(*)::integer from public.investigations), 0, 'outsider cannot read the decision record');

select * from finish();
rollback;
