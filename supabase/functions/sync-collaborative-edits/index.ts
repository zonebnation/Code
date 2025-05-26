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

    // Parse request body
    const { projectId, fileId, operations } = await req.json();

    if (!projectId || !fileId || !operations) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has access to the project
    const { data: projectAccess, error: projectError } = await supabaseClient
      .from('projects')
      .select(`
        id,
        user_id,
        is_collaborative,
        project_collaborators!inner(user_id, permission)
      `)
      .eq('id', projectId)
      .or(`user_id.eq.${user.id},project_collaborators.user_id.eq.${user.id}`)
      .single();

    if (projectError || !projectAccess) {
      return new Response(JSON.stringify({ error: 'Project not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if project is collaborative
    if (!projectAccess.is_collaborative) {
      return new Response(JSON.stringify({ error: 'Project is not collaborative' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has write access
    const hasWriteAccess = 
      projectAccess.user_id === user.id || 
      projectAccess.project_collaborators.some((c: any) => 
        c.user_id === user.id && ['write', 'admin'].includes(c.permission)
      );

    if (!hasWriteAccess) {
      return new Response(JSON.stringify({ error: 'You do not have write access to this project' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if file exists in the project
    const { data: fileExists, error: fileError } = await supabaseClient
      .from('project_files')
      .select('id')
      .eq('id', fileId)
      .eq('project_id', projectId)
      .single();

    if (fileError || !fileExists) {
      return new Response(JSON.stringify({ error: 'File not found in project' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get or create collaborative session
    let sessionId;
    const { data: existingSession, error: sessionError } = await supabaseClient
      .from('collaborative_sessions')
      .select('id')
      .eq('project_id', projectId)
      .eq('file_id', fileId)
      .eq('user_id', user.id)
      .single();

    if (sessionError) {
      // Create new session
      const { data: newSession, error: createError } = await supabaseClient
        .from('collaborative_sessions')
        .insert({
          project_id: projectId,
          file_id: fileId,
          user_id: user.id
        })
        .select('id')
        .single();

      if (createError) {
        return new Response(JSON.stringify({ error: 'Failed to create collaborative session' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      sessionId = newSession.id;
    } else {
      sessionId = existingSession.id;
    }

    // Store edit operations
    const operationsToInsert = operations.map((op: any) => ({
      project_id: projectId,
      file_id: fileId,
      user_id: user.id,
      operation_type: op.type,
      position_line: op.position.line,
      position_column: op.position.column,
      text: op.text,
      length: op.length,
      timestamp: op.timestamp
    }));

    const { error: insertError } = await supabaseClient
      .from('edit_operations')
      .insert(operationsToInsert);

    if (insertError) {
      return new Response(JSON.stringify({ error: 'Failed to store edit operations' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update cursor position if provided
    if (operations.length > 0 && operations[operations.length - 1].cursorPosition) {
      const lastOp = operations[operations.length - 1];
      const { line, column, selection } = lastOp.cursorPosition;

      const { error: cursorError } = await supabaseClient
        .from('cursor_positions')
        .upsert({
          session_id: sessionId,
          line,
          column,
          selection_start_line: selection?.startLine,
          selection_start_column: selection?.startColumn,
          selection_end_line: selection?.endLine,
          selection_end_column: selection?.endColumn
        });

      if (cursorError) {
        console.error('Failed to update cursor position:', cursorError);
        // Continue even if cursor update fails
      }
    }

    // Broadcast changes to other users
    const channel = supabaseClient.channel(`file-${projectId}-${fileId}`);
    await channel.subscribe();
    
    await channel.send({
      type: 'broadcast',
      event: 'edit_operations',
      payload: {
        operations: operationsToInsert,
        user: {
          id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'Anonymous'
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Edit operations synced successfully',
        sessionId
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