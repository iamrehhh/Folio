-- Add show_on_homepage column
ALTER TABLE public.site_feedback ADD COLUMN show_on_homepage BOOLEAN DEFAULT false;

-- Add RLS policy to allow reading featured feedback
-- Note: 'isAuthenticated' may be covered if we only fetch from Server Components or authenticated routes,
-- but typically we'll just check if the user is authenticated. 
-- Since Home page is authenticated, auth.uid() IS NOT NULL works.
-- Actually, the user can just fetch `show_on_homepage = true` regardless.
CREATE POLICY "site_feedback_select_featured"
  ON public.site_feedback FOR SELECT
  USING (show_on_homepage = true);
