create or replace function public.create_investigation_from_finding(
  run_a uuid,
  run_b uuid,
  question text,
  selection_digest text,
  audit_result jsonb,
  finding_snapshot jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner uuid := auth.uid();
  investigation_id uuid;
  revision_id uuid;
begin
  if current_owner is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if run_a = run_b or length(trim(question)) = 0 or length(selection_digest) < 8 then
    raise exception 'invalid investigation intent' using errcode = '22023';
  end if;
  if (select count(*) from public.runs where owner_id = current_owner and id in (run_a, run_b)) <> 2 then
    raise exception 'owned run pair not found' using errcode = '42501';
  end if;

  insert into public.investigations (owner_id, run_a_id, run_b_id, question)
  values (current_owner, run_a, run_b, question)
  returning id into investigation_id;

  insert into public.analysis_revisions (
    owner_id, investigation_id, revision, selection_digest, status, result, finding_snapshot
  ) values (
    current_owner, investigation_id, 1, selection_digest, 'completed', audit_result, finding_snapshot
  ) returning id into revision_id;

  update public.investigations set active_analysis_revision_id = revision_id
  where id = investigation_id and owner_id = current_owner;

  insert into public.investigation_events (
    owner_id, investigation_id, event_type, actor_type, actor_id, payload
  ) values (
    current_owner, investigation_id, 'finding_confirmed', 'researcher', current_owner,
    jsonb_build_object('analysis_revision', 1, 'selection_digest', selection_digest)
  );

  return jsonb_build_object('investigation_id', investigation_id, 'analysis_revision', 1);
end;
$$;

create or replace function public.confirm_investigation_challenge(
  target_investigation uuid,
  expected_revision integer,
  challenge_preview jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner uuid := auth.uid();
  prior_revision public.analysis_revisions%rowtype;
  new_revision_id uuid;
begin
  select ar.* into prior_revision
  from public.investigations i
  join public.analysis_revisions ar on ar.id = i.active_analysis_revision_id and ar.owner_id = i.owner_id
  where i.id = target_investigation and i.owner_id = current_owner
  for update of i;
  if prior_revision.id is null then
    raise exception 'investigation not found' using errcode = '42501';
  end if;
  if prior_revision.revision <> expected_revision then
    raise exception 'stale analysis revision' using errcode = '40001';
  end if;
  if length(trim(coalesce(challenge_preview->>'researcherContext', ''))) = 0
     or length(trim(coalesce(challenge_preview->>'retainedLimitation', ''))) = 0 then
    raise exception 'challenge must retain researcher context and limitation' using errcode = '22023';
  end if;

  insert into public.analysis_revisions (
    owner_id, investigation_id, revision, selection_digest, status, result, finding_snapshot
  ) values (
    current_owner, target_investigation, expected_revision + 1,
    prior_revision.selection_digest, 'completed', prior_revision.result,
    prior_revision.finding_snapshot || jsonb_build_object('challenge', challenge_preview)
  ) returning id into new_revision_id;

  update public.investigations set active_analysis_revision_id = new_revision_id
  where id = target_investigation and owner_id = current_owner;

  insert into public.investigation_events (
    owner_id, investigation_id, event_type, actor_type, actor_id, payload
  ) values (
    current_owner, target_investigation, 'challenge_confirmed', 'researcher', current_owner,
    jsonb_build_object('analysis_revision', expected_revision + 1, 'challenge', challenge_preview)
  );

  return jsonb_build_object('investigation_id', target_investigation, 'analysis_revision', expected_revision + 1);
end;
$$;

create or replace function public.save_investigation_plan(
  target_investigation uuid,
  expected_revision integer,
  plan_body jsonb,
  plan_warnings jsonb,
  plan_digest text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner uuid := auth.uid();
  active_revision integer;
  next_version integer;
  plan_id uuid;
begin
  select ar.revision into active_revision
  from public.investigations i
  join public.analysis_revisions ar on ar.id = i.active_analysis_revision_id and ar.owner_id = i.owner_id
  where i.id = target_investigation and i.owner_id = current_owner
  for update of i;
  if active_revision is null then
    raise exception 'investigation not found' using errcode = '42501';
  end if;
  if active_revision <> expected_revision then
    raise exception 'stale analysis revision' using errcode = '40001';
  end if;
  if length(plan_digest) <> 64 or jsonb_typeof(plan_body) <> 'object' then
    raise exception 'invalid plan or digest' using errcode = '22023';
  end if;

  select coalesce(max(version), 0) + 1 into next_version
  from public.plan_versions where investigation_id = target_investigation;
  plan_body := plan_body || jsonb_build_object('version', next_version);

  insert into public.plan_versions (
    owner_id, investigation_id, version, status, body, warnings, digest
  ) values (
    current_owner, target_investigation, next_version, 'draft', plan_body,
    coalesce(plan_warnings, '[]'::jsonb), plan_digest
  ) returning id into plan_id;

  update public.investigations
  set active_plan_version_id = plan_id, status = 'proposal_ready'
  where id = target_investigation and owner_id = current_owner;

  insert into public.investigation_events (
    owner_id, investigation_id, event_type, actor_type, actor_id, payload
  ) values (
    current_owner, target_investigation, 'plan_saved', 'researcher', current_owner,
    jsonb_build_object('version', next_version, 'digest', plan_digest)
  );

  return jsonb_build_object('investigation_id', target_investigation, 'plan_version', next_version, 'digest', plan_digest);
end;
$$;

create or replace function public.approve_investigation_plan(
  target_investigation uuid,
  expected_version integer,
  expected_digest text,
  approval_status public.plan_status,
  approval_rationale text,
  acknowledged_limitation text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner uuid := auth.uid();
  plan_record public.plan_versions%rowtype;
  investigation_status public.investigation_status;
begin
  select pv.* into plan_record
  from public.investigations i
  join public.plan_versions pv on pv.id = i.active_plan_version_id and pv.owner_id = i.owner_id
  where i.id = target_investigation and i.owner_id = current_owner
  for update of i, pv;
  if plan_record.id is null then
    raise exception 'active plan not found' using errcode = '42501';
  end if;
  if plan_record.status <> 'draft' or plan_record.version <> expected_version
     or plan_record.digest <> expected_digest then
    raise exception 'stale plan version or digest' using errcode = '40001';
  end if;
  if approval_status not in ('approved', 'approved_with_limitation') then
    raise exception 'invalid approval status' using errcode = '22023';
  end if;
  if approval_status = 'approved_with_limitation'
     and length(trim(coalesce(acknowledged_limitation, ''))) = 0 then
    raise exception 'specific limitation acknowledgment required' using errcode = '22023';
  end if;

  update public.plan_versions
  set status = approval_status, approved_at = now(), approved_by = current_owner,
      rationale = approval_rationale
  where id = plan_record.id and owner_id = current_owner;

  investigation_status := case when approval_status = 'approved_with_limitation'
    then 'approved_with_limitation'::public.investigation_status
    else 'approved'::public.investigation_status end;
  update public.investigations set status = investigation_status
  where id = target_investigation and owner_id = current_owner;

  insert into public.investigation_events (
    owner_id, investigation_id, event_type, actor_type, actor_id, payload
  ) values (
    current_owner, target_investigation, 'plan_approved', 'researcher', current_owner,
    jsonb_build_object(
      'version', expected_version, 'digest', expected_digest, 'status', approval_status,
      'rationale', approval_rationale, 'acknowledged_limitation', acknowledged_limitation
    )
  );

  return jsonb_build_object(
    'investigation_id', target_investigation, 'plan_version', expected_version,
    'digest', expected_digest, 'status', approval_status
  );
end;
$$;

revoke all on function public.create_investigation_from_finding(uuid, uuid, text, text, jsonb, jsonb) from public;
revoke all on function public.confirm_investigation_challenge(uuid, integer, jsonb) from public;
revoke all on function public.save_investigation_plan(uuid, integer, jsonb, jsonb, text) from public;
revoke all on function public.approve_investigation_plan(uuid, integer, text, public.plan_status, text, text) from public;
grant execute on function public.create_investigation_from_finding(uuid, uuid, text, text, jsonb, jsonb) to authenticated;
grant execute on function public.confirm_investigation_challenge(uuid, integer, jsonb) to authenticated;
grant execute on function public.save_investigation_plan(uuid, integer, jsonb, jsonb, text) to authenticated;
grant execute on function public.approve_investigation_plan(uuid, integer, text, public.plan_status, text, text) to authenticated;
