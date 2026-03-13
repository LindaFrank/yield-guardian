
ALTER TABLE public.user_stocks
  ADD COLUMN purchase_price numeric DEFAULT null,
  ADD COLUMN shares_owned numeric DEFAULT null;

-- Allow users to update their own stocks (for adding cost basis)
CREATE POLICY "Users can update own stocks"
  ON public.user_stocks
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
