import React, { useEffect, useState } from 'react';
import { CursorData } from '../../types/collaboration';
import styles from './CollaborativeCursors.module.css';

interface CollaborativeCursorsProps {
  cursors: CursorData[];
  editor: any; // Monaco editor instance
}

const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = ({ cursors, editor }) => {
  const [cursorElements, setCursorElements] = useState<JSX.Element[]>([]);
  
  useEffect(() => {
    if (!editor) return;
    
    // Clear existing decorations
    const oldDecorations = editor.getModel()?.getAllDecorations() || [];
    const decorationsToRemove = oldDecorations
      .filter((d: any) => d.options.className?.includes('remote-cursor'))
      .map((d: any) => d.id);
    
    if (decorationsToRemove.length > 0) {
      editor.deltaDecorations(decorationsToRemove, []);
    }
    
    // Add new decorations for each cursor
    const newDecorations = cursors.map(cursor => {
      // Create cursor decoration
      const cursorDecoration = {
        range: {
          startLineNumber: cursor.line,
          startColumn: cursor.column,
          endLineNumber: cursor.line,
          endColumn: cursor.column + 1
        },
        options: {
          className: `remote-cursor remote-cursor-${cursor.userId}`,
          hoverMessage: { value: cursor.username },
          stickiness: 1, // Always stick to the content
        }
      };
      
      // Create selection decoration if there's a selection
      const selectionDecoration = cursor.selection ? {
        range: {
          startLineNumber: cursor.selection.startLine,
          startColumn: cursor.selection.startColumn,
          endLineNumber: cursor.selection.endLine,
          endColumn: cursor.selection.endColumn
        },
        options: {
          className: `remote-selection remote-selection-${cursor.userId}`,
          hoverMessage: { value: cursor.username },
        }
      } : null;
      
      // Add CSS for this cursor
      const style = document.createElement('style');
      style.innerHTML = `
        .remote-cursor-${cursor.userId} {
          position: relative;
          border-left: 2px solid ${cursor.color};
        }
        .remote-cursor-${cursor.userId}::after {
          content: '';
          position: absolute;
          top: 0;
          left: -2px;
          width: 4px;
          height: 100%;
          background-color: ${cursor.color};
          z-index: 1;
        }
        .remote-cursor-${cursor.userId}::before {
          content: '${cursor.username}';
          position: absolute;
          top: -20px;
          left: -2px;
          background-color: ${cursor.color};
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          white-space: nowrap;
          z-index: 2;
        }
        .remote-selection-${cursor.userId} {
          background-color: ${cursor.color}33;
        }
      `;
      document.head.appendChild(style);
      
      // Return both decorations
      return selectionDecoration ? [cursorDecoration, selectionDecoration] : [cursorDecoration];
    }).flat().filter(Boolean);
    
    // Apply decorations
    if (newDecorations.length > 0) {
      editor.deltaDecorations([], newDecorations);
    }
    
    // Create cursor elements for display
    const elements = cursors.map(cursor => (
      <div 
        key={cursor.userId}
        className={styles.cursorLabel}
        style={{
          backgroundColor: cursor.color,
          color: '#FFFFFF'
        }}
      >
        {cursor.username}
      </div>
    ));
    
    setCursorElements(elements);
    
    // Cleanup
    return () => {
      document.querySelectorAll(`style`).forEach(el => {
        if (el.innerHTML.includes('remote-cursor-')) {
          el.remove();
        }
      });
    };
  }, [cursors, editor]);
  
  return (
    <div className={styles.cursorsContainer}>
      {cursorElements}
    </div>
  );
};

export default CollaborativeCursors;