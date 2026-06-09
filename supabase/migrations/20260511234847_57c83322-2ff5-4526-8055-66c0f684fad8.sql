-- Revoke from PUBLIC (anon inherits PUBLIC); re-grant to authenticated where needed.
REVOKE EXECUTE ON FUNCTION public.current_company_id()         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_company_ids()        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_company_member(uuid)      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_company_admin(uuid)       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role)     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_approved(uuid)            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_proposals_page(text, text, boolean, integer, integer, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_post_sale_clients_page(text, text, integer, integer, uuid)  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_proposal_events_page(uuid, integer, integer, uuid)          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_users_page(text, text, text, text, boolean, text, text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_users_with_email()       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.community_recompute_engagement(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.community_user_level(uuid)   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.community_set_vote(uuid, text) FROM PUBLIC;

-- Trigger-only functions: revoke from PUBLIC (only the trigger executor needs them).
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_post_sale_bid_registered()       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_post_sale_client_created()       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_post_sale_status_change()        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_proposal_changes()               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_proposal_created()               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_self_approval()      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_company_id_from_profile()        FROM PUBLIC;

-- Re-grant to authenticated for ones the app calls directly via PostgREST/RLS.
GRANT EXECUTE ON FUNCTION public.current_company_id()        TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_company_ids()       TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_member(uuid)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_admin(uuid)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved(uuid)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_proposals_page(text, text, boolean, integer, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_post_sale_clients_page(text, text, integer, integer, uuid)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_proposal_events_page(uuid, integer, integer, uuid)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_page(text, text, text, text, boolean, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_email()      TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_recompute_engagement(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_user_level(uuid)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_set_vote(uuid, text) TO authenticated;