import { createClient } from '@supabase/supabase-js';
import JSZip from "jszip";
import { saveAs } from 'file-saver';
import { supabase } from './supabase';

// Function to share a project
export const shareProject = async (projectId: string, shareType: 'public' | 'private' | 'link', options?: {
  password?: string,
  expiresAt?: Date,
  allowDownload?: boolean,
  allowCopy?: boolean
}) => {
  try {
    const { data, error } = await supabase
      .from('shared_entities')
      .insert({
        entity_id: projectId,
        entity_type: 'project',
        user_id: (await supabase.auth.getUser()).data.user?.id,
        share_type: shareType,
        password: options?.password,
        expires_at: options?.expiresAt,
        allow_download: options?.allowDownload ?? true,
        allow_copy: options?.allowCopy ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sharing project:', error);
    throw error;
  }
};

// Function to download project as zip
export const downloadProjectAsZip = async (projectId: string) => {
  try {
    const { data: files, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId);

    if (error) throw error;

    const zip = new JSZip();
    
    // Add each file to the zip
    files.forEach(file => {
      // Skip directories
      if (file.type === 'file' && file.content) {
        zip.file(file.path, file.content);
      }
    });
    
    // Generate the zip file and trigger download
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `project-${projectId}.zip`);
    
    return true;
  } catch (error) {
    console.error('Error downloading project:', error);
    throw error;
  }
};

// Function to get shared entity by ID
export const getSharedEntity = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('shared_entities')
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting shared entity:', error);
    throw error;
  }
};

// Function to access shared entity with password
export const accessSharedEntity = async (id: string, password?: string) => {
  try {
    // For now, we'll just verify locally
    const { data: entity, error } = await supabase
      .from('shared_entities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    if (entity.share_type === 'private' && entity.password !== password) {
      throw new Error('Invalid password');
    }
    
    // Increment access count
    await supabase
      .from('shared_entities')
      .update({ access_count: entity.access_count + 1 })
      .eq('id', id);
      
    return true;
  } catch (error) {
    console.error('Error accessing shared entity:', error);
    throw error;
  }
};

export default accessSharedEntity