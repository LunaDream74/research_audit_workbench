create or replace function public.confirm_prepared_import(
  preview jsonb,
  source_name text,
  expected_digest text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner uuid := auth.uid();
  import_id uuid;
  experiment_id uuid;
  run_record jsonb;
  artifact_record jsonb;
  run_id uuid;
  artifact_id uuid;
  run_ids jsonb := '{}'::jsonb;
begin
  if current_owner is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if coalesce(preview->>'digest', '') = '' or preview->>'digest' <> expected_digest then
    raise exception 'preview digest mismatch' using errcode = '22023';
  end if;
  if jsonb_array_length(coalesce(preview->'proposed_runs', '[]'::jsonb)) <> 2 then
    raise exception 'exactly two prepared runs are required' using errcode = '22023';
  end if;

  insert into public.import_attempts (
    owner_id, status, source_name, preview_digest, file_inventory, warnings, preview
  ) values (
    current_owner,
    'confirmed',
    source_name,
    expected_digest,
    coalesce(preview->'files', '[]'::jsonb),
    coalesce(preview->'warnings', '[]'::jsonb),
    preview
  ) returning id into import_id;

  insert into public.experiments (owner_id, import_attempt_id, name, description)
  values (
    current_owner,
    import_id,
    coalesce(preview->'proposed_experiment'->>'name', 'Imported experiment'),
    coalesce(preview->'proposed_experiment'->>'description', '')
  ) returning id into experiment_id;

  for run_record in select value from jsonb_array_elements(preview->'proposed_runs')
  loop
    insert into public.runs (
      owner_id, experiment_id, name, metrics, config, readiness, source_snapshot
    ) values (
      current_owner,
      experiment_id,
      coalesce(run_record->>'name', run_record->>'id'),
      jsonb_build_object(
        'name', run_record->>'metric_name',
        'value', (run_record->>'metric_value')::numeric
      ),
      jsonb_build_object(
        'declared_candidate_count', run_record->'declared_candidate_count',
        'evaluation_split', run_record->'evaluation_split',
        'preprocessing', run_record->'preprocessing',
        'metric_definition', run_record->'metric_definition'
      ),
      coalesce(preview->'audit_readiness', '{}'::jsonb),
      run_record
    ) returning id into run_id;
    run_ids := run_ids || jsonb_build_object(run_record->>'id', run_id::text);
  end loop;

  for artifact_record in select value from jsonb_array_elements(preview->'proposed_artifacts')
  loop
    insert into public.artifacts (
      owner_id, kind, external_path, sha256, metadata
    ) values (
      current_owner,
      coalesce(artifact_record->>'kind', 'unknown'),
      'import://' || expected_digest || '/' || (artifact_record->>'path'),
      artifact_record->>'sha256',
      jsonb_build_object(
        'path', artifact_record->>'path',
        'prepared_run_id', artifact_record->'run_id'
      )
    ) returning id into artifact_id;

    if artifact_record->>'run_id' is not null and run_ids ? (artifact_record->>'run_id') then
      insert into public.run_artifacts (
        owner_id, run_id, artifact_id, role, source_relation
      ) values (
        current_owner,
        (run_ids->>(artifact_record->>'run_id'))::uuid,
        artifact_id,
        coalesce(artifact_record->>'kind', 'evidence'),
        jsonb_build_object('path', artifact_record->>'path')
      );
    end if;
  end loop;

  return jsonb_build_object(
    'import_attempt_id', import_id,
    'experiment_id', experiment_id,
    'run_ids', run_ids
  );
end;
$$;

revoke all on function public.confirm_prepared_import(jsonb, text, text) from public;
grant execute on function public.confirm_prepared_import(jsonb, text, text) to authenticated;
