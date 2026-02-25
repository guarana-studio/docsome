import { store } from "./store.svelte";

interface Section {
  slug: string;
  startY: number;
  endY: number;
  parentSlug: string;
}

interface ScrollObserverOptions {
  /** Container element selector or element that contains the content */
  container: string | Element;
  /** Heading selectors to track (default: "h1, h2, h3, h4, h5, h6") */
  headingSelector?: string;
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

    let lastParentSlug = "";

    const sections: Section[] = headings.map((heading, index) => {
      const nextHeading = headings[index + 1];
      const headingRect = heading.getBoundingClientRect();
      const tag = heading.tagName.toLowerCase();

      const startY = headingRect.top + window.scrollY;
      const endY = nextHeading
        ? nextHeading.getBoundingClientRect().top + window.scrollY
        : mainBottom;

      if (tag === "h2" || tag === "h3") {
        lastParentSlug = heading.id;
      }

      return {
        slug: heading.id,
        startY,
        endY,
        parentSlug: lastParentSlug || heading.id,
      };
    });

    if (sections.length > 0) {
      // Virtual section for content before first heading
      if (sections[0].startY > mainTop) {
        sections.unshift({
          slug: sections[0].slug,
          startY: mainTop,
          endY: sections[0].startY,
          parentSlug: sections[0].parentSlug,
        });
      }
      // Extend last section to document end
      sections[sections.length - 1].endY = Math.max(
        document.documentElement.scrollHeight,
        mainBottom,
      );
    }

    return sections;
  }

  function findActiveSection(): Section | null {
    if (sections.length === 0) return null;

    const trigger = window.scrollY + window.innerHeight * 0.1;

    for (const section of sections) {
      if (trigger >= section.startY && trigger < section.endY) {
        return section;
      }
    }

    if (trigger >= sections[sections.length - 1].endY) {
      return sections[sections.length - 1];
    }

    return sections[0];
  }

  function updateActiveSection() {
    const section = findActiveSection();
    if (!section) return;

    store.setActiveSlug(section.parentSlug);

    const hash = `#${section.slug}`;
    if (location.hash !== hash) {
      history.replaceState(null, "", hash);
    }

    onChange?.(section.parentSlug);
  }

  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      const y = window.scrollY;
      if (Math.abs(y - lastScrollY) > scrollThreshold || sections.length === 0) {
        lastScrollY = y;
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
