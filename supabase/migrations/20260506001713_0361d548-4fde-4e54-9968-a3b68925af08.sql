REVOKE EXECUTE ON FUNCTION public.list_proposals_page(text, text, boolean, int, int) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.list_proposals_page(text, text, boolean, int, int) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.list_post_sale_clients_page(text, text, int, int) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.list_post_sale_clients_page(text, text, int, int) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.list_proposal_events_page(uuid, int, int) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.list_proposal_events_page(uuid, int, int) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.invalidate_pdf_cache_on_proposal_change() FROM anon, public, authenticated;