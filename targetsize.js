
(function () {
  "use strict";

  const KEY = "__wcag258Audit";

  // Running again removes the previous audit.
  if (window[KEY]) {
    window[KEY].destroy();
    return;
  }

  const SELECTOR = [
    "a[href]",
    "button",
    "input:not([type='hidden'])",
    "select",
    "textarea",
    "summary",
    "[role='button']",
    "[role='link']",
    "[role='checkbox']",
    "[role='radio']",
    "[role='switch']",
    "[role='textbox']",
    "[role='slider']",
    "[role='menuitem']",
    "[role='tab']",
    "[role='option']",
    "[role='combobox']",
    "[role='spinbutton']"
  ].join(",");

  const COLORS = {
    fail: "#dc2626",
    spacing: "#15803d",
    review: "#9333ea"
  };

  const root = document.createElement("div");
  root.id = "wcag258-overlay";
  root.setAttribute("aria-hidden", "true");
  root.style.cssText = [
    "position:fixed",
    "inset:0",
    "pointer-events:none",
    "z-index:2147483646"
  ].join(";");

  document.body.appendChild(root);

  let raf = 0;

  function getRect(element) {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2
    };
  }

  function isVisible(element) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.visibility === "collapse" ||
      style.pointerEvents === "none" ||
      element.closest("[inert]")
    ) {
      return false;
    }

    return rect.width > 0 && rect.height > 0;
  }

  function isNestedTarget(element) {
    const parent = element.parentElement;
    return !!(parent && parent.closest(SELECTOR));
  }

  function isPossibleInlineException(element) {
    const style = getComputedStyle(element);

    if (!style.display.startsWith("inline")) {
      return false;
    }

    const parent = element.parentElement;
    if (!parent) return false;

    // A rough indication that the link is embedded
    // in surrounding non-interactive text.
    return [...parent.childNodes].some(node => {
      return node.nodeType === Node.TEXT_NODE &&
        node.textContent.trim().length > 0;
    });
  }

  function circlesOverlap(a, b) {
    return Math.hypot(a.cx - b.cx, a.cy - b.cy) < 24 - 0.01;
  }

  function circleIntersectsRect(circle, rect) {
    const nearestX = Math.max(
      rect.left,
      Math.min(circle.cx, rect.right)
    );

    const nearestY = Math.max(
      rect.top,
      Math.min(circle.cy, rect.bottom)
    );

    const distance = Math.hypot(
      circle.cx - nearestX,
      circle.cy - nearestY
    );

    return distance < 12 - 0.01;
  }

  function hasSpacingConflict(target, allTargets) {
    return allTargets.some(other => {
      if (other === target) return false;

      if (other.undersized) {
        return circlesOverlap(target.rect, other.rect);
      }

      return circleIntersectsRect(
        target.rect,
        other.rect
      );
    });
  }

  function collectTargets() {
    return [...document.querySelectorAll(SELECTOR)]
      .filter(element => {
        return !root.contains(element) &&
          isVisible(element) &&
          !isNestedTarget(element);
      })
      .map(element => {
        const rect = getRect(element);

        return {
          element,
          rect,
          undersized: rect.width < 24 ||
            rect.height < 24
        };
      });
  }

  function classify(target, targets) {
    if (isPossibleInlineException(target.element)) {
      return "review";
    }

    return hasSpacingConflict(target, targets)
      ? "fail"
      : "spacing";
  }

  function createHighlight(target, status, number) {
    const rect = target.rect;
    const color = COLORS[status];

    const box = document.createElement("div");

    box.style.cssText = [
      "position:absolute",
      "box-sizing:border-box",
      "border:2px solid " + color,
      "background:" + color + "22",
      "left:" + rect.left + "px",
      "top:" + rect.top + "px",
      "width:" + rect.width + "px",
      "height:" + rect.height + "px"
    ].join(";");

    const label = document.createElement("div");

    label.textContent =
      "#" + number + " " +
      rect.width.toFixed(1) + " × " +
      rect.height.toFixed(1);

    label.style.cssText = [
      "position:absolute",
      "left:" + rect.left + "px",
      "top:" + Math.max(0, rect.top - 20) + "px",
      "background:" + color,
      "color:white",
      "padding:2px 5px",
      "font:11px Arial,sans-serif",
      "white-space:nowrap",
      "border-radius:3px"
    ].join(";");

    root.append(box, label);
  }

  function render() {
    root.replaceChildren();

    const targets = collectTargets();

    const counts = {
      fail: 0,
      spacing: 0,
      review: 0
    };

    const results = [];

    targets.forEach(target => {
      if (!target.undersized) return;

      const status = classify(target, targets);
      counts[status]++;

      const number = results.length + 1;

      createHighlight(target, status, number);

      results.push({
        number,
        status,
        element: target.element,
        width: target.rect.width.toFixed(1),
        height: target.rect.height.toFixed(1)
      });
    });

    console.group("WCAG 2.5.8 Target Size Audit");
    console.log("Potential failures:", counts.fail);
    console.log("Spacing satisfied:", counts.spacing);
    console.log("Manual review:", counts.review);
    console.table(results);
    console.groupEnd();

    let panel = document.getElementById("wcag258-panel");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "wcag258-panel";
      document.body.appendChild(panel);
    }

    panel.style.cssText = [
      "position:fixed",
      "top:12px",
      "right:12px",
      "z-index:2147483647",
      "background:#fff",
      "color:#111",
      "padding:12px 16px",
      "border:1px solid #555",
      "border-radius:6px",
      "box-shadow:0 3px 12px #0004",
      "font:13px Arial,sans-serif",
      "line-height:1.7"
    ].join(";");

    panel.replaceChildren();

    const heading = document.createElement("strong");
    heading.textContent = "WCAG 2.5.8 Audit";

    const summary = document.createElement("div");
    summary.textContent =
      "Potential failures: " + counts.fail +
      " | Spacing: " + counts.spacing +
      " | Review: " + counts.review;

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Remove highlights";
    close.style.cssText =
      "margin-top:8px;padding:5px 8px;cursor:pointer";

    close.addEventListener("click", destroy);

    panel.append(heading, summary, close);
  }

  function update() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(render);
  }

  function destroy() {
    cancelAnimationFrame(raf);

    window.removeEventListener("scroll", update, true);
    window.removeEventListener("resize", update);

    root.remove();
    document.getElementById("wcag258-panel")?.remove();

    delete window[KEY];
  }

  window[KEY] = { destroy };

  window.addEventListener("scroll", update, true);
  window.addEventListener("resize", update);

  render();
})();
