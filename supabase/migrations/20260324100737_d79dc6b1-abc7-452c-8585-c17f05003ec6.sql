UPDATE auth.users 
SET email = 'jose-vagner.pinto@caixa.gov.br',
    email_confirmed_at = now(),
    updated_at = now()
WHERE id = '6c4693b2-3114-44b5-990a-80d9e64a424c' 
  AND email = 'josevagner@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'jose-vagner.pinto@caixa.gov.br'
  );
