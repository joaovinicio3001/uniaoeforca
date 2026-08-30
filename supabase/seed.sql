-- Seed de desenvolvimento. NÃO roda automaticamente contra o projeto remoto.
-- Aplique só em ambiente local (`supabase db reset`) ou adapte com cuidado.

-- Não há dados de seed obrigatórios na Fase 0: usuários vêm do fluxo de cadastro
-- e os papéis são concedidos pelo trigger handle_new_user.

-- --------------------------------------------------------------------------
-- Como promover um usuário a staff/admin (rodar manualmente no SQL Editor,
-- trocando o e-mail). Escrita em user_roles exige privilégio — o SQL Editor do
-- Supabase roda como superusuário, então funciona aqui.
-- --------------------------------------------------------------------------
-- insert into public.user_roles (user_id, role)
-- select u.id, 'admin'::public.app_role
-- from auth.users u
-- where u.email = 'voce@exemplo.com'
-- on conflict do nothing;

-- Para superadmin, troque 'admin' por 'superadmin'.
