// NUCLEAR OPTION: JavaScript-based chat widget blocker
// This runs immediately to prevent ANY chat widget from appearing

(function() {
  'use strict';
  
  console.log('[Chat Blocker] Starting aggressive chat widget blocking...');
  
  // Function to remove chat widgets
  function destroyChatWidgets() {
    // Remove all elements outside #root
    document.querySelectorAll('body > *:not(#root):not(script):not(style):not(link)').forEach(el => {
      console.log('[Chat Blocker] Removing element outside #root:', el);
      el.remove();
    });
    
    // Remove elements with extremely high z-index (chat widgets use this)
    document.querySelectorAll('[style*="z-index"]').forEach(el => {
      const zIndex = parseInt(window.getComputedStyle(el).zIndex);
      if (zIndex > 999999) {
        console.log('[Chat Blocker] Removing high z-index element:', el, 'z-index:', zIndex);
        el.remove();
      }
    });
    
    // Remove fixed position elements in bottom-right
    document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]').forEach(el => {
      const style = window.getComputedStyle(el);
      const bottom = style.bottom;
      const right = style.right;
      
      if ((bottom !== 'auto' && parseInt(bottom) < 100) && 
          (right !== 'auto' && parseInt(right) < 100)) {
        // This is in bottom-right corner - likely chat widget
        if (!el.closest('#root')) {
          console.log('[Chat Blocker] Removing bottom-right fixed element:', el);
          el.remove();
        }
      }
    });
    
    // Remove iframes outside #root
    document.querySelectorAll('iframe:not(#root iframe)').forEach(iframe => {
      console.log('[Chat Blocker] Removing iframe outside #root:', iframe);
      iframe.remove();
    });
  }
  
  // Run immediately
  destroyChatWidgets();
  
  // Run after DOM loads
  document.addEventListener('DOMContentLoaded', destroyChatWidgets);
  
  // Run after page fully loads
  window.addEventListener('load', destroyChatWidgets);
  
  // Watch for new elements being added (MutationObserver)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { // Element node
          // If it's added outside #root, remove it
          if (!node.closest('#root') && 
              node.tagName !== 'SCRIPT' && 
              node.tagName !== 'STYLE' && 
              node.tagName !== 'LINK') {
            console.log('[Chat Blocker] Removing dynamically added element:', node);
            node.remove();
          }
        }
      });
    });
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('[Chat Blocker] Active and watching for chat widgets...');
})();
