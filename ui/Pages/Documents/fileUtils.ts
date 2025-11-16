/**
 * File utilities for search results
 */

import { fetchQuery } from "@ui/relay/environment";
import { graphql } from "relay-runtime";
import { fileUtilsQuery } from "./__generated__/fileUtilsQuery.graphql";
import { useAuth } from "@ui/contexts/AuthRelayProvider";

type FileEntityType = fileUtilsQuery['response']['fileEntity'];

export async function getFile(fileId: string): Promise<FileEntityType> {
  const auth = useAuth();
  const query = graphql`
    query fileUtilsQuery($fileId: String!) {
      fileEntity(id: $fileId) {
        id
        fullPath
        filename
      }
    }
  `;

  const variables = { fileId };
  return new Promise<FileEntityType>((resolve, reject) => {
    fetchQuery<fileUtilsQuery>(query, variables, { sessionKey: auth.user?.sessionKey })
      .then(data => resolve(data.data.fileEntity))
      .catch(error => reject(error));
  });
}


/**
 * Get file path from search result
 * Option 1: Use fullPath if available in search result
 * Option 2: Query for the file to get fullPath
 */
export async function getFilePathFromResult(fileId: string): Promise<string | null> {

  console.log('search for file path for fileId:', fileId);

  // Option 2: Query for the file to get fullPath
  try {
    const file = await getFile(fileId);
    return file?.fullPath || null;
  } catch (error) {
    console.error('Failed to fetch file for path:', error);
    return null;
  }
}

/**
 * Open file using Electron IPC
 * Tries to open with default application, falls back to showing in folder
 */
export async function openFileFromSearchResult(filePath: string): Promise<boolean> {
  if (!filePath) {
    console.error('No file path provided');
    return false;
  }

  try {
    // Check if we're in Electron environment
    if (typeof window !== 'undefined' && window.electron) {
      await window.electron['open-file-with-default'](filePath);
      return true;
    } else {
      console.warn('Not in Electron environment, cannot open file');
      // Fallback for browser testing - log the path
      console.log('Would open file:', filePath);
      return false;
    }
  } catch (error) {
    console.error('Failed to open file:', error);
    // Show user-friendly error
    if (typeof window !== 'undefined') {
      window.alert?.(`Could not open file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return false;
  }
}

/**
 * Handle click on search result
 * Combines getting file path and opening the file
 */
export async function handleSearchResultClick(fileId: string): Promise<void> {
  try {
    console.log('Opening search result:', fileId);

    // Get the file path
    const filePath = await getFilePathFromResult(fileId);

    if (!filePath) {
      throw new Error('File path not found');
    }

    // Open the file
    const success = await openFileFromSearchResult(filePath);

    if (!success) {
      console.warn('File opening may have failed or not supported in this environment');
    }
  } catch (error) {
    console.error('Failed to open search result:', error);

    // Show user-friendly error
    if (typeof window !== 'undefined') {
      window.alert?.(`Could not open file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}