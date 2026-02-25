import MiniSearch from "minisearch";
import appContext from "virtual:docsome";

const { paragraphs, outline } = appContext;

class Store {
  activeSlug = $state<string>(outline?.[0]?.slug ?? "");
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
