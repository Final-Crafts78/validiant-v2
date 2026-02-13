-- Tasks Schema Migration
-- Creates tables for task management

-- Create enum types
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'in_review', 'completed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- ============================================================================
-- TASKS TABLE
-- ============================================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Status and priority
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  
  -- Due date
  due_date DATE,
  
  -- Time tracking
  estimated_hours DECIMAL(10, 2),
  actual_hours DECIMAL(10, 2) DEFAULT 0,
  
  -- Subtask support
  parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Position for ordering (for kanban boards, drag-and-drop)
  position INTEGER NOT NULL DEFAULT 0,
  
  -- Tags (JSONB array)
  tags JSONB DEFAULT '[]',
  
  -- Custom fields (flexible structure)
  custom_fields JSONB DEFAULT '{}',
  
  -- Audit fields
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT tasks_hours_check CHECK (estimated_hours IS NULL OR estimated_hours >= 0),
  CONSTRAINT tasks_actual_hours_check CHECK (actual_hours >= 0)
);

-- Indexes for tasks table
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_position ON tasks(position);
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at);
CREATE INDEX idx_tasks_completed_at ON tasks(completed_at);
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
CREATE INDEX idx_tasks_title ON tasks(title);

-- ============================================================================
-- TASK ASSIGNEES TABLE
-- ============================================================================
CREATE TABLE task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Timestamps
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Unique constraint: one assignment per user per task
  CONSTRAINT unique_task_assignee UNIQUE(task_id, user_id)
);

CREATE INDEX idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX idx_task_assignees_user_id ON task_assignees(user_id);
CREATE INDEX idx_task_assignees_deleted_at ON task_assignees(deleted_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for tasks table
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for task_assignees table
CREATE TRIGGER update_task_assignees_updated_at
  BEFORE UPDATE ON task_assignees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

/**
 * Function to automatically set completed_at when status changes to completed
 */
CREATE OR REPLACE FUNCTION set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_status_completed_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION set_task_completed_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE tasks IS 'Stores task information for projects';
COMMENT ON TABLE task_assignees IS 'Maps users to tasks for assignment tracking';
COMMENT ON COLUMN tasks.parent_task_id IS 'Reference to parent task for subtask support';
COMMENT ON COLUMN tasks.position IS 'Used for ordering tasks in kanban boards and lists';
COMMENT ON COLUMN tasks.tags IS 'JSON array of task tags for categorization';
COMMENT ON COLUMN tasks.custom_fields IS 'Flexible JSON structure for project-specific task fields';
COMMENT ON COLUMN tasks.actual_hours IS 'Automatically calculated from time entries';
COMMENT ON COLUMN tasks.completed_at IS 'Automatically set when status changes to completed';
