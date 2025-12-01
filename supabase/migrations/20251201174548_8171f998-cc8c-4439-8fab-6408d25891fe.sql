CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('public', 'private', 'workshop', 'ceremony')),
  location TEXT,
  organizer TEXT,
  url TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  submitted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.clinical_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  institution TEXT NOT NULL,
  principal_investigator TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL CHECK (status IN ('planned', 'recruiting', 'active', 'completed')),
  trial_registry_id TEXT,
  doi TEXT,
  url TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  submitted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.retreats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  country TEXT,
  image_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  tags TEXT[] DEFAULT '{}',
  is_approved BOOLEAN NOT NULL DEFAULT false,
  submitted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.trust_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retreat_id UUID REFERENCES public.retreats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  safety_rating INTEGER NOT NULL CHECK (safety_rating >= 1 AND safety_rating <= 5),
  authenticity_rating INTEGER NOT NULL CHECK (authenticity_rating >= 1 AND authenticity_rating <= 5),
  value_rating INTEGER NOT NULL CHECK (value_rating >= 1 AND value_rating <= 5),
  integration_rating INTEGER NOT NULL CHECK (integration_rating >= 1 AND integration_rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(retreat_id, user_id)
);

CREATE TABLE public.community_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('event', 'trial', 'retreat')),
  entity_id UUID NOT NULL,
  note_text TEXT NOT NULL,
  author_id UUID NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retreats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_notes ENABLE ROW LEVEL SECURITY;