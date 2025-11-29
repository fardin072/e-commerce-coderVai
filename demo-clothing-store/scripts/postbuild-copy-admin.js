const fs = require("fs")
const path = require("path")

async function copyAdminBundle() {
  const rootDir = process.cwd()
  const source = path.join(rootDir, ".medusa", "server", "public", "admin")
  const destination = path.join(rootDir, "public", "admin")

  if (!fs.existsSync(source)) {
    console.warn(
      '[postbuild] Skipping admin copy because ".medusa/client" was not found.'
    )
    return
  }

  await fs.promises.rm(destination, { recursive: true, force: true })
  await fs.promises.mkdir(path.dirname(destination), { recursive: true })
  await fs.promises.cp(source, destination, { recursive: true })

  console.log('[postbuild] Copied admin bundle to "public/admin".')
  
  // Modify the admin HTML to redirect logout to custom admin
  await modifyAdminForLogoutRedirect(destination)
  
  // Also modify JS bundle files to replace branding
  await modifyJSBundlesForBranding(destination)
}

async function modifyAdminForLogoutRedirect(adminDir) {
  const indexPath = path.join(adminDir, "index.html")
  
  if (!fs.existsSync(indexPath)) {
    console.warn("[postbuild] Admin index.html not found, skipping modifications")
    return
  }

  try {
    let html = await fs.promises.readFile(indexPath, "utf-8")
    const customAdminUrl = process.env.CUSTOM_ADMIN_URL || "http://localhost:5173"
    const brandName = process.env.ADMIN_BRAND_NAME || "Zahan Admin"
    const brandLogo = process.env.ADMIN_BRAND_LOGO || "/admin-assets/custom-logo.png"
    
    // Add script to intercept logout and redirect to custom admin
    const logoutScript = `
    <script>
      // Intercept logout and redirect to custom admin
      (function() {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          const url = args[0];
          if (typeof url === 'string' && url.includes('/auth/session') && args[1]?.method === 'DELETE') {
            return originalFetch.apply(this, args).then(response => {
              if (response.ok) {
                // Logout successful, redirect to custom admin
                setTimeout(() => {
                  window.location.href = '${customAdminUrl}';
                }, 100);
              }
              return response;
            });
          }
          return originalFetch.apply(this, args);
        };
      })();
      
      // Replace Medusa branding on login page - AGGRESSIVE VERSION
      (function() {
        const brandName = '${brandName}';
        const brandLogo = '${brandLogo}';
        
        function replaceBranding() {
          try {
            // Replace ALL text containing "Medusa" (case insensitive)
            const walker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            
            const textNodes = [];
            let node;
            while (node = walker.nextNode()) {
              if (node.textContent && /medusa/i.test(node.textContent)) {
                textNodes.push(node);
              }
            }
            
            textNodes.forEach(textNode => {
              textNode.textContent = textNode.textContent.replace(/Medusa/gi, brandName);
              textNode.textContent = textNode.textContent.replace(/Welcome to .*?Medusa/gi, 'Welcome to ' + brandName);
            });
            
            // Replace logo images - try multiple selectors
            const logoSelectors = [
              'img[alt*="Medusa" i]',
              'img[alt*="medusa" i]',
              'img[src*="medusa" i]',
              '.logo img',
              'header img',
              'img.logo',
              '[class*="logo"] img',
              'img:first-of-type'
            ];
            
            logoSelectors.forEach(selector => {
              try {
                const imgs = document.querySelectorAll(selector);
                imgs.forEach(img => {
                  if (img && img.tagName === 'IMG') {
                    // Only replace if it looks like a Medusa logo
                    const src = img.src || '';
                    const alt = (img.alt || '').toLowerCase();
                    if (src.includes('medusa') || alt.includes('medusa') || !img.src || img.src.includes('data:')) {
                      img.src = brandLogo;
                      img.alt = brandName;
                      img.onerror = function() {
                        // If logo fails to load, hide it or use a fallback
                        this.style.display = 'none';
                      };
                    }
                  }
                });
              } catch(e) {}
            });
            
            // Replace in React text content (innerText)
            document.querySelectorAll('*').forEach(el => {
              if (el.innerText) {
                const text = el.innerText;
                if (/medusa/i.test(text) && text !== el.innerText.replace(/medusa/gi, brandName)) {
                  el.innerText = text.replace(/Medusa/gi, brandName);
                }
              }
            });
            
            // Replace in title
            if (document.title && /medusa/i.test(document.title)) {
              document.title = document.title.replace(/Medusa/gi, brandName);
            }
          } catch(e) {
            console.warn('Branding replacement error:', e);
          }
        }
        
        // Run immediately
        replaceBranding();
        
        // Run on DOM ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', replaceBranding);
        }
        
        // Use MutationObserver to catch ALL DOM changes
        const observer = new MutationObserver(function(mutations) {
          replaceBranding();
        });
        
        if (document.body) {
          observer.observe(document.body, { 
            childList: true, 
            subtree: true,
            characterData: true,
            attributes: true
          });
        }
        
        // Run multiple times to catch late-loading React content
        const intervals = [100, 500, 1000, 2000, 3000, 5000];
        intervals.forEach(delay => {
          setTimeout(replaceBranding, delay);
        });
        
        // Also intercept React rendering if possible
        if (window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
          setInterval(replaceBranding, 2000);
        }
      })();
    </script>
    `
    
    // Insert script before closing </head> tag
    if (html.includes("</head>")) {
      html = html.replace("</head>", logoutScript + "</head>")
      await fs.promises.writeFile(indexPath, html, "utf-8")
      console.log("[postbuild] Added logout redirect and branding replacement to admin")
    } else {
      console.warn("[postbuild] Could not find </head> tag in admin index.html")
    }
  } catch (error) {
    console.error("[postbuild] Failed to modify admin:", error)
  }
}

async function modifyJSBundlesForBranding(adminDir) {
  // Skip JS bundle modification - it's too risky and can break the code
  // The client-side script in the HTML should handle the branding replacement
  console.log("[postbuild] Skipping JS bundle modification (using client-side replacement instead)")
  return
  
  // OLD CODE - commented out to prevent breaking styles
  // The issue is that replacing strings in JS bundles can break:
  // - Variable names containing "Medusa"
  // - Object properties
  // - Function names
  // - Code structure
  // 
  // Instead, we rely on the client-side script in index.html
  // which safely replaces text in the DOM after React renders
}

copyAdminBundle().catch((err) => {
  console.error("[postbuild] Failed to copy admin bundle:", err)
  process.exit(1)
})

