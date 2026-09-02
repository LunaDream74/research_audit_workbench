begin;
select plan(5);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'importer@example.test', crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'outsider@example.test', crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now());

set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select throws_ok(
  $$select public.confirm_prepared_import('{"digest":"actual","proposed_runs":[]}'::jsonb, 'bad.zip', 'changed')$$,
  '22023',
  'preview digest mismatch',
  'confirmation rejects a changed digest'
);

select lives_ok(
  $$select public.confirm_prepared_import(
    '{
      "digest":"prepared-digest",
      "files":[{"path":"run-a/metrics.json"}],
      "warnings":[],
      "audit_readiness":{"status":"ready"},
      "proposed_experiment":{"name":"Prepared comparison","description":"test"},
      "proposed_runs":[
        {"id":"run-a","name":"Run A","metric_name":"Recall@5","metric_value":0.84,"declared_candidate_count":200,"recorded_candidate_count":200,"evaluation_split":"test-v1","preprocessing":null,"metric_definition":"Recall@5","source_hashes":{}},
        {"id":"run-b","name":"Run B","metric_name":"Recall@5","metric_value":0.76,"declared_candidate_count":1000,"recorded_candidate_count":1000,"evaluation_split":"test-v1","preprocessing":null,"metric_definition":"Recall@5","source_hashes":{}}
      ],
      "proposed_artifacts":[
        {"path":"run-a/metrics.json","sha256":"sha256:a","kind":"json","run_id":"run-a"},
        {"path":"run-b/metrics.json","sha256":"sha256:b","kind":"json","run_id":"run-b"}
      ]
    }'::jsonb,
    'prepared.zip',
    'prepared-digest'
  )$$,
  'owner can atomically confirm a matching preview'
);

select is((select count(*)::integer from public.import_attempts), 1, 'one confirmed import is visible');
select is((select count(*)::integer from public.runs), 2, 'both prepared runs are persisted');

set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';
select is((select count(*)::integer from public.import_attempts), 0, 'another user cannot see the confirmed import');

select * from finish();
rollback;
