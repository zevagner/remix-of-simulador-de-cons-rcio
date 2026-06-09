CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_domain text;
BEGIN
  -- Extrair domínio do email
  user_domain := split_part(NEW.email, '@', 2);
  
  INSERT INTO public.profiles (id, user_id, nome, approved)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.raw_user_meta_data->>'nome',
    CASE 
      WHEN user_domain = 'caixa.gov.br' THEN true
      WHEN user_domain = 'caixaconsorcio.com.br' THEN false
      ELSE false
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;