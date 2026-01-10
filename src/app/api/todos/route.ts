import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// GET /api/todos - Get all projects with their tasks
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) throw projectsError;

    const { data: tasks, error: tasksError } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true });

    if (tasksError) throw tasksError;

    // Group tasks by project
    const projectsWithTasks = projects?.map((project) => ({
      ...project,
      tasks: tasks?.filter((task) => task.project_id === project.id) || [],
    }));

    return Response.json(projectsWithTasks);
  } catch (error) {
    console.error('Todos API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// POST /api/todos - Create a new project with tasks
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { projectName, tasks } = await request.json() as {
      projectName: string;
      tasks: Array<{ title: string }>;
    };

    if (!projectName || !tasks?.length) {
      return new Response('Project name and tasks are required', { status: 400 });
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({ name: projectName })
      .select()
      .single();

    if (projectError) throw projectError;

    // Create tasks
    const tasksToInsert = tasks.map((task) => ({
      project_id: project.id,
      title: task.title,
      status: 'pending',
      source: 'image',
    }));

    const { data: createdTasks, error: tasksError } = await supabase
      .from('todos')
      .insert(tasksToInsert)
      .select();

    if (tasksError) throw tasksError;

    return Response.json({
      ...project,
      tasks: createdTasks,
    });
  } catch (error) {
    console.error('Create todos API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// PATCH /api/todos - Update a task
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { taskId, updates } = await request.json() as {
      taskId: string;
      updates: { status?: string; title?: string };
    };

    if (!taskId) {
      return new Response('Task ID is required', { status: 400 });
    }

    const { data, error } = await supabase
      .from('todos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    return Response.json(data);
  } catch (error) {
    console.error('Update todo API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
