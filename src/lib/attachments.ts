import type { Attachment } from "svelte/attachments";

/**
 * Creates an attachment that highlights keywords in an HTML element by wrapping them in <mark> tags.
 * @param keywords - Array of keywords to highlight
 * @returns An attachment function
 * @example
 * <p {@attach mark(['test'])}>
 *   test paragraph
 * </p>
 * // Output: <p><mark>test</mark> paragraph</p>
 */
export function mark(keywords: string[]): Attachment {
  return (element) => {
    if (!(element instanceof HTMLElement)) return;
    if (keywords.length === 0) return;

    // Store original HTML for cleanup
    const originalHTML = element.innerHTML;

    // Escape special regex characters in keywords
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Create regex pattern for all keywords (case-insensitive)
    const pattern = new RegExp(`(${keywords.map(escapeRegex).join("|")})`, "gi");

    // Replace text content while preserving HTML structure
    const highlightNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        const parts = text.split(pattern);

        if (parts.length <= 1) return;

        const fragment = document.createDocumentFragment();
        for (const part of parts) {
          if (keywords.some((k) => k.toLowerCase() === part.toLowerCase())) {
            const mark = document.createElement("mark");
            mark.textContent = part;
            fragment.appendChild(mark);
          } else {
            fragment.appendChild(document.createTextNode(part));
          }
        }

        node.parentNode?.replaceChild(fragment, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Skip already highlighted elements and script/style tags
        const el = node as Element;
        if (el.tagName === "MARK" || el.tagName === "SCRIPT" || el.tagName === "STYLE") {
          return;
        }
        // Process child nodes
        Array.from(el.childNodes).forEach(highlightNode);
      }
    };

    // Process all child nodes
    Array.from(element.childNodes).forEach(highlightNode);

    // Return cleanup function
    return () => {
      element.innerHTML = originalHTML;
    };
  };
}

/**
 * Creates an attachment that truncates text to show only the context around the first matched keyword.
 * @param keywords - Array of keywords to search for
 * @param wordPadding - Number of words to include before and after the matched keyword (default: 3)
 * @returns An attachment function
 * @example
 * <p {@attach truncate(['test'], 2)}>
 *   This is a long paragraph with test keyword in the middle of the text
 * </p>
 * // Output: <p>...paragraph with <mark>test</mark> keyword in...</p>
 */
export function truncate(keywords: string[], wordPadding = 3): Attachment {
  return (element) => {
    if (!(element instanceof HTMLElement)) return;
    if (keywords.length === 0) return;

    // Store original HTML for cleanup
    const originalHTML = element.innerHTML;

    // Escape special regex characters in keywords
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Create regex pattern for all keywords (case-insensitive)
    const pattern = new RegExp(`(${keywords.map(escapeRegex).join("|")})`, "i");

    // Get all text content from the element
    const getAllText = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || "";
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (el.tagName === "SCRIPT" || el.tagName === "STYLE") {
          return "";
        }
        return Array.from(el.childNodes).map(getAllText).join("");
      }
      return "";
    };

    const fullText = getAllText(element);

    // Find the first match
    const match = fullText.match(pattern);
    if (!match || match.index === undefined) return;

    const matchedKeyword = match[0];
    const matchIndex = match.index;

    // Split text into words
    const words = fullText.split(/\s+/);

    // Find which word contains the match
    let charCount = 0;
    let matchWordIndex = -1;
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (charCount <= matchIndex && matchIndex < charCount + word.length) {
        matchWordIndex = i;
        break;
      }
      charCount += word.length + 1; // +1 for the space
    }

    if (matchWordIndex === -1) return;

    // Calculate the range of words to include
    // If no words before match, double the padding after
    // If no words after match, double the padding before
    const hasWordsBefore = matchWordIndex > 0;
    const hasWordsAfter = matchWordIndex < words.length - 1;

    let effectivePaddingBefore = wordPadding;
    let effectivePaddingAfter = wordPadding;

    if (!hasWordsBefore && hasWordsAfter) {
      effectivePaddingAfter = wordPadding * 2;
    } else if (!hasWordsAfter && hasWordsBefore) {
      effectivePaddingBefore = wordPadding * 2;
    }

    const startWordIndex = Math.max(0, matchWordIndex - effectivePaddingBefore);
    const endWordIndex = Math.min(words.length - 1, matchWordIndex + effectivePaddingAfter);

    // Build the truncated text
    const beforeWords = words.slice(startWordIndex, matchWordIndex);
    const afterWords = words.slice(matchWordIndex + 1, endWordIndex + 1);

    // Reconstruct the text with ellipsis and highlighted keyword
    const prefix = startWordIndex > 0 ? "..." : "";
    const suffix = endWordIndex < words.length - 1 ? "..." : "";

    // Create the new HTML content
    const escapedKeywords = keywords.map(escapeRegex);
    const highlightPattern = new RegExp(`(${escapedKeywords.join("|")})`, "gi");

    const highlightText = (text: string): string => {
      return text.replace(highlightPattern, "<mark>$1</mark>");
    };

    const beforeText = highlightText(beforeWords.join(" "));
    const highlightedKeyword = `<mark>${matchedKeyword}</mark>`;
    const afterText = highlightText(afterWords.join(" "));

    const parts: string[] = [];
    if (prefix) parts.push(prefix);
    if (beforeText) parts.push(beforeText);
    parts.push(highlightedKeyword);
    if (afterText) parts.push(afterText);
    if (suffix) parts.push(suffix);

    element.innerHTML = parts.join(" ");

    // Return cleanup function
    return () => {
      element.innerHTML = originalHTML;
    };
  };
}
