(function () {
  const SCRIPT =
    document.currentScript ||
    document.querySelector('script[data-searchier-store]');
  if (!SCRIPT) return;

  const STORE_ID = SCRIPT.dataset.searchierStore;
  if (!STORE_ID) return;

  const scriptUrl = new URL(SCRIPT.src, window.location.href);
  const API_BASE = new URL("/api/products", scriptUrl.origin).toString();
  const EVENTS_ENDPOINT = new URL(
    "/api/searchier/events",
    scriptUrl.origin,
  ).toString();
  const TRIGGER_SELECTOR = "[data-searchier], #searchier";

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

  async function fetchProducts(storeId, query, cursor, limit) {
    const params = new URLSearchParams({
      storeId,
      first: String(limit ?? 8),
    });
    if (query) params.set("q", query);
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(`${API_BASE}?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch products");
    return await response.json();
  }

  function createModal() {
    const overlay = createElement("div", "searchier-overlay");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(10, 11, 20, 0.65)";
    overlay.style.backdropFilter = "blur(20px)";
    overlay.style.display = "none";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "9999";
    overlay.style.padding = "16px";

    const modal = createElement("div", "searchier-modal");
    modal.style.width = "min(480px, 100%)";
    modal.style.maxHeight = "min(540px, 90vh)";
    modal.style.background = "rgba(25, 26, 35, 0.9)";
    modal.style.borderRadius = "32px";
    modal.style.padding = "24px";
    modal.style.boxShadow = "0 25px 80px rgba(0,0,0,0.45)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.gap = "20px";
    modal.style.fontFamily =
      'system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif';
    modal.style.color = "#f5f5f7";

    const header = createElement("div", "searchier-modal-header");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";

    const title = createElement("h3", null, "Search Products");
    title.style.fontSize = "1.1rem";
    title.style.fontWeight = "600";
    title.style.margin = "0";
    header.appendChild(title);

    const closeButton = createElement("button", "searchier-close", "✕");
    closeButton.type = "button";
    closeButton.style.background = "transparent";
    closeButton.style.border = "none";
    closeButton.style.color = "#f5f5f7";
    closeButton.style.fontSize = "1.2rem";
    closeButton.style.cursor = "pointer";
    closeButton.style.opacity = "0.6";
    closeButton.style.transition = "opacity 0.2s ease";
    closeButton.addEventListener("mouseenter", () => {
      closeButton.style.opacity = "1";
    });
    closeButton.addEventListener("mouseleave", () => {
      closeButton.style.opacity = "0.6";
    });
    header.appendChild(closeButton);

    const inputWrapper = createElement("div", "searchier-input-wrapper");
    inputWrapper.style.position = "relative";

    const input = createElement("input");
    input.type = "search";
    input.placeholder = "Search for products...";
    input.style.width = "100%";
    input.style.border = "1px solid rgba(255,255,255,0.25)";
    input.style.borderRadius = "18px";
    input.style.background = "rgba(255,255,255,0.14)";
    input.style.padding = "12px 16px";
    input.style.fontSize = "1rem";
    input.style.color = "#fff";
    input.style.outline = "none";
    input.style.boxShadow = "inset 0 2px 6px rgba(0,0,0,0.25)";

    inputWrapper.appendChild(input);

    const resultsContainer = createElement("div", "searchier-results");
    resultsContainer.style.flex = "1";
    resultsContainer.style.overflowY = "auto";
    resultsContainer.style.display = "none";
    resultsContainer.style.gap = "12px";
    resultsContainer.style.flexDirection = "column";

    modal.appendChild(header);
    modal.appendChild(inputWrapper);
    modal.appendChild(resultsContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    return { overlay, modal, input, resultsContainer, closeButton };
  }

  const modalUI = createModal();

  async function sendEvent(body) {
    try {
      await fetch(EVENTS_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ storeId: STORE_ID, ...body }),
      });
    } catch (error) {
      console.warn("Searchier: analytics event failed", error);
    }
  }

  function attachSearchBehavior() {
    const container = modalUI.resultsContainer;
    const input = modalUI.input;

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
      modalUI.overlay.style.display = "none";
      container.style.display = "none";
    };

    const showPanel = () => {
      state.active = true;
      modalUI.overlay.style.display = "flex";
      if (state.edges.length > 0 || state.loading) {
        container.style.display = "flex";
      }
      input.focus();
    };

    const render = () => {
      container.innerHTML = "";
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "12px";

      if (!state.loading && state.edges.length === 0) {
        const empty = createElement(
          "div",
          "searchier-empty",
          state.query || state.initialized
            ? "No products match your search."
            : "Discover products curated for you.",
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
            const slug =
              edge.node.slug || edge.node.id.split("_").pop();
            sendEvent({
              type: "click",
              query: state.query,
              productId: edge.node.id,
              productName: edge.node.name,
              productSlug: slug,
            });
            window.location.href = `/products/${slug}`;
          });

          const thumb = createElement("div", "searchier-thumb");
          thumb.style.width = "64px";
          thumb.style.height = "64px";
          thumb.style.borderRadius = "16px";
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
          info.style.flex = "1";
          info.style.minWidth = "0";

          const title = createElement("div", "searchier-title", edge.node.name);
          title.style.fontSize = "0.95rem";
          title.style.fontWeight = "600";
          title.style.whiteSpace = "nowrap";
          title.style.overflow = "hidden";
          title.style.textOverflow = "ellipsis";

          info.appendChild(title);

          product.appendChild(thumb);
          product.appendChild(info);
          container.appendChild(product);
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

    const loadProducts = async (reset, limitOverride) => {
      if (state.loading) return;
      state.loading = true;
      render();
      try {
        const data = await fetchProducts(
          STORE_ID,
          state.query,
          reset ? undefined : state.cursor,
          limitOverride ?? (state.query ? 8 : 4),
        );
        if (reset) {
          state.edges = data.edges ?? [];
        } else {
          state.edges = state.edges.concat(data.edges ?? []);
        }
        state.nextCursor = data.pageInfo?.endCursor ?? undefined;
        state.cursor = state.nextCursor;
        state.hasNext = Boolean(data.pageInfo?.hasNextPage);
        state.initialized = true;
        if (reset) {
          sendEvent({
            type: "search",
            query: state.query,
            resultsCount: state.edges.length,
          });
        }
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
        if (state.initialized) {
          loadProducts(true, 4);
        } else {
          container.style.display = "none";
        }
      }
    }, 500);

    input.addEventListener("input", onInput);

    modalUI.closeButton.addEventListener("click", hidePanel);
    modalUI.overlay.addEventListener("click", (event) => {
      if (event.target === modalUI.overlay) {
        hidePanel();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.active) {
        hidePanel();
      }
    });

    return {
      open: () => {
        showPanel();
        if (!state.initialized) {
          loadProducts(true, 4);
        } else if (state.query) {
          loadProducts(true);
        } else if (state.edges.length === 0) {
          loadProducts(true, 4);
        } else {
          render();
        }
      },
    };
  }

  const modalController = attachSearchBehavior();

  function init() {
    const processed = new WeakSet();

    const scan = () => {
      const triggers = document.querySelectorAll(TRIGGER_SELECTOR);
      triggers.forEach((trigger) => {
        if (!processed.has(trigger)) {
          processed.add(trigger);
          trigger.addEventListener("click", (event) => {
            event.preventDefault();
            modalController.open();
          });
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
