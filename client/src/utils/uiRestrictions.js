/**
 * UI Restrictions
 * 
 * This module restricts common UI events that allow users to inspect or easily modify
 * the client-side application.
 */

export const applyUIRestrictions = () => {
  if (process.env.NODE_ENV === 'development') {
    // Optionally disable these restrictions in development for easier debugging
    console.warn('UI Restrictions are disabled in development mode.');
    return;
  }

  // Disable Right-Click Context Menu
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // Disable specific keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
    }
    
    // Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
      e.preventDefault();
    }

    // Ctrl+Shift+J (Windows/Linux) or Cmd+Option+J (Mac)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
      e.preventDefault();
    }

    // Ctrl+U (Windows/Linux) or Cmd+Option+U (Mac) - View Source
    if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
      e.preventDefault();
    }
  });
};
