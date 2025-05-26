// Follow imports
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Check if request is POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a Supabase client with the Auth context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication error' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { project, files } = await req.json();

    // Validate project data
    if (!project || !project.name) {
      return new Response(JSON.stringify({ error: 'Invalid project data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if project exists
    let projectId = project.id;
    let isNewProject = false;

    if (!projectId) {
      // Create new project
      isNewProject = true;
      const { data: newProject, error: projectError } = await supabaseClient
        .from('projects')
        .insert({
          name: project.name,
          description: project.description || '',
          user_id: user.id,
          is_public: project.is_public || false,
        })
        .select()
        .single();

      if (projectError) {
        return new Response(JSON.stringify({ error: 'Error creating project' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      projectId = newProject.id;
    } else {
      // Check if user can access this project
      const { data: existingProject, error: projectError } = await supabaseClient
        .from('projects')
        .select(`
          *,
          project_collaborators!inner(user_id, permission)
        `)
        .eq('id', projectId)
        .or(`user_id.eq.${user.id},project_collaborators.user_id.eq.${user.id}`)
        .single();

      if (projectError || !existingProject) {
        return new Response(JSON.stringify({ error: 'Project not found or access denied' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update project metadata if user is owner or admin
      if (existingProject.user_id === user.id || 
         (existingProject.project_collaborators && 
          existingProject.project_collaborators.some(c => 
            c.user_id === user.id && c.permission === 'admin'))) {
        
        const { error: updateError } = await supabaseClient
          .from('projects')
          .update({
            name: project.name,
            description: project.description || existingProject.description,
            is_public: project.is_public !== undefined ? project.is_public : existingProject.is_public,
            updated_at: new Date(),
          })
          .eq('id', projectId);

        if (updateError) {
          return new Response(JSON.stringify({ error: 'Error updating project' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Sync files if provided
    if (files && files.length > 0) {
      // Get existing files for the project
      const { data: existingFiles, error: filesError } = await supabaseClient
        .from('project_files')
        .select('id, path')
        .eq('project_id', projectId);

      if (filesError) {
        return new Response(JSON.stringify({ error: 'Error fetching existing files' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const existingFilePaths = new Map(existingFiles.map(file => [file.path, file.id]));
      const newFiles = [];
      const updateFiles = [];
      const filePathsToKeep = new Set();

      // Process files
      for (const file of files) {
        filePathsToKeep.add(file.path);
        
        if (existingFilePaths.has(file.path)) {
          // Update existing file
          updateFiles.push({
            id: existingFilePaths.get(file.path),
            name: file.name,
            content: file.content,
            type: file.type,
            parent_id: file.parent_id || null,
            updated_at: new Date(),
          });
        } else {
          // Create new file
          newFiles.push({
            project_id: projectId,
            name: file.name,
            path: file.path,
            content: file.content,
            type: file.type,
            parent_id: file.parent_id || null,
          });
        }
      }

      // Create new files
      if (newFiles.length > 0) {
        const { error: insertError } = await supabaseClient
          .from('project_files')
          .insert(newFiles);

        if (insertError) {
          return new Response(JSON.stringify({ error: 'Error creating new files' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Update existing files
      for (const file of updateFiles) {
        const { error: updateError } = await supabaseClient
          .from('project_files')
          .update({
            name: file.name,
            content: file.content,
            type: file.type,
            parent_id: file.parent_id,
            updated_at: file.updated_at,
          })
          .eq('id', file.id);

        if (updateError) {
          console.error('Error updating file:', updateError);
          // Continue with other files even if one fails
        }
      }

      // Delete files that no longer exist locally
      const filesToDelete = existingFiles
        .filter(file => !filePathsToKeep.has(file.path))
        .map(file => file.id);

      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabaseClient
          .from('project_files')
          .delete()
          .in('id', filesToDelete);

        if (deleteError) {
          console.error('Error deleting files:', deleteError);
          // Continue even if delete fails
        }
      }
    }

    // Fetch the updated project with files
    const { data: updatedProject, error: fetchError } = await supabaseClient
      .from('projects')
      .select(`
        *,
        files:project_files(*)
      `)
      .eq('id', projectId)
      .single();

    if (fetchError) {
      return new Response(JSON.stringify({ error: 'Error fetching updated project' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        message: isNewProject ? 'Project created and synced' : 'Project synced',
        project: updatedProject,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});