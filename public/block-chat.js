// Chat widget repositioner - moves it to top instead of blocking bottom content
(function() {
  'use strict';
  
  console.log('[Chat Repositioner] Moving chat widget to top...');
  
  // Function to reposition chat widgets
  function repositionChatWidgets() {
    // Find all fixed position elements outside #root
    document.querySelectorAll('body > *:not(#root):not(script):not(style):not(link)').forEach(el => {
      const style = window.getComputedStyle(el);
      
      if (style.position === 'fixed') {
        console.log('[Chat Repositioner] Found fixed element, moving to top:', el);
        
        // Move to top instead of bottom
        el.style.setProperty('bottom', 'auto', 'important');
        el.style.setProperty('top', '20px', 'important');
        el.style.setProperty('right', '20px', 'important');
        el.style.setProperty('z-index', '999999', 'important');
        
        // Make it smaller if it's too big
        const width = parseInt(style.width);
        const height = parseInt(style.height);
        
        if (width > 400) {
          el.style.setProperty('max-width', '400px', 'important');
        }
        if (height > 600) {
          el.style.setProperty('max-height', '600px', 'important');
        }
      }
    });
    
    // Find iframes and move them too
    document.querySelectorAll('iframe:not(#root iframe)').forEach(iframe => {
      console.log('[Chat Repositioner] Moving iframe to top:', iframe);
      
      const parent = iframe.parentElement;
      if (parent && window.getComputedStyle(parent).position === 'fixed') {
        parent.style.setProperty('bottom', 'auto', 'important');
        parent.style.setProperty('top', '20px', 'important');
        parent.style.setProperty('right', '20px', 'important');
      }
      
      iframe.style.setProperty('max-width', '400px', 'important');
      iframe.style.setProperty('max-height', '600px', 'important');
    });
  }
  
  // Run immediately
  repositionChatWidgets();
  
  // Run after DOM loads
  document.addEventListener('DOMContentLoaded', repositionChatWidgets);
  
  // Run after page fully loads
  window.addEventListener('load', repositionChatWidgets);
  
  // Watch for new elements being added
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) {
          // Check if it's a fixed position element
          setTimeout(() => {
            const style = window.getComputedStyle(node);
            if (style.position === 'fixed' && !node.closest('#root')) {
              console.log('[Chat Repositioner] New fixed element detected, repositioning:', node);
              repositionChatWidgets();
            }
          }, 100);
        }
      });
    });
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Re-run every 2 seconds to catch any changes
  setInterval(repositionChatWidgets, 2000);
  
  console.log('[Chat Repositioner] Active and watching...');
})();
