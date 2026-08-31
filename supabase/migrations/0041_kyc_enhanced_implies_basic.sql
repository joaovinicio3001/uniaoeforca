-- Verificação passa a ser só documento (frente + verso + selfie). Os dados
-- pessoais já vêm do cadastro/perfil e são conferidos pela equipe na revisão.
-- Portanto: um caso ENHANCED aprovado já satisfaz o requisito "básico" de KYC
-- usado pelo request_withdrawal.
create or replace function private.kyc_summary_for(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  select jsonb_build_object(
    'has_basic', exists (
      select 1 from public.kyc_cases
      where user_id = p_user_id
        and status = 'approved'
        and (expires_at is null or expires_at > now())
    ),
    'has_enhanced', exists (
      select 1 from public.kyc_cases
      where user_id = p_user_id
        and level = 'enhanced'
        and status = 'approved'
        and (expires_at is null or expires_at > now())
    )
  );
$function$;
