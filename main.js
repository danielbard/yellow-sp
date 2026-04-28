/**
 * Yellow main.js
 * - Keep this file pure JS (no <script> tags, no HTML comments)
 * - External libs (gsap, ScrollTrigger, SplitText, ...) are loaded in Webflow
 */

function waitForGsap(cb, tries = 80) {
  if (window.gsap && window.ScrollTrigger) return cb();
  if (tries <= 0) return console.warn("GSAP / Plugins not loaded");
  setTimeout(() => waitForGsap(cb, tries - 1), 50);
}

function init() {
  waitForGsap(() => {
    if (window.gsap?.registerPlugin) {
      gsap.registerPlugin(ScrollTrigger);
    }
    initPixelatedScrollTransition();
    initImageTrail();
  });
}

window.Webflow = window.Webflow || [];
window.Webflow.push(init);

/* -----------------------------
   Pixelated Scroll Transition
----------------------------- */
function initPixelatedScrollTransition() {
  
  // Defaults — edit these to change fallbacks if no data-attribute is added
  const defaultColumns = 12;
  const defaultRows = 6;
  const defaultMode = "cover";
  const defaultScrollStart = { cover: "bottom bottom", reveal: "top top" };
  const defaultScrollEnd = { cover: "bottom top", reveal: "bottom bottom" };
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
    const section = wrapper.closest('.pixelated-scroll__container')
      || wrapper.closest("section")?.parentElement
      || wrapper.parentElement;
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

/* ----------------------------
   Image Trail Following Cursor
----------------------------- */
function initImageTrail(config = {}) {

  // config + defaults
  const options = {
    minWidth: config.minWidth ?? 992,
    moveDistance: config.moveDistance ?? 15,
    stopDuration: config.stopDuration ?? 300,
    trailLength: config.trailLength ?? 5
  };

  const wrapper = document.querySelector('[data-trail="wrapper"]');
  
  if (!wrapper || window.innerWidth < options.minWidth) {
    return;
  }
  
  // State management
  const state = {
    trailInterval: null,
    globalIndex: 0,
    last: { x: 0, y: 0 },
    trailImageTimestamps: new Map(),
    trailImages: Array.from(document.querySelectorAll('[data-trail="item"]')),
    isActive: false
  };

  // Utility functions
  const MathUtils = {
    lerp: (a, b, n) => (1 - n) * a + n * b,
    distance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)
  };

  function getRelativeCoordinates(e, rect) {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function activate(trailImage, x, y) {
    if (!trailImage) return;

    const rect = trailImage.getBoundingClientRect();
    const styles = {
      left: `${x - rect.width / 2}px`,
      top: `${y - rect.height / 2}px`,
      zIndex: state.globalIndex,
      display: 'block'
    };

    Object.assign(trailImage.style, styles);
    state.trailImageTimestamps.set(trailImage, Date.now());

	// Here, animate how the images will appear!
    gsap.fromTo(
      trailImage,
      { autoAlpha: 0, scale: 0.8 },
      {
        scale: 1,
        autoAlpha: 1,
        duration: 0.2,
        overwrite: true
      }
    );

    state.last = { x, y };
  }

  function fadeOutTrailImage(trailImage) {
    if (!trailImage) return;
		
    // Here, animate how the images will disappear!
    gsap.to(trailImage, {
      opacity: 0,
      scale: 0.2,
      duration: 0.8,
      ease: "expo.out",
      onComplete: () => {
        gsap.set(trailImage, { autoAlpha: 0 });
      }
    });
  }

  function handleOnMove(e) {
    if (!state.isActive) return;

    const rectWrapper = wrapper.getBoundingClientRect();

    if (
      e.clientX < rectWrapper.left ||
      e.clientX > rectWrapper.right ||
      e.clientY < rectWrapper.top ||
      e.clientY > rectWrapper.bottom
    ) return;

    const { x: relativeX, y: relativeY } = getRelativeCoordinates(e, rectWrapper);

    const distanceFromLast = MathUtils.distance(
      relativeX,
      relativeY,
      state.last.x,
      state.last.y
    );

    if (distanceFromLast > window.innerWidth / options.moveDistance) {
      const lead = state.trailImages[state.globalIndex % state.trailImages.length];
      const tail = state.trailImages[(state.globalIndex - options.trailLength) % state.trailImages.length];

      activate(lead, relativeX, relativeY);
      fadeOutTrailImage(tail);
      state.globalIndex++;
    }
  }

  function cleanupTrailImages() {
    const currentTime = Date.now();
    for (const [trailImage, timestamp] of state.trailImageTimestamps.entries()) {
      if (currentTime - timestamp > options.stopDuration) {
        fadeOutTrailImage(trailImage);
        state.trailImageTimestamps.delete(trailImage);
      }
    }
  }

  function startTrail() {
    if (state.isActive) return;
    
    state.isActive = true;
    wrapper.parentElement.addEventListener("mousemove", handleOnMove);
    state.trailInterval = setInterval(cleanupTrailImages, 100);
  }

  function stopTrail() {
    if (!state.isActive) return;
    
    state.isActive = false;
    wrapper.parentElement.removeEventListener("mousemove", handleOnMove);
    clearInterval(state.trailInterval);
    state.trailInterval = null;
    
    // Clean up remaining trail images
    state.trailImages.forEach(fadeOutTrailImage);
    state.trailImageTimestamps.clear();
  }

  // Initialize ScrollTrigger
  ScrollTrigger.create({
    trigger: wrapper,
    start: "top bottom",
    end: "bottom top",
    onEnter: startTrail,
    onEnterBack: startTrail,
    onLeave: stopTrail,
    onLeaveBack: stopTrail
  });

  // Clean up on window resize
  const handleResize = () => {
    if (window.innerWidth < options.minWidth && state.isActive) {
      stopTrail();
    } else if (window.innerWidth >= options.minWidth && !state.isActive) {
      startTrail();
    }
  };

  window.addEventListener('resize', handleResize);

  return () => {
    stopTrail();
    window.removeEventListener('resize', handleResize);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const imageTrail = initImageTrail({
    minWidth: 992,
    moveDistance: 15,
    stopDuration: 350,
    trailLength: 8
  });
});