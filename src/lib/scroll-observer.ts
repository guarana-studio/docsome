import { store } from "./store.svelte";

interface Section {
  slug: string;
  startY: number;
  endY: number;
  /** The slug of the nearest h2/h3 parent (for mapping h4/h5/h6 back to sidebar-visible headings) */
  parentSlug: string;
}

interface ScrollObserverOptions {
  /** Container element selector or element that contains the content */
  container: string | Element;
  /** Heading selectors to track (default: "h1, h2, h3, h4, h5, h6") */
  headingSelector?: string;
  /** Viewport offset from top (0-1) for determining active section (default: 0.3) */
  viewportOffset?: number;
  /** Minimum scroll delta to trigger update (default: 2) */
  scrollThreshold?: number;
  /** Callback when active section changes */
  onChange?: (slug: string) => void;
}

/**
 * Creates a scroll observer that tracks which content section is currently active.
 * Sections are defined as heading + content until the next heading.
 */
export function createScrollObserver(options: ScrollObserverOptions) {
  const {
    container,
    headingSelector = "h1, h2, h3, h4, h5, h6",
    viewportOffset = 0.3,
    scrollThreshold = 2,
    onChange,
  } = options;

  let sections: Section[] = [];
  let rafId: number = 0;
  let lastScrollY = 0;
  let isActive = false;

  function getContainer(): Element | null {
    return typeof container === "string" ? document.querySelector(container) : container;
  }

  function calculateSections(): Section[] {
    const main = getContainer();
    if (!main) return [];

    const headings = Array.from(main.querySelectorAll(headingSelector));
    if (headings.length === 0) return [];

    const mainRect = main.getBoundingClientRect();
    const mainTop = mainRect.top + window.scrollY;
    const mainBottom = mainRect.bottom + window.scrollY;

    // Track the nearest h2/h3 parent for h4/h5/h6 headings
    let lastSidebarVisibleSlug = "";

    const sections: Section[] = headings.map((heading, index) => {
      const nextHeading = headings[index + 1];
      const headingRect = heading.getBoundingClientRect();
      const headingTag = heading.tagName.toLowerCase();

      // Section starts at the heading's absolute position
      const startY = headingRect.top + window.scrollY;

      // Section ends at the next heading's top, or the end of the document
      let endY: number;
      if (nextHeading) {
        endY = nextHeading.getBoundingClientRect().top + window.scrollY;
      } else {
        // Last section goes to the end of main content
        endY = mainBottom;
      }

      // Update the last sidebar-visible slug if this is h2 or h3
      if (headingTag === "h2" || headingTag === "h3") {
        lastSidebarVisibleSlug = heading.id;
      }

      return {
        slug: heading.id,
        startY,
        endY,
        // For h2/h3, parent is itself. For h4/h5/h6, parent is the last h2/h3
        parentSlug: lastSidebarVisibleSlug || heading.id,
      };
    });

    // Add a virtual section for content before the first heading (if any)
    if (sections.length > 0 && sections[0].startY > mainTop) {
      sections.unshift({
        slug: sections[0].slug,
        startY: mainTop,
        endY: sections[0].startY,
        parentSlug: sections[0].parentSlug,
      });
    }

    // Extend the last section to the end of the document (not just main content)
    // This ensures scrolling past the last paragraph still keeps the last heading active
    if (sections.length > 0) {
      const lastSection = sections[sections.length - 1];
      lastSection.endY = Math.max(document.documentElement.scrollHeight, mainBottom);
    }

    return sections;
  }

  function findActiveSection(): Section | null {
    if (sections.length === 0) return null;

    const scrollPos = window.scrollY;
    // Use a viewport-relative trigger point (20% from top)
    // This gives a good balance between early activation and stability
    const viewportTrigger = scrollPos + window.innerHeight * 0.2;

    // Find the section that contains the viewport trigger point
    for (const section of sections) {
      if (viewportTrigger >= section.startY && viewportTrigger < section.endY) {
        return section;
      }
    }

    // If we're past all sections, use the last one
    if (viewportTrigger >= sections[sections.length - 1].endY) {
      return sections[sections.length - 1];
    }

    // If we're before all sections, use the first one
    if (viewportTrigger < sections[0].startY) {
      return sections[0];
    }

    // Should never reach here, but return first section as ultimate fallback
    return sections[0];
  }

  function updateActiveSection() {
    const activeSection = findActiveSection();
    if (!activeSection) return;

    // Use parentSlug for sidebar highlighting (maps h4/h5/h6 to their parent h3)
    const { slug, parentSlug } = activeSection;
    store.setActiveSlug(parentSlug);

    // Update URL hash to the actual heading (not parent)
    const hash = `#${slug}`;
    if (location.hash !== hash) {
      history.replaceState(null, "", hash);
    }

    onChange?.(parentSlug);
  }

  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      // Always update on scroll direction changes or significant movement
      // This ensures responsiveness while still throttling
      if (Math.abs(currentScrollY - lastScrollY) > scrollThreshold || sections.length === 0) {
        lastScrollY = currentScrollY;
        updateActiveSection();
      }
      rafId = 0;
    });
  }

  function onResize() {
    sections = calculateSections();
    updateActiveSection();
  }

  /**
   * Initialize the observer
   */
  function init(): void {
    if (isActive) return;

    // Wait for DOM to be fully rendered
    requestAnimationFrame(() => {
      sections = calculateSections();

      // Set initial active section from URL hash or current position
      const initialHash = window.location.hash.slice(1);
      if (initialHash && sections.some((s) => s.slug === initialHash)) {
        store.setActiveSlug(initialHash);
      } else {
        updateActiveSection();
      }
    });

    lastScrollY = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    isActive = true;
  }

  /**
   * Destroy the observer and clean up event listeners
   */
  function destroy(): void {
    if (!isActive) return;

    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    if (rafId) cancelAnimationFrame(rafId);
    isActive = false;
  }

  /**
   * Manually refresh section boundaries (useful after content changes)
   */
  function refresh(): void {
    sections = calculateSections();
    updateActiveSection();
  }

  /**
   * Get the currently active section slug
   */
  function getActiveSlug(): string {
    return store.activeSlug;
  }

  return {
    init,
    destroy,
    refresh,
    getActiveSlug,
  };
}

export type { ScrollObserverOptions };
