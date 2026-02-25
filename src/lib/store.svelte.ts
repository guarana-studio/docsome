import MiniSearch from "minisearch";
import appContext from "virtual:docsome";

const { paragraphs, outline } = appContext;

function getFirstHeadingSlug(): string {
  const mainEl = outline?.[0];
  const firstNode = outline?.[0]?.children?.[0];
  return mainEl?.slug ?? firstNode?.slug ?? "";
}

class Store {
  activeSlug = $state<string>(getFirstHeadingSlug());
  miniSearch = $state<MiniSearch>();

  init() {
    this.miniSearch = new MiniSearch({
      fields: ["title", "text"],
      storeFields: ["title", "text"],
      searchOptions: {
        fuzzy: 0.4,
      },
    });
    this.miniSearch.addAll(paragraphs);
  }

  setActiveSlug(slug: string) {
    this.activeSlug = slug;
  }
}

export const store = new Store();
