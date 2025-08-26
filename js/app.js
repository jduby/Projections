// Main Application Controller
class AppController {
    constructor() {
        // Check for hash in URL, default to 'dashboard' if none
        const initialSection = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
        this.currentSection = initialSection;
        this.initEventListeners();
        
        // Initialize mobile menu if the function exists
        if (typeof window.initApp === 'function') {
            window.initApp();
        }
        
        // Load the initial section
        this.loadSection(initialSection);
    }

    initEventListeners() {
        console.log('Initializing event listeners...');
        
        // Use event delegation for navigation items
        document.addEventListener('click', (e) => {
            // Check if the click was on a nav link or its children
            const navLink = e.target.closest('.nav-item a');
            if (!navLink) return;
            
            const href = navLink.getAttribute('href');
            if (!href || !href.startsWith('#')) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            // Get the section from data-section or href
            const section = navLink.closest('.nav-item').getAttribute('data-section') || 
                           href.substring(1);
            
            console.group('Navigation Event');
            console.log('Nav link clicked:', navLink);
            console.log('Section from data-section:', navLink.closest('.nav-item').getAttribute('data-section'));
            console.log('Section from href:', href.substring(1));
            console.log('Resolved section:', section);
            
            if (section) {
                console.log('Calling navigateTo with section:', section);
                this.navigateTo(section);
            } else {
                console.warn('No section found for navigation');
            }
            console.groupEnd();
        });
        
        // Log all nav items for debugging
        const navItems = document.querySelectorAll('.nav-item');
        console.log(`Found ${navItems.length} navigation items`);
        navItems.forEach((item, index) => {
            const link = item.querySelector('a');
            console.log(`Nav item ${index + 1}:`, {
                text: item.textContent.trim(),
                section: item.getAttribute('data-section'),
                hasHref: !!link,
                href: link?.getAttribute('href'),
                element: item
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (event) => {
            const section = window.location.hash.substring(1) || 'dashboard';
            console.log('popstate event - navigating to:', section);
            this.navigateTo(section, false);
        });
        
        // Handle initial hash if present
        if (window.location.hash) {
            const section = window.location.hash.substring(1);
            if (section && section !== 'dashboard') {
                this.navigateTo(section, false);
            }
        }
    }

    async navigateTo(section, updateHistory = true) {
        try {
            // Normalize section name (remove hash if present and convert to lowercase)
            const normalizedSection = section.replace(/^#/, '').toLowerCase();
            console.group('Navigation');
            console.log('Navigating to section:', normalizedSection);
            
            if (normalizedSection === this.currentSection) {
                console.log('Section is already active');
                console.groupEnd();
                return;
            }
            
            // Store previous section for potential fallback
            const previousSection = this.currentSection;
            
            // Update current section before loading to prevent race conditions
            this.currentSection = normalizedSection;
            
            // Update URL without page reload if requested
            if (updateHistory) {
                console.log('Updating URL hash to:', `#${normalizedSection}`);
                window.history.pushState({ section: normalizedSection }, '', `#${normalizedSection}`);
            }
            
            // Load the section
            console.log('Attempting to load section...');
            const loadSuccess = await this.loadSection(normalizedSection);
            
            if (!loadSuccess) {
                console.error(`Failed to load section: ${normalizedSection}`);
                // Revert to previous section if load fails
                this.currentSection = previousSection;
                
                // Fall back to dashboard if section fails to load
                if (normalizedSection !== 'dashboard' && normalizedSection !== 'dashboard-content') {
                    console.log('Falling back to dashboard...');
                    await this.navigateTo('dashboard', updateHistory);
                }
                console.groupEnd();
                return;
            }
            
            // Update active state on nav items after successful load
            const navItems = document.querySelectorAll('.nav-item');
            console.log(`Found ${navItems.length} navigation items`);
            
            let activeItemFound = false;
            navItems.forEach(item => {
                const itemSection = item.getAttribute('data-section');
                const isActive = itemSection === normalizedSection || 
                               (itemSection === 'dashboard-content' && normalizedSection === 'dashboard') ||
                               (itemSection === 'dashboard' && normalizedSection === 'dashboard-content');
                
                if (isActive) {
                    activeItemFound = true;
                    console.log(`Activating nav item: ${itemSection}`);
                }
                
                item.classList.toggle('active', isActive);
                
                // Update ARIA attributes for accessibility
                const link = item.querySelector('a');
                if (link) {
                    link.setAttribute('aria-current', isActive ? 'page' : null);
                }
            });
            
            if (!activeItemFound) {
                console.warn('No matching nav item found for section:', normalizedSection);
            }
            
            console.groupEnd();
            return true;
            
        } catch (error) {
            console.error('Error in navigateTo:', error);
            console.groupEnd();
            return false;
        }
    }

    // Helper method to update the active navigation item
    updateActiveNav(section) {
        document.querySelectorAll('.nav-item').forEach(item => {
            const itemSection = item.getAttribute('data-section');
            const isActive = itemSection === section;
            item.classList.toggle('active', isActive);
            
            // Update ARIA attributes for accessibility
            const link = item.querySelector('a');
            if (link) {
                link.setAttribute('aria-current', isActive ? 'page' : null);
            }
        });
    }
    
    // Helper method to restore UI after loading
    restoreUI(contentWrapper, animate) {
        if (animate) {
            setTimeout(() => {
                contentWrapper.style.opacity = '1';
                contentWrapper.style.pointerEvents = 'auto';
            }, 200);
        } else {
            contentWrapper.style.opacity = '1';
            contentWrapper.style.pointerEvents = 'auto';
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
    // Helper method to find section element by various methods
    findSectionElement(section) {
        if (!section) return null;
        
        // Try exact ID match first
        let element = document.getElementById(section);
        if (element) return element;
        
        // Try with -content suffix
        if (!section.endsWith('-content')) {
            element = document.getElementById(`${section}-content`);
            if (element) return element;
        }
        
        // Try data-section attribute
        element = document.querySelector(`[data-section="${section}"]`);
        if (element) return element;
        
        // Try partial ID match as last resort
        return document.querySelector(`[id*="${section}"]`);
    }
    
    async loadSection(section, animate = true) {
        console.group('loadSection Debug');
        console.log('Attempting to load section:', section);
        
        const contentWrapper = document.querySelector('.content-wrapper');
        if (!contentWrapper) {
            console.error('❌ Content wrapper not found');
            console.groupEnd();
            return false;
        }

        // Show loading state
        if (animate) {
            contentWrapper.style.opacity = '0.5';
            contentWrapper.style.pointerEvents = 'none';
        }

        try {
            // Get all section elements
            const allSections = document.querySelectorAll('.content-section');
            console.log('📋 All available sections:', 
                Array.from(allSections).map(s => s.id).join(', '));
            
            // Hide all sections first
            allSections.forEach(el => {
                el.style.display = 'none';
            });
            
            // Try different ways to find the target section
            const sectionElement = this.findSectionElement(section);
            
            if (!sectionElement) {
                console.error(`❌ Section not found: ${section}`);
                if (section !== 'dashboard' && section !== 'dashboard-content') {
                    console.log('🔄 Falling back to dashboard...');
                    console.groupEnd();
                    return this.loadSection('dashboard', animate);
                }
                throw new Error('Dashboard content not found');
            }
            
            // Show the target section
            console.log(`✅ Showing section: ${sectionElement.id}`);
            sectionElement.style.display = 'block';
            
            // Call section-specific initialization if it exists
            const sectionName = sectionElement.id.replace(/-content$/, '');
            const initFnName = `init${sectionName.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join('')}`;
            
            if (typeof window[initFnName] === 'function') {
                console.log(`🔧 Initializing section: ${initFnName}`);
                try {
                    await window[initFnName]();
                } catch (e) {
                    console.error(`❌ Error in ${initFnName}:`, e);
                }
            } else {
                console.log(`ℹ️ No initialization function found: ${initFnName}`);
            }
            
            // Update active navigation
            this.updateActiveNav(sectionElement.id);
            
            console.groupEnd();
            return true;
            
        } catch (error) {
            console.error('❌ Error in loadSection:', error);
            console.groupEnd();
            return false;
        } finally {
            // Always restore UI
            this.restoreUI(contentWrapper, animate);
        }
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
    
    // Load section from URL hash if present
    const initialSection = window.location.hash.substring(1) || 'dashboard';
    if (initialSection !== 'dashboard') {
        app.navigateTo(initialSection);
    }
});
