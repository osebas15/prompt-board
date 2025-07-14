-- Create workflow tables for automation system

-- Workflows table
CREATE TABLE IF NOT EXISTS public.workflows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    steps jsonb NOT NULL DEFAULT '[]'::jsonb,
    variables jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active boolean NOT NULL DEFAULT true,
    is_template boolean NOT NULL DEFAULT false,
    schedule jsonb,
    tags text[] DEFAULT '{}'::text[],
    run_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Workflow executions table
CREATE TABLE IF NOT EXISTS public.workflow_executions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    status text NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    steps_completed integer DEFAULT 0,
    total_steps integer NOT NULL,
    results jsonb DEFAULT '{}'::jsonb,
    error text,
    created_at timestamptz DEFAULT now()
);

-- Workflow templates table
CREATE TABLE IF NOT EXISTS public.workflow_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    category text NOT NULL DEFAULT 'General',
    steps jsonb NOT NULL DEFAULT '[]'::jsonb,
    variables jsonb DEFAULT '{}'::jsonb,
    tags text[] DEFAULT '{}'::text[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON public.workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_is_template ON public.workflows(is_template);
CREATE INDEX IF NOT EXISTS idx_workflows_tags ON public.workflows USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON public.workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_updated_at ON public.workflows(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON public.workflow_executions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON public.workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_name ON public.workflow_templates(name);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_tags ON public.workflow_templates USING GIN(tags);

-- Enable Row Level Security (RLS)
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workflows
CREATE POLICY "Users can view their own workflows" ON public.workflows
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workflows" ON public.workflows
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows" ON public.workflows
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows" ON public.workflows
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for workflow executions
CREATE POLICY "Users can view executions for their workflows" ON public.workflow_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workflows 
            WHERE workflows.id = workflow_executions.workflow_id 
            AND workflows.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert executions for their workflows" ON public.workflow_executions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workflows 
            WHERE workflows.id = workflow_executions.workflow_id 
            AND workflows.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update executions for their workflows" ON public.workflow_executions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workflows 
            WHERE workflows.id = workflow_executions.workflow_id 
            AND workflows.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete executions for their workflows" ON public.workflow_executions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.workflows 
            WHERE workflows.id = workflow_executions.workflow_id 
            AND workflows.user_id = auth.uid()
        )
    );

-- Create RLS policies for workflow templates (public read, authenticated write)
CREATE POLICY "Anyone can view workflow templates" ON public.workflow_templates
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert workflow templates" ON public.workflow_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update workflow templates" ON public.workflow_templates
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete workflow templates" ON public.workflow_templates
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_workflows_updated_at 
    BEFORE UPDATE ON public.workflows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_templates_updated_at 
    BEFORE UPDATE ON public.workflow_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
