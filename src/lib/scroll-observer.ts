import { store } from "./store.svelte";

interface Section {
  slug: string;
  startY: number;
  endY: number;
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

    return headings.map((heading, index) => {
      const nextHeading = headings[index + 1];

      // Section starts at the heading's absolute position
      const startY = heading.getBoundingClientRect().top + window.scrollY;

      // Section ends at the next heading's top, or the end of the document
      let endY: number;
      if (nextHeading) {
        endY = nextHeading.getBoundingClientRect().top + window.scrollY;
      } else {
        // Last section goes to the end of main content
        endY = main.getBoundingClientRect().bottom + window.scrollY;
      }

      return {
        slug: heading.id,
        startY,
        endY,
      };
    });
  }

  function findActiveSection(): Section | null {
    if (sections.length === 0) return null;

    const scrollPos = window.scrollY;
    // Use a smaller offset (10% from top) to activate sections earlier
    const viewportTrigger = scrollPos + window.innerHeight * 0.1;

    // Find the section that contains the viewport trigger point
    for (const section of sections) {
      if (viewportTrigger >= section.startY && viewportTrigger < section.endY) {
        return section;
      }
    }

    // Fallback: if we're past the last section, use the last one
    if (viewportTrigger >= sections[sections.length - 1].startY) {
      return sections[sections.length - 1];
    }

    // Fallback: if we're before the first section, use the first one
    if (viewportTrigger < sections[0].startY) {
      return sections[0];
    }

    return null;
  }

  function updateActiveSection() {
    const activeSection = findActiveSection();
    if (!activeSection) return;

    const { slug } = activeSection;
    store.setActiveSlug(slug);

    // Update URL hash without scrolling
    const hash = `#${slug}`;
    if (location.hash !== hash) {
      history.replaceState(null, "", hash);
    }

    onChange?.(slug);
  }

  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      if (Math.abs(window.scrollY - lastScrollY) > scrollThreshold) {
        lastScrollY = window.scrollY;
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
