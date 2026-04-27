/**
 * Yellow main.js
 * - Keep this file pure JS (no <script> tags, no HTML comments)
 * - External libs (gsap, ScrollTrigger, SplitText, ...) are loaded in Webflow
 */




/* -----------------------------
   Pixelated Scroll Transition
----------------------------- */
function initPixelatedScrollTransition() {
  
  // Defaults — edit these to change fallbacks if no data-attribute is added
  const defaultColumns = 12;
  const defaultRows = 6;
  const defaultMode = "cover";
  const defaultScrollStart = { cover: "bottom bottom", reveal: "top bottom" };
  const defaultScrollEnd = { cover: "bottom top", reveal: "top center" };
  const defaultScrub = 0.3;
  const defaultPixelDuration = 0.1;
  const defaultStaggerAmount = 1.5;

  // Class names applied to generated elements
  const panelClass = "pixelated-scroll-transition__panel";
  const columnClass = "pixelated-scroll-transition__col";
  const pixelClass = "pixelated-scroll-transition__pixel";

  // Breakpoints
  const breakpoints = {
    mobile: "(max-width: 478px)",
    landscape: "(max-width: 767px)",
    tablet: "(max-width: 991px)",
  };

  const instances = [];
  let mm = null;

  function getColumns(wrapper) {
    const base = parseInt(wrapper.dataset.columns, 10) || defaultColumns;

    if (window.matchMedia(breakpoints.mobile).matches) {
      return parseInt(wrapper.dataset.columnsMobile, 10) || Math.max(4, Math.round(base * 0.4));
    }
    if (window.matchMedia(breakpoints.landscape).matches) {
      return parseInt(wrapper.dataset.columnsLandscape, 10) || Math.max(6, Math.round(base * 0.6));
    }
    if (window.matchMedia(breakpoints.tablet).matches) {
      return parseInt(wrapper.dataset.columnsTablet, 10) || Math.max(8, Math.round(base * 0.75));
    }
    return base;
  }

  function getMode(wrapper) {
    return wrapper.dataset.mode === "reveal" ? "reveal" : defaultMode;
  }

  function getRows(wrapper) {
    const base = parseInt(wrapper.dataset.rows, 10) || defaultRows;

    if (window.matchMedia(breakpoints.mobile).matches) {
      return parseInt(wrapper.dataset.rowsMobile, 10) || base;
    }
    if (window.matchMedia(breakpoints.landscape).matches) {
      return parseInt(wrapper.dataset.rowsLandscape, 10) || base;
    }
    if (window.matchMedia(breakpoints.tablet).matches) {
      return parseInt(wrapper.dataset.rowsTablet, 10) || base;
    }
    return base;
  }

  function getScrollStart(wrapper, mode) {
    return wrapper.dataset.scrollStart || defaultScrollStart[mode];
  }

  function getScrollEnd(wrapper, mode) {
    return wrapper.dataset.scrollEnd || defaultScrollEnd[mode];
  }

  function createCol() {
    const col = document.createElement("div");
    col.classList.add(columnClass);
    col.setAttribute("data-pixelated-scroll-column", "");
    return col;
  }

  function createPixel() {
    const pixel = document.createElement("div");
    pixel.classList.add(pixelClass);
    pixel.setAttribute("data-pixelated-scroll-pixel", "");
    return pixel;
  }

  function buildGrid(wrapper, cols, rows) {
    const panel = document.createElement("div");
    panel.classList.add(panelClass);
    panel.setAttribute("data-pixelated-scroll-panel", "");

    const fragment = document.createDocumentFragment();
    for (let c = 0; c < cols; c++) {
      const col = createCol();
      for (let r = 0; r < rows; r++) {
        col.appendChild(createPixel());
      }
      fragment.appendChild(col);
    }
    panel.appendChild(fragment);
    wrapper.appendChild(panel);

    return { panel };
  }

  function collectCells(panel, cols, rows, mode) {
    const columns = panel.querySelectorAll("[data-pixelated-scroll-column]");
    const cellData = [];

    for (let r = 0; r < rows; r++) {
      columns.forEach((col, c) => {
        const pixel = col.children[r];
        if (!pixel) return;

        const dist = rows - 1 - r;
        const priority = dist * 50 + Math.random() * 300 + Math.sin(c * 0.3) * 30;

        cellData.push({ element: pixel, priority });
      });
    }

    cellData.sort((a, b) => a.priority - b.priority);
    return cellData.map((d) => d.element);
  }

  function createAnimation(wrapper, cells, section, mode) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: getScrollStart(wrapper, mode),
        end: getScrollEnd(wrapper, mode),
        scrub: defaultScrub,
        invalidateOnRefresh: true,
      },
    });

    const fromAlpha = mode === "cover" ? 0 : 1;
    const toAlpha = mode === "cover" ? 1 : 0;

    gsap.set(cells, { autoAlpha: fromAlpha });
    tl.to(cells, {
      autoAlpha: toAlpha,
      duration: defaultPixelDuration,
      stagger: { amount: defaultStaggerAmount, from: "start" },
      ease: "none",
    });

    return tl;
  }

  function setupInstance(wrapper) {
    const section = wrapper.closest("section") || wrapper.parentElement;
    const cols = getColumns(wrapper);
    const rows = getRows(wrapper);
    const mode = getMode(wrapper);

    const { panel } = buildGrid(wrapper, cols, rows);
    const cells = collectCells(panel, cols, rows, mode);
    const tl = createAnimation(wrapper, cells, section, mode);

    return { wrapper, tl };
  }

  function destroyInstance(instance) {
    if (instance.tl) {
      instance.tl.scrollTrigger?.kill();
      instance.tl.kill();
    }
    const panel = instance.wrapper.querySelector("[data-pixelated-scroll-panel]");
    if (panel) panel.remove();
  }

  function buildAll() {
    const wrappers = document.querySelectorAll("[data-pixelated-scroll-transition]");
    wrappers.forEach((wrapper) => {
      instances.push(setupInstance(wrapper));
    });
    ScrollTrigger.refresh();
  }

  function destroyAll() {
    instances.forEach(destroyInstance);
    instances.length = 0;
  }

  const wrappers = document.querySelectorAll("[data-pixelated-scroll-transition]");
  if (!wrappers.length) return;

  mm = gsap.matchMedia();

  mm.add(
    {
      isDesktop: "(min-width: 992px)",
      isTablet: "(min-width: 768px) and (max-width: 991px)",
      isLandscape: "(min-width: 479px) and (max-width: 767px)",
      isMobile: "(max-width: 478px)",
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      if (context.conditions.reduceMotion) return;

      buildAll();

      return () => {
        destroyAll();
      };
    }
  );
}

// Initialize Pixelated Scroll Transition
document.addEventListener("DOMContentLoaded", () => {
  initPixelatedScrollTransition();
});