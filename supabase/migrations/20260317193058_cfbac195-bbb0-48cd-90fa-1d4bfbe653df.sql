
ALTER TABLE public.profiles
ADD COLUMN age integer NULL,
ADD COLUMN email_updates boolean NOT NULL DEFAULT false,
ADD COLUMN stock_tips boolean NOT NULL DEFAULT false;
