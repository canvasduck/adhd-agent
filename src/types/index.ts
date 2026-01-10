// Database types - will be replaced with Supabase generated types
export interface Project {
  id: string;
  user_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string | null;
  project_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  source: 'manual' | 'image' | 'coach';
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// UI types
export interface TaskWithProject extends Task {
  project: Project;
}

// LLM response types
export interface ExtractedTask {
  title: string;
  projectName?: string;
}

export interface ImageAnalysisResult {
  projectName: string;
  tasks: ExtractedTask[];
  clarifyingQuestion?: {
    question: string;
    options: string[];
  };
}
