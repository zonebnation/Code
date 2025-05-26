import { supabase } from '../lib/supabase-init';
import { Project } from '../types/editor';

class ProjectService {
  async getUserProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        user_id,
        is_public,
        created_at,
        updated_at,
        collaborators_can_invite,
        project_files (*)
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }

    // Transform the database response to our Project type
    return (data || []).map(project => this.transformDbProjectToProject(project));
  }

  async getProject(projectId: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        user_id,
        is_public,
        created_at,
        updated_at,
        collaborators_can_invite,
        project_files (*)
      `)
      .eq('id', projectId)
      .single();

    if (error) {
      console.error(`Error fetching project ${projectId}:`, error);
      throw error;
    }

    return this.transformDbProjectToProject(data);
  }

  async createProject(name: string, description: string = ''): Promise<Project> {
    // Create the project record
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert([
        { name, description }
      ])
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      throw projectError;
    }

    // Create default files for the project
    const defaultFiles = [
      {
        project_id: projectData.id,
        name: 'index.js',
        path: '/index.js',
        content: '// Welcome to Code Canvas!\nconsole.log("Hello, world!");',
        type: 'file'
      },
      {
        project_id: projectData.id,
        name: 'style.css',
        path: '/style.css',
        content: '/* Styles for your project */\nbody {\n  font-family: sans-serif;\n  margin: 0;\n  padding: 20px;\n}',
        type: 'file'
      },
      {
        project_id: projectData.id,
        name: 'src',
        path: '/src',
        type: 'directory'
      }
    ];

    const { data: filesData, error: filesError } = await supabase
      .from('project_files')
      .insert(defaultFiles)
      .select();

    if (filesError) {
      console.error('Error creating project files:', filesError);
      throw filesError;
    }

    // Create child files in the src directory
    const srcFile = filesData.find(f => f.path === '/src');
    if (srcFile) {
      const srcChildren = [
        {
          project_id: projectData.id,
          name: 'app.js',
          path: '/src/app.js',
          content: '// App logic goes here\nfunction init() {\n  console.log("App initialized");\n}\n\ninit();',
          type: 'file',
          parent_id: srcFile.id
        },
        {
          project_id: projectData.id,
          name: 'utils.js',
          path: '/src/utils.js',
          content: '// Utility functions\nexport function formatDate(date) {\n  return new Date(date).toLocaleDateString();\n}',
          type: 'file',
          parent_id: srcFile.id
        }
      ];

      const { data: childrenData, error: childrenError } = await supabase
        .from('project_files')
        .insert(srcChildren)
        .select();

      if (childrenError) {
        console.error('Error creating child files:', childrenError);
        throw childrenError;
      }

      // Update src directory with children
      const { error: updateError } = await supabase
        .from('project_files')
        .update({ 
          children: childrenData.map(child => child.id) 
        })
        .eq('id', srcFile.id);

      if (updateError) {
        console.error('Error updating src directory:', updateError);
        throw updateError;
      }
    }

    // Fetch the complete project with all files
    return this.getProject(projectData.id);
  }

  async updateProject(projectId: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId);

    if (error) {
      console.error(`Error updating project ${projectId}:`, error);
      throw error;
    }
  }

  async updateFile(fileId: string, content: string): Promise<void> {
    const { error } = await supabase
      .from('project_files')
      .update({ content })
      .eq('id', fileId);

    if (error) {
      console.error(`Error updating file ${fileId}:`, error);
      throw error;
    }
  }

  async createFile(projectId: string, name: string, path: string, type: 'file' | 'directory', parentId?: string, content: string = ''): Promise<any> {
    const fileData = {
      project_id: projectId,
      name,
      path,
      type,
      parent_id: parentId,
      content: type === 'file' ? content : null,
      children: type === 'directory' ? [] : null
    };

    const { data, error } = await supabase
      .from('project_files')
      .insert([fileData])
      .select()
      .single();

    if (error) {
      console.error('Error creating file:', error);
      throw error;
    }

    // If this file has a parent, update the parent's children array
    if (parentId) {
      const { data: parentData, error: parentError } = await supabase
        .from('project_files')
        .select('children')
        .eq('id', parentId)
        .single();

      if (parentError) {
        console.error('Error fetching parent:', parentError);
        throw parentError;
      }

      const children = parentData.children || [];
      children.push(data.id);

      const { error: updateError } = await supabase
        .from('project_files')
        .update({ children })
        .eq('id', parentId);

      if (updateError) {
        console.error('Error updating parent children:', updateError);
        throw updateError;
      }
    }

    return data;
  }

  async deleteFile(fileId: string): Promise<void> {
    // Get the file to check if it has a parent
    const { data: fileData, error: fileError } = await supabase
      .from('project_files')
      .select('parent_id')
      .eq('id', fileId)
      .single();

    if (fileError) {
      console.error(`Error fetching file ${fileId}:`, fileError);
      throw fileError;
    }

    // If file has a parent, update the parent's children array
    if (fileData.parent_id) {
      const { data: parentData, error: parentError } = await supabase
        .from('project_files')
        .select('children')
        .eq('id', fileData.parent_id)
        .single();

      if (parentError) {
        console.error('Error fetching parent:', parentError);
        throw parentError;
      }

      const children = parentData.children || [];
      const updatedChildren = children.filter(id => id !== fileId);

      const { error: updateError } = await supabase
        .from('project_files')
        .update({ children: updatedChildren })
        .eq('id', fileData.parent_id);

      if (updateError) {
        console.error('Error updating parent children:', updateError);
        throw updateError;
      }
    }

    // Delete the file
    const { error } = await supabase
      .from('project_files')
      .delete()
      .eq('id', fileId);

    if (error) {
      console.error(`Error deleting file ${fileId}:`, error);
      throw error;
    }
  }

  async renameFile(fileId: string, newName: string): Promise<void> {
    // Get the current file info
    const { data: fileData, error: fileError } = await supabase
      .from('project_files')
      .select('path, name')
      .eq('id', fileId)
      .single();

    if (fileError) {
      console.error(`Error fetching file ${fileId}:`, fileError);
      throw fileError;
    }

    // Calculate the new path by replacing the file name in the path
    const oldPath = fileData.path;
    const pathParts = oldPath.split('/');
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join('/');

    // Update the file
    const { error } = await supabase
      .from('project_files')
      .update({ name: newName, path: newPath })
      .eq('id', fileId);

    if (error) {
      console.error(`Error renaming file ${fileId}:`, error);
      throw error;
    }
  }

  private transformDbProjectToProject(dbProject: any): Project {
    // Convert DB project files to our file structure
    const files = this.buildFileTree(dbProject.project_files || []);

    return {
      id: dbProject.id,
      name: dbProject.name,
      description: dbProject.description || '',
      path: `/projects/${dbProject.id}`,
      files,
      createdAt: dbProject.created_at,
      updatedAt: dbProject.updated_at,
      userId: dbProject.user_id,
      isPublic: dbProject.is_public,
      collaboratorsCanInvite: dbProject.collaborators_can_invite
    };
  }

  private buildFileTree(dbFiles: any[]): any[] {
    // Create a map of files by ID for quick lookup
    const fileMap = new Map();
    dbFiles.forEach(file => {
      fileMap.set(file.id, {
        id: file.id,
        name: file.name,
        type: file.type,
        path: file.path,
        content: file.content || '',
        children: file.children || [],
      });
    });

    // Convert the map to an array
    return Array.from(fileMap.values());
  }
}

export default new ProjectService();