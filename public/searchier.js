(function () {
  const SCRIPT =
    document.currentScript ||
    document.querySelector('script[data-searchier-store]');
  if (!SCRIPT) return;

  const STORE_ID = SCRIPT.dataset.searchierStore;
  if (!STORE_ID) return;

  const scriptUrl = new URL(SCRIPT.src, window.location.href);
  const API_BASE = new URL("/api/products", scriptUrl.origin).toString();
  const INPUT_SELECTOR = 'input[data-searchier], input#searchier';

  const createElement = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  async function fetchProducts(storeId, query, cursor) {
    const params = new URLSearchParams({ storeId, first: "8" });
    if (query) params.set("q", query);
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(`${API_BASE}?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch products");
    return await response.json();
  }

  function ensureContainer(input) {
    const existingId = input.getAttribute("data-searchier-results");
    if (existingId) {
      const existing = document.getElementById(existingId);
      if (existing) return existing;
    }

    const wrapper = createElement("div", "searchier-wrapper");
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-block";
    wrapper.style.width = input.offsetWidth ? `${input.offsetWidth}px` : "320px";

    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const panel = createElement("div", "searchier-panel");
    panel.style.position = "absolute";
    panel.style.top = "calc(100% + 12px)";
    panel.style.left = "50%";
    panel.style.transform = "translateX(-50%)";
    panel.style.width = "min(360px, calc(100vw - 32px))";
    panel.style.maxHeight = "420px";
    panel.style.background = "rgba(20, 20, 25, 0.85)";
    panel.style.borderRadius = "24px";
    panel.style.padding = "16px";
    panel.style.boxShadow = "0 20px 60px rgba(0, 0, 0, 0.45)";
    panel.style.backdropFilter = "blur(24px)";
    panel.style.color = "#f5f5f7";
    panel.style.fontFamily =
      'system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif';
    panel.style.display = "none";
    panel.style.flexDirection = "column";
    panel.style.gap = "12px";
    panel.style.zIndex = "9999";

    wrapper.appendChild(panel);
    return panel;
  }

  function attachSearchBehavior(input) {
    const container = ensureContainer(input);

    const state = {
      query: "",
      cursor: undefined,
      nextCursor: undefined,
      hasNext: false,
      loading: false,
      edges: [],
      active: false,
    };

    const hidePanel = () => {
      state.active = false;
      container.style.display = "none";
    };

    const showPanel = () => {
      state.active = true;
      container.style.display = "flex";
    };

    const render = () => {
      container.innerHTML = "";

      const header = createElement("div", "searchier-header");
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "center";
      header.style.fontSize = "0.75rem";
      header.style.textTransform = "uppercase";
      header.style.letterSpacing = "0.08em";
      header.style.opacity = "0.7";
      header.textContent = "Products";
      container.appendChild(header);

      const list = createElement("div", "searchier-list");
      list.style.display = "flex";
      list.style.flexDirection = "column";
      list.style.gap = "8px";
      container.appendChild(list);

      if (!state.loading && state.edges.length === 0) {
        const empty = createElement(
          "div",
          "searchier-empty",
          state.query ? "No products match your search." : "Start typing to search products.",
        );
        empty.style.textAlign = "center";
        empty.style.padding = "32px 0";
        empty.style.opacity = "0.75";
        container.appendChild(empty);
      } else {
        state.edges.forEach((edge) => {
          const product = createElement("button", "searchier-item");
          product.type = "button";
          product.style.display = "flex";
          product.style.alignItems = "center";
          product.style.gap = "12px";
          product.style.width = "100%";
          product.style.background = "rgba(255, 255, 255, 0.05)";
          product.style.border = "1px solid rgba(255, 255, 255, 0.08)";
          product.style.borderRadius = "16px";
          product.style.padding = "10px 12px";
          product.style.cursor = "pointer";
          product.style.color = "inherit";
          product.style.textAlign = "left";
          product.style.transition = "background 0.2s ease, transform 0.2s ease";
          product.addEventListener("mouseenter", () => {
            product.style.background = "rgba(255, 255, 255, 0.1)";
            product.style.transform = "translateY(-1px)";
          });
          product.addEventListener("mouseleave", () => {
            product.style.background = "rgba(255, 255, 255, 0.05)";
            product.style.transform = "translateY(0)";
          });

          product.addEventListener("click", (event) => {
            event.preventDefault();
            const slug = edge.node.slug || edge.node.id.split("_").pop();
            const target = `/products/${slug}`;
            window.location.href = target;
          });

          const thumb = createElement("div", "searchier-thumb");
          thumb.style.width = "48px";
          thumb.style.height = "48px";
          thumb.style.borderRadius = "12px";
          thumb.style.background = "rgba(255,255,255,0.08)";
          thumb.style.display = "flex";
          thumb.style.alignItems = "center";
          thumb.style.justifyContent = "center";
          thumb.style.overflow = "hidden";

          if (edge.node.thumbnail?.path) {
            const img = createElement("img");
            img.src = edge.node.thumbnail.path;
            img.alt = edge.node.name;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            thumb.appendChild(img);
          } else {
            const fallback = createElement("span", "", "🛍️");
            fallback.style.fontSize = "1.25rem";
            thumb.appendChild(fallback);
          }

          const info = createElement("div", "searchier-info");
          info.style.display = "flex";
          info.style.flexDirection = "column";
          info.style.gap = "4px";

          const title = createElement("div", "searchier-title", edge.node.name);
          title.style.fontSize = "0.95rem";
          title.style.fontWeight = "600";

          const meta = createElement(
            "div",
            "searchier-meta",
            `ID: ${edge.node.id}`,
          );
          meta.style.fontSize = "0.75rem";
          meta.style.opacity = "0.65";

          info.appendChild(title);
          info.appendChild(meta);

          product.appendChild(thumb);
          product.appendChild(info);
          list.appendChild(product);
        });
      }

      if (state.loading) {
        const loading = createElement(
          "div",
          "searchier-loading",
          "Searching…",
        );
        loading.style.textAlign = "center";
        loading.style.padding = "12px 0";
        loading.style.opacity = "0.7";
        container.appendChild(loading);
      } else if (state.hasNext) {
        const loadMore = createElement("button", "searchier-load-more", "Load more results");
        loadMore.style.background = "rgba(255,255,255,0.08)";
        loadMore.style.border = "1px solid rgba(255,255,255,0.1)";
        loadMore.style.borderRadius = "999px";
        loadMore.style.padding = "10px 18px";
        loadMore.style.color = "inherit";
        loadMore.style.cursor = "pointer";
        loadMore.style.alignSelf = "center";
        loadMore.addEventListener("click", () => {
          state.cursor = state.nextCursor;
          loadProducts(false);
        });
        container.appendChild(loadMore);
      }
    };

    const loadProducts = async (reset) => {
      if (state.loading) return;
      state.loading = true;
      render();
      try {
        const data = await fetchProducts(
          STORE_ID,
          state.query,
          reset ? undefined : state.cursor,
        );
        if (reset) {
          state.edges = data.edges ?? [];
        } else {
          state.edges = state.edges.concat(data.edges ?? []);
        }
        state.nextCursor = data.pageInfo?.endCursor ?? undefined;
        state.cursor = state.nextCursor;
        state.hasNext = Boolean(data.pageInfo?.hasNextPage);
      } catch (error) {
        console.error("Searchier: failed to load products", error);
      } finally {
        state.loading = false;
        render();
      }
    };

    const onInput = debounce((event) => {
      state.query = event.target.value.trim();
      state.cursor = undefined;
      if (state.query) {
        showPanel();
        loadProducts(true);
      } else {
        state.edges = [];
        render();
      }
    }, 250);

    input.addEventListener("input", onInput);
    input.addEventListener("focus", () => {
      if (state.query) {
        showPanel();
      }
    });
    input.addEventListener("blur", () => {
      setTimeout(() => {
        if (!container.contains(document.activeElement)) {
          hidePanel();
        }
      }, 150);
    });

    // Initial styling to match floating Apple-like input
    input.style.border = "1px solid rgba(255,255,255,0.2)";
    input.style.borderRadius = "18px";
    input.style.padding = "10px 18px";
    input.style.background = "rgba(255,255,255,0.15)";
    input.style.color = "#fff";
    input.style.backdropFilter = "blur(20px)";
    input.style.boxShadow = "0 10px 40px rgba(0,0,0,0.25)";
    input.style.fontSize = "1rem";
    input.style.width = "100%";
  }

  function init() {
    const processed = new WeakSet();

    const scan = () => {
      const inputs = document.querySelectorAll(INPUT_SELECTOR);
      inputs.forEach((input) => {
        if (!processed.has(input)) {
          processed.add(input);
          attachSearchBehavior(input);
        }
      });
    };

    scan();

    const observer = new MutationObserver(() => {
      scan();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
