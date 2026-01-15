import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';
import { NextRequest } from 'next/server';

// GET /api/todos - Get all projects with their tasks for the authenticated user
export async function GET() {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = await createClient();

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (projectsError) throw projectsError;

    const { data: tasks, error: tasksError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
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

// POST /api/todos - Create a new project with tasks OR add task to existing project
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = await createClient();
    const body = await request.json() as {
      projectName?: string;
      projectId?: string;
      tasks?: Array<{ title: string }>;
      title?: string;
    };

    // Adding a single task to an existing project
    if (body.projectId && body.title) {
      // Verify the project belongs to the user
      const { data: existingProject, error: projectCheckError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', body.projectId)
        .eq('user_id', user.id)
        .single();

      if (projectCheckError || !existingProject) {
        return new Response('Project not found', { status: 404 });
      }

      const { data: task, error: taskError } = await supabase
        .from('todos')
        .insert({
          user_id: user.id,
          project_id: body.projectId,
          title: body.title,
          status: 'pending',
          source: 'manual',
        })
        .select()
        .single();

      if (taskError) throw taskError;
      return Response.json(task);
    }

    // Creating a new project (optionally with tasks)
    if (!body.projectName) {
      return new Response('Project name is required', { status: 400 });
    }

    // Create project with user_id
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: body.projectName,
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Create tasks if provided
    let createdTasks: typeof project[] = [];
    if (body.tasks && body.tasks.length > 0) {
      const tasksToInsert = body.tasks.map((task) => ({
        user_id: user.id,
        project_id: project.id,
        title: task.title,
        status: 'pending',
        source: 'image',
      }));

      const { data, error: tasksError } = await supabase
        .from('todos')
        .insert(tasksToInsert)
        .select();

      if (tasksError) throw tasksError;
      createdTasks = data || [];
    }

    return Response.json({
      ...project,
      tasks: createdTasks,
    });
  } catch (error) {
    console.error('Create todos API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// DELETE /api/todos - Delete a project and its tasks
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = await createClient();
    const { projectId } = await request.json() as { projectId: string };

    if (!projectId) {
      return new Response('Project ID is required', { status: 400 });
    }

    // Delete all tasks for the project first
    const { error: tasksError } = await supabase
      .from('todos')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id);

    if (tasksError) throw tasksError;

    // Delete the project
    const { error: projectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (projectError) throw projectError;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete project API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// PATCH /api/todos - Update a task
export async function PATCH(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = await createClient();
    const { taskId, updates } = await request.json() as {
      taskId: string;
      updates: { status?: string; title?: string };
    };

    if (!taskId) {
      return new Response('Task ID is required', { status: 400 });
    }

    // Update only if the task belongs to the user
    const { data, error } = await supabase
      .from('todos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return new Response('Task not found', { status: 404 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Update todo API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
