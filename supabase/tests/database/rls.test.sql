begin;
select plan(9);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'owner@example.test', crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'other@example.test', crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now());

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into public.experiments (id, name) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Owner experiment');
select is((select count(*)::integer from public.experiments), 1, 'owner sees own experiment');
select throws_ok(
  $$insert into public.experiments (owner_id, name) values ('22222222-2222-2222-2222-222222222222', 'forged')$$,
  '42501',
  'new row violates row-level security policy for table "experiments"',
  'owner cannot forge another owner id'
);

insert into public.runs (id, experiment_id, name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Run A'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Run B');

select throws_ok(
  $$insert into public.investigations (run_a_id, run_b_id, question) values ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'same run')$$,
  '23514',
  null,
  'investigation rejects the same run twice'
);

insert into public.investigations (id, run_a_id, run_b_id, question)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'fair comparison?');

insert into public.plan_versions (id, investigation_id, version, body, digest)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, '{"batch_size":16}', 'digest-v1');

update public.plan_versions set status = 'approved', approved_at = now(), approved_by = '11111111-1111-1111-1111-111111111111'
where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

select throws_ok(
  $$update public.plan_versions set body = '{"batch_size":32}' where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'$$,
  'P0001',
  'approved plan versions are immutable',
  'approved plan cannot be edited'
);

select throws_ok(
  $$delete from public.plan_versions where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'$$,
  'P0001',
  'approved plan versions are immutable',
  'approved plan cannot be deleted'
);

set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is((select count(*)::integer from public.experiments), 0, 'other user cannot see owner experiment');
select is((select count(*)::integer from public.runs), 0, 'other user cannot see owner runs');
select is((select count(*)::integer from public.investigations), 0, 'other user cannot see owner investigation');
select is((select count(*)::integer from public.plan_versions), 0, 'other user cannot see owner plan');

select * from finish();
rollback;
