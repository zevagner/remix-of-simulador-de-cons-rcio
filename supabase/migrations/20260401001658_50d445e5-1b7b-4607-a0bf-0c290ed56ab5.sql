ALTER TABLE public.proposals 
  ADD COLUMN client_phone text DEFAULT NULL,
  ADD COLUMN next_contact_date date DEFAULT NULL;