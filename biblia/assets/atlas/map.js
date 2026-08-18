(function () {
  "use strict";

  const svg = document.getElementById("map-svg");
  const layerMaster = document.getElementById("layer-master-map");
  const layerRoute = document.getElementById("layer-route");
  const layerPins = document.getElementById("layer-pins");
  const mapTitle = document.getElementById("map-title");
  const atlasLabel = document.getElementById("atlas-label");
  const mapSelect = document.getElementById("map-select");
  const journeySelect = document.getElementById("journey-select");
  const useControlLabel = document.getElementById("use-control-label");
  const mapControlLabel = document.getElementById("map-control-label");
  const langToggle = document.getElementById("lang-toggle");
  const hintText = document.getElementById("hint-text");
  const panel = document.getElementById("info-panel");
  const panelBackdrop = document.getElementById("panel-backdrop");
  const panelTitle = document.getElementById("panel-title");
  const panelDesc = document.getElementById("panel-desc");
  const panelKicker = document.getElementById("panel-kicker");
  const panelClose = document.getElementById("panel-close");
  const panelMedia = document.getElementById("panel-media");
  const panelImage = document.getElementById("panel-image");
  const mediaPrev = document.getElementById("media-prev");
  const mediaNext = document.getElementById("media-next");
  const mediaCounter = document.getElementById("media-counter");
  const mediaCaption = document.getElementById("media-caption");
  const mediaRepresentative = document.getElementById("media-representative");
  const mediaLicense = document.getElementById("media-license");
  const mediaSource = document.getElementById("media-source");
  const mediaDots = document.getElementById("media-dots");
  const scriptureHeading = document.getElementById("scripture-heading");
  const scriptureRefs = document.getElementById("scripture-refs");
  const scriptureText = document.getElementById("scripture-text");
  const mapFrame = document.getElementById("map-frame");
  const mapStage = document.querySelector(".map-stage");
  const zoomInButton = document.getElementById("zoom-in");
  const zoomOutButton = document.getElementById("zoom-out");
  const zoomResetButton = document.getElementById("zoom-reset");
  const zoomIndicator = document.getElementById("zoom-indicator");

  let lang = "es";
  let mapsRegistry = null;
  let currentMap = null;
  let placesData = null;
  let masterTextCatalog = null;
  let mediaCatalog = null;
  let activeMediaIndex = 0;
  let externalBibleResolver = null;
  let bibleRenderToken = 0;
  let masterViewBox = [0, 0, 1024, 768];
  let currentJourneyKey = null;
  let activePinId = null;
  let externalTextResolver = null;
  let loadToken = 0;
  let cameraAnimationFrame = null;
  let suppressPinClickUntil = 0;
  const activePointers = new Map();
  let panGesture = null;
  let pinchGesture = null;

  const NS = "http://www.w3.org/2000/svg";
  const MAX_ZOOM = 8;
  const BUTTON_ZOOM_FACTOR = 1.35;
  const WHEEL_ZOOM_SENSITIVITY = 0.0018;
  const LAST_MAP_STORAGE_KEY = "verbo:atlas:lastMap";
  const ATLAS_DATA_VERSION = "20260818-atlas-map-fixes";

  function versionedAtlasDataUrl(url) {
    return `${url}${url.includes("?") ? "&" : "?"}v=${ATLAS_DATA_VERSION}`;
  }

  function storedMapId() {
    try { return localStorage.getItem(LAST_MAP_STORAGE_KEY); }
    catch { return null; }
  }

  function rememberMapId(mapId) {
    try { localStorage.setItem(LAST_MAP_STORAGE_KEY, mapId); }
    catch { /* El Atlas sigue funcionando si el navegador bloquea almacenamiento. */ }
  }

  function fallbackText(entry, language = lang) {
    if (entry == null) return "";
    if (typeof entry === "string") return entry;
    return entry[language] ?? entry.es ?? entry.en ?? "";
  }

  function resolveText(entry, context = {}) {
    const fallback = fallbackText(entry);
    if (!externalTextResolver) return fallback;
    try {
      const resolved = externalTextResolver({ entry, language: lang, fallback, ...context });
      return typeof resolved === "string" ? resolved : fallback;
    } catch (error) {
      console.warn("Verbo Atlas text resolver failed; using local catalog.", error);
      return fallback;
    }
  }

  async function resolveTextAsync(entry, context, targetElement) {
    const fallback = fallbackText(entry);
    targetElement.textContent = fallback;
    if (!externalTextResolver) return;
    try {
      const resolved = externalTextResolver({ entry, language: lang, fallback, ...context });
      if (resolved && typeof resolved.then === "function") {
        const requestedLanguage = lang;
        const requestedMap = currentMap && currentMap.id;
        const value = await resolved;
        if (lang === requestedLanguage && currentMap && currentMap.id === requestedMap && typeof value === "string") {
          targetElement.textContent = value;
        }
      } else if (typeof resolved === "string") {
        targetElement.textContent = resolved;
      }
    } catch (error) {
      console.warn("Async Verbo Atlas text resolver failed; using local catalog.", error);
    }
  }

  async function loadRegistry() {
    mapsRegistry = await fetch(versionedAtlasDataUrl("data/maps-registry.json")).then((r) => {
      if (!r.ok) throw new Error(`Registry HTTP ${r.status}`);
      return r.json();
    });
    if (mapsRegistry.renderMode !== "immutable-svg-master") {
      throw new Error("Atlas registry is not configured for immutable SVG masters.");
    }
  }

  async function loadMediaCatalog() {
    mediaCatalog = await fetch(versionedAtlasDataUrl("data/place-media.json")).then((r) => {
      if (!r.ok) throw new Error(`Media catalog HTTP ${r.status}`);
      return r.json();
    });
  }

  function validateMasterSvgText(raw, url) {
    const lower = raw.toLowerCase();
    const forbidden = ["<image", "data:image", "<script", "<foreignobject"];
    const found = forbidden.find((needle) => lower.includes(needle));
    if (found) throw new Error(`Rejected master SVG ${url}: forbidden content ${found}`);
  }

  function parseViewBox(root) {
    const vb = (root.getAttribute("viewBox") || "").trim().split(/[ ,]+/).map(Number);
    if (vb.length === 4 && vb.every(Number.isFinite) && vb[2] > 0 && vb[3] > 0) return vb;
    const w = parseFloat(root.getAttribute("width")) || 1024;
    const h = parseFloat(root.getAttribute("height")) || 768;
    return [0, 0, w, h];
  }


  function getCurrentViewBox() {
    const raw = (svg.getAttribute("viewBox") || masterViewBox.join(" ")).trim().split(/[ ,]+/).map(Number);
    return raw.length === 4 && raw.every(Number.isFinite) ? raw : [...masterViewBox];
  }

  function cancelCameraAnimation() {
    if (cameraAnimationFrame != null) cancelAnimationFrame(cameraAnimationFrame);
    cameraAnimationFrame = null;
  }

  function clampViewBox(viewBox) {
    const [mx, my, mw, mh] = masterViewBox;
    let [x, y, w, h] = viewBox;
    if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) return [...masterViewBox];

    const minW = mw / MAX_ZOOM;
    const minH = mh / MAX_ZOOM;
    const scaleUp = Math.max(minW / w, minH / h, 1);
    w *= scaleUp;
    h *= scaleUp;

    if (w >= mw || h >= mh) return [...masterViewBox];
    x = Math.min(Math.max(x, mx), mx + mw - w);
    y = Math.min(Math.max(y, my), my + mh - h);
    return [x, y, w, h];
  }

  function updateZoomUi() {
    if (!zoomIndicator) return;
    const [, , mw, mh] = masterViewBox;
    const [, , w, h] = getCurrentViewBox();
    const zoom = Math.max(mw / w, mh / h);
    zoomIndicator.textContent = `${Math.round(zoom * 100)}%`;
    if (zoomOutButton) zoomOutButton.disabled = zoom <= 1.001;
    if (zoomInButton) zoomInButton.disabled = zoom >= MAX_ZOOM - 0.01;
  }

  function setCamera(viewBox, { cancelAnimation = true } = {}) {
    if (cancelAnimation) cancelCameraAnimation();
    const next = clampViewBox(viewBox);
    svg.setAttribute("viewBox", next.join(" "));
    updateZoomUi();
    return next;
  }

  function resetCamera() {
    setCamera(masterViewBox);
  }

  function screenPointToUser(clientX, clientY) {
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const mapped = point.matrixTransform(ctm.inverse());
    return [mapped.x, mapped.y];
  }

  function zoomAt(clientX, clientY, factor) {
    if (!Number.isFinite(factor) || factor <= 0) return;
    const before = getCurrentViewBox();
    const anchor = screenPointToUser(clientX, clientY);
    if (!anchor) return;
    const [x, y, w, h] = before;
    const ratioX = (anchor[0] - x) / w;
    const ratioY = (anchor[1] - y) / h;
    const nextW = w / factor;
    const nextH = h / factor;
    setCamera([
      anchor[0] - ratioX * nextW,
      anchor[1] - ratioY * nextH,
      nextW,
      nextH,
    ]);
  }

  function zoomFromCenter(factor) {
    const rect = svg.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  }

  function renderedScale(viewBox) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return 1;
    return Math.min(rect.width / viewBox[2], rect.height / viewBox[3]);
  }

  function beginPan(pointer) {
    pinchGesture = null;
    panGesture = {
      pointerId: pointer.pointerId,
      startClientX: pointer.clientX,
      startClientY: pointer.clientY,
      startViewBox: getCurrentViewBox(),
      moved: false,
    };
    mapFrame && mapFrame.classList.add("is-panning");
  }

  function updatePan(pointer) {
    if (!panGesture || panGesture.pointerId !== pointer.pointerId) return;
    const dx = pointer.clientX - panGesture.startClientX;
    const dy = pointer.clientY - panGesture.startClientY;
    if (Math.hypot(dx, dy) > 4) panGesture.moved = true;
    const scale = renderedScale(panGesture.startViewBox);
    const [x, y, w, h] = panGesture.startViewBox;
    setCamera([x - dx / scale, y - dy / scale, w, h]);
  }

  function beginPinch() {
    if (activePointers.size < 2) return;
    const [a, b] = Array.from(activePointers.values()).slice(0, 2);
    const midX = (a.clientX + b.clientX) / 2;
    const midY = (a.clientY + b.clientY) / 2;
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const startViewBox = getCurrentViewBox();
    const anchor = screenPointToUser(midX, midY);
    if (!anchor || distance < 4) return;
    pinchGesture = {
      startDistance: distance,
      startMidX: midX,
      startMidY: midY,
      startViewBox,
      anchor,
      ratioX: (anchor[0] - startViewBox[0]) / startViewBox[2],
      ratioY: (anchor[1] - startViewBox[1]) / startViewBox[3],
      moved: false,
    };
    panGesture = null;
    mapFrame && mapFrame.classList.add("is-panning");
  }

  function updatePinch() {
    if (!pinchGesture || activePointers.size < 2) return;
    const [a, b] = Array.from(activePointers.values()).slice(0, 2);
    const midX = (a.clientX + b.clientX) / 2;
    const midY = (a.clientY + b.clientY) / 2;
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (distance < 4) return;

    const factor = distance / pinchGesture.startDistance;
    const [, , startW, startH] = pinchGesture.startViewBox;
    const nextW = startW / factor;
    const nextH = startH / factor;
    const scale = Math.min(svg.getBoundingClientRect().width / nextW, svg.getBoundingClientRect().height / nextH) || 1;
    const panDx = (midX - pinchGesture.startMidX) / scale;
    const panDy = (midY - pinchGesture.startMidY) / scale;
    if (Math.abs(distance - pinchGesture.startDistance) > 5 || Math.hypot(midX - pinchGesture.startMidX, midY - pinchGesture.startMidY) > 4) {
      pinchGesture.moved = true;
    }
    setCamera([
      pinchGesture.anchor[0] - pinchGesture.ratioX * nextW - panDx,
      pinchGesture.anchor[1] - pinchGesture.ratioY * nextH - panDy,
      nextW,
      nextH,
    ]);
  }

  function endGesture(pointerId) {
    activePointers.delete(pointerId);
    const moved = Boolean((panGesture && panGesture.moved) || (pinchGesture && pinchGesture.moved));
    if (moved) suppressPinClickUntil = performance.now() + 280;

    if (activePointers.size >= 2) {
      beginPinch();
      return;
    }
    pinchGesture = null;
    if (activePointers.size === 1) {
      const remaining = Array.from(activePointers.values())[0];
      beginPan(remaining);
    } else {
      panGesture = null;
      mapFrame && mapFrame.classList.remove("is-panning");
    }
  }

  function installZoomInteractions() {
    zoomInButton && zoomInButton.addEventListener("click", () => zoomFromCenter(BUTTON_ZOOM_FACTOR));
    zoomOutButton && zoomOutButton.addEventListener("click", () => zoomFromCenter(1 / BUTTON_ZOOM_FACTOR));
    zoomResetButton && zoomResetButton.addEventListener("click", resetCamera);

    svg.addEventListener("wheel", (event) => {
      event.preventDefault();
      const factor = Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY);
      zoomAt(event.clientX, event.clientY, factor);
    }, { passive: false });

    svg.addEventListener("dblclick", (event) => {
      // Interactive pins own their pointer gestures. A double click on a pin
      // must not be reinterpreted as a map zoom.
      if (event.target.closest && event.target.closest(".pin")) return;
      event.preventDefault();
      zoomAt(event.clientX, event.clientY, event.shiftKey ? 1 / BUTTON_ZOOM_FACTOR : BUTTON_ZOOM_FACTOR);
    });

    svg.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;

      // Do not capture pointer input that belongs to an interactive pin.
      // Capturing it at the root SVG can retarget the eventual click to the
      // map and make the pin appear non-clickable, especially on touch.
      if (event.target.closest && event.target.closest(".pin")) return;

      cancelCameraAnimation();
      svg.setPointerCapture && svg.setPointerCapture(event.pointerId);
      activePointers.set(event.pointerId, { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY });
      if (activePointers.size >= 2) beginPinch();
      else beginPan(activePointers.get(event.pointerId));
    });

    svg.addEventListener("pointermove", (event) => {
      if (!activePointers.has(event.pointerId)) return;
      activePointers.set(event.pointerId, { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY });
      if (activePointers.size >= 2) updatePinch();
      else updatePan(activePointers.get(event.pointerId));
    });

    ["pointerup", "pointercancel", "lostpointercapture"].forEach((name) => {
      svg.addEventListener(name, (event) => endGesture(event.pointerId));
    });

    if (mapFrame) {
      mapFrame.addEventListener("keydown", (event) => {
        if (event.key === "+" || event.key === "=") {
          event.preventDefault();
          zoomFromCenter(BUTTON_ZOOM_FACTOR);
        } else if (event.key === "-" || event.key === "_") {
          event.preventDefault();
          zoomFromCenter(1 / BUTTON_ZOOM_FACTOR);
        } else if (event.key === "0" || event.key === "Home") {
          event.preventDefault();
          resetCamera();
        }
      });
    }
    updateZoomUi();
  }


  function fitMapFrame() {
    if (!mapFrame || !mapStage) return;
    const [, , vw, vh] = masterViewBox;
    const ratio = vw / vh;
    if (!Number.isFinite(ratio) || ratio <= 0) return;

    const stageStyle = getComputedStyle(mapStage);
    const padX = (parseFloat(stageStyle.paddingLeft) || 0) + (parseFloat(stageStyle.paddingRight) || 0);
    const padY = (parseFloat(stageStyle.paddingTop) || 0) + (parseFloat(stageStyle.paddingBottom) || 0);
    const gap = parseFloat(stageStyle.rowGap || stageStyle.gap) || 0;
    const hintHeight = hintText ? hintText.getBoundingClientRect().height : 0;

    // The map may use only the space left by the interface. It can never push over the header.
    const availableW = Math.max(120, mapStage.clientWidth - padX);
    const availableH = Math.max(120, mapStage.clientHeight - padY - hintHeight - gap);

    // Fill the stage in the limiting dimension while preserving the real master viewBox.
    let boxW = availableW;
    let boxH = availableH;

    if (boxW / boxH > ratio) boxW = boxH * ratio;
    else boxH = boxW / ratio;

    // Very small screens still get a valid, proportional map without overlapping controls.
    boxW = Math.max(120, Math.floor(boxW));
    boxH = Math.max(120, Math.floor(boxH));
    mapFrame.style.width = `${boxW}px`;
    mapFrame.style.height = `${boxH}px`;
  }

  function mountMasterSvg(raw, url) {
    validateMasterSvgText(raw, url);
    const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
    if (doc.querySelector("parsererror")) throw new Error(`Invalid SVG XML: ${url}`);
    const root = doc.documentElement;
    if (!root || root.localName.toLowerCase() !== "svg") throw new Error(`Not an SVG document: ${url}`);

    masterViewBox = parseViewBox(root);
    cancelCameraAnimation();
    svg.setAttribute("viewBox", masterViewBox.join(" "));
    updateZoomUi();
    requestAnimationFrame(fitMapFrame);
    layerMaster.replaceChildren();

    Array.from(root.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.localName.toLowerCase() === "metadata") return;
      layerMaster.appendChild(document.importNode(node, true));
    });

    applyMasterSurfaceCorrections();
    applyMasterPositionCorrections();

    // Source text is the translation key. Geometry remains exactly as stored in maps/master.
    layerMaster.querySelectorAll("text").forEach((el) => {
      const source = (el.textContent || "").trim();
      if (source) {
        el.dataset.mapSourceText = source;
        el.dataset.mapTextKey = el.getAttribute("data-i18n") || source;
      }
    });
  }

  function applyMasterSurfaceCorrections() {
    if (!currentMap || currentMap.id !== "exodo-conquista") return;
    // En este maestro, las masas terrestres oriental y occidental quedaron
    // semitransparentes sobre el Mediterráneo. La copia runtime las restaura
    // como tierra sin modificar la geometría ni el archivo SVG aprobado.
    layerMaster.querySelectorAll(".relief").forEach((surface) => {
      surface.style.fill = "url(#land)";
      surface.style.opacity = "1";
      surface.dataset.runtimeCorrected = "surface";
    });
  }

  function applyMasterPositionCorrections() {
    const markers = Array.from(layerMaster.querySelectorAll(".place[data-source-x][data-source-y]"));
    const labels = Array.from(layerMaster.querySelectorAll(".place-label"));
    Object.values((placesData && placesData.places) || {}).forEach((place) => {
      if (!Array.isArray(place.masterPosition) || !Array.isArray(place.mapPosition)) return;
      const [sourceX, sourceY] = place.masterPosition;
      const [targetX, targetY] = place.mapPosition;
      const marker = markers.find((item) => Number(item.dataset.sourceX) === sourceX && Number(item.dataset.sourceY) === sourceY);
      if (!marker) return;
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      const index = markers.indexOf(marker);
      const translate = `translate(${dx} ${dy})`;
      marker.setAttribute("transform", `${translate} ${marker.getAttribute("transform") || ""}`.trim());
      marker.dataset.runtimeCorrected = "true";
      const label = labels[index];
      if (label) {
        label.setAttribute("transform", `${translate} ${label.getAttribute("transform") || ""}`.trim());
        label.dataset.runtimeCorrected = "true";
      }
    });
  }

  async function loadMapData(mapEntry) {
    const token = ++loadToken;
    const [places, rawSvg, catalog] = await Promise.all([
      fetch(versionedAtlasDataUrl(mapEntry.places)).then((r) => r.json()),
      fetch(mapEntry.masterSvg).then((r) => {
        if (!r.ok) throw new Error(`Master SVG HTTP ${r.status}: ${mapEntry.masterSvg}`);
        return r.text();
      }),
      fetch(versionedAtlasDataUrl(mapEntry.textCatalog)).then((r) => r.json()),
    ]);
    if (token !== loadToken) return false;
    placesData = places;
    masterTextCatalog = catalog;
    mountMasterSvg(rawSvg, mapEntry.masterSvg);
    return true;
  }

  function applyMasterTranslations() {
    const labels = (masterTextCatalog && masterTextCatalog.labels) || {};
    const keys = (masterTextCatalog && masterTextCatalog.keys) || {};
    layerMaster.querySelectorAll("text[data-map-source-text]").forEach((el) => {
      const source = el.dataset.mapSourceText;
      const textKey = el.dataset.mapTextKey || source;
      const entry = keys[textKey] || labels[source] || { es: source, en: source };
      resolveTextAsync(entry, { scope: "master-svg", mapId: currentMap.id, sourceText: source, textKey }, el);
    });
  }

  function mapPosition(place) {
    const p = place && place.mapPosition;
    return Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) ? p : null;
  }

  function pinRadius(type) {
    return type === "port" ? 5 : 6;
  }

  function routeMarker(defs, id, color) {
    const marker = document.createElementNS(NS, "marker");
    marker.setAttribute("id", id);
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "7");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "6");
    marker.setAttribute("markerHeight", "6");
    marker.setAttribute("orient", "auto");
    const arrow = document.createElementNS(NS, "path");
    arrow.setAttribute("d", "M0,0 L10,5 L0,10 Z");
    arrow.setAttribute("fill", color);
    marker.appendChild(arrow);
    defs.appendChild(marker);
  }

  function clearTerritoryHighlights() {
    layerMaster.querySelectorAll(".atlas-territory-highlight, .atlas-territory-dim").forEach((el) => {
      el.classList.remove("atlas-territory-highlight", "atlas-territory-dim");
    });
  }

  function highlightTerritories(journey, focus = true) {
    clearTerritoryHighlights();
    const ids = Array.isArray(journey.territoryIds) ? journey.territoryIds : (journey.territoryId ? [journey.territoryId] : []);
    if (!ids.length) return false;
    const selected = ids.map((id) => layerMaster.querySelector(`#${CSS.escape(id)}`)).filter(Boolean);
    if (!selected.length) return false;
    const territoryGroup = layerMaster.querySelector("#territories");
    if (territoryGroup) {
      Array.from(territoryGroup.children).forEach((el) => {
        if (!selected.includes(el)) el.classList.add("atlas-territory-dim");
      });
    }
    selected.forEach((el) => el.classList.add("atlas-territory-highlight"));
    if (focus) {
      const boxes = selected.map((el) => {
        try { return el.getBBox(); } catch (_) { return null; }
      }).filter(Boolean);
      if (boxes.length) {
        const points = [];
        boxes.forEach((b) => {
          points.push([b.x, b.y], [b.x + b.width, b.y + b.height]);
        });
        animateCameraTo(points);
      }
    }
    return true;
  }

  function renderJourney(journeyKey, focus = true) {
    currentJourneyKey = journeyKey;
    layerRoute.replaceChildren();
    layerPins.replaceChildren();
    clearTerritoryHighlights();

    const journey = placesData.journeys[journeyKey];
    if (!journey) return;

    const rawSegments = Array.isArray(journey.segments) && journey.segments.length
      ? journey.segments
      : [{ stops: journey.stops || [], color: journey.color, dashed: journey.dashed }];

    const segments = rawSegments.map((segment) => {
      const validStops = (segment.stops || []).filter((id) => mapPosition(placesData.places[id]));
      return { ...segment, validStops };
    });
    const allStops = [];
    segments.forEach((segment) => segment.validStops.forEach((id) => { if (!allStops.includes(id)) allStops.push(id); }));
    const allPoints = allStops.map((id) => mapPosition(placesData.places[id]));
    const territoryMode = (journey.mode || "route") === "territory";
    if (territoryMode) highlightTerritories(journey, focus);
    if (!allStops.length) {
      refreshHint();
      return;
    }

    if ((journey.mode || "route") !== "sites" && !territoryMode) {
      const defs = document.createElementNS(NS, "defs");
      layerRoute.appendChild(defs);
      segments.forEach((segment, index) => {
        if (segment.validStops.length < 2) return;
        const points = segment.validStops.map((id) => mapPosition(placesData.places[id]));
        const color = segment.color || journey.color || "#b23a3a";
        const markerId = `atlasDynamicArrow-${index}`;
        routeMarker(defs, markerId, color);
        const path = document.createElementNS(NS, "path");
        path.setAttribute("d", "M" + points.map((p) => p.join(",")).join(" L"));
        path.setAttribute("class", "route-line");
        path.style.stroke = color;
        path.style.strokeDasharray = (segment.dashed ?? journey.dashed) ? "7 5" : "none";
        path.setAttribute("marker-end", `url(#${markerId})`);
        layerRoute.appendChild(path);
      });
    }

    allStops.forEach((id) => {
      const place = placesData.places[id];
      const [x, y] = mapPosition(place);
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "pin");
      g.setAttribute("data-id", id);
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", fallbackText(place.name));

      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      dot.setAttribute("r", pinRadius(place.type));
      dot.setAttribute("class", "pin-dot");
      g.appendChild(dot);

      if (currentMap.showPinLabels !== false) {
        const label = document.createElementNS(NS, "text");
        label.setAttribute("x", x + 10);
        label.setAttribute("y", y + 4);
        label.setAttribute("class", "pin-label");
        label.dataset.placeId = id;
        label.textContent = resolveText(place.name, { scope: "place-name", mapId: currentMap.id, placeId: id });
        g.appendChild(label);
      }

      g.addEventListener("click", () => {
        if (performance.now() < suppressPinClickUntil) return;
        openPanel(id);
      });
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPanel(id);
        }
      });
      layerPins.appendChild(g);
    });

    refreshHint();
    if (focus && !territoryMode && currentMap.autoFocusJourneys !== false) animateCameraTo(allPoints);
  }

  function animateCameraTo(points) {
    if (!points.length) return;
    const [vx, vy, vw, vh] = masterViewBox;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const padX = Math.max(vw * 0.08, 28);
    const padY = Math.max(vh * 0.08, 28);
    let minX = Math.max(vx, Math.min(...xs) - padX);
    let maxX = Math.min(vx + vw, Math.max(...xs) + padX);
    let minY = Math.max(vy, Math.min(...ys) - padY);
    let maxY = Math.min(vy + vh, Math.max(...ys) + padY);

    // Never zoom closer than roughly one third of the master in either dimension.
    const minWidth = vw * 0.34;
    const minHeight = vh * 0.34;
    if (maxX - minX < minWidth) {
      const cx = (minX + maxX) / 2;
      minX = Math.max(vx, cx - minWidth / 2);
      maxX = Math.min(vx + vw, minX + minWidth);
      minX = maxX - minWidth;
    }
    if (maxY - minY < minHeight) {
      const cy = (minY + maxY) / 2;
      minY = Math.max(vy, cy - minHeight / 2);
      maxY = Math.min(vy + vh, minY + minHeight);
      minY = maxY - minHeight;
    }

    cancelCameraAnimation();
    const from = getCurrentViewBox();
    const to = clampViewBox([minX, minY, maxX - minX, maxY - minY]);
    const duration = 550;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      const current = from.map((v, i) => v + (to[i] - v) * ease);
      setCamera(current, { cancelAnimation: false });
      if (p < 1) cameraAnimationFrame = requestAnimationFrame(tick);
      else cameraAnimationFrame = null;
    }
    cameraAnimationFrame = requestAnimationFrame(tick);
  }

  function mediaPoolForPlace(place) {
    if (!mediaCatalog || !place || !place.mediaKey) return null;
    return mediaCatalog.pools && mediaCatalog.pools[place.mediaKey] || null;
  }

  function mediaLicenseLabel(value) {
    if (value === "Public domain") return lang === "es" ? "Dominio público" : "Public domain";
    return value || "";
  }

  function renderMedia(place, placeId) {
    const pool = mediaPoolForPlace(place);
    const items = pool && Array.isArray(pool.items) ? pool.items : [];
    if (!panelMedia || !items.length) {
      if (panelMedia) panelMedia.hidden = true;
      return;
    }

    panelMedia.hidden = false;
    activeMediaIndex = ((activeMediaIndex % items.length) + items.length) % items.length;
    const item = items[activeMediaIndex];
    const placeName = resolveText(place.name, { scope: "place-name", mapId: currentMap.id, placeId });
    const captionFallback = fallbackText(item.caption);

    panelImage.src = item.mediaUrl;
    panelImage.alt = captionFallback || placeName;
    panelImage.dataset.sourcePage = item.sourcePage || "";
    mediaCaption.textContent = resolveText(item.caption || { es: placeName, en: placeName }, {
      scope: "media-caption",
      mapId: currentMap.id,
      placeId,
      mediaKey: place.mediaKey,
      mediaIndex: activeMediaIndex,
    });

    mediaCounter.textContent = `${activeMediaIndex + 1} / ${items.length}`;
    mediaLicense.textContent = mediaLicenseLabel(item.license);
    mediaSource.textContent = lang === "es" ? "Fuente y licencia" : "Source & license";
    mediaSource.href = item.sourcePage || "#";
    mediaSource.hidden = !item.sourcePage;

    const isRepresentative = pool.scope === "regional" || place.mediaScope === "regional" || item.representative;
    mediaRepresentative.hidden = !isRepresentative;
    mediaRepresentative.textContent = isRepresentative
      ? (lang === "es"
          ? "Imagen representativa de la región; no se presenta como una identificación exacta del sitio bíblico."
          : "Representative image of the region; it is not presented as an exact identification of the biblical site.")
      : "";

    mediaPrev.hidden = items.length < 2;
    mediaNext.hidden = items.length < 2;
    mediaPrev.setAttribute("aria-label", lang === "es" ? "Imagen anterior" : "Previous image");
    mediaNext.setAttribute("aria-label", lang === "es" ? "Imagen siguiente" : "Next image");

    mediaDots.replaceChildren();
    items.forEach((_, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "media-dot" + (index === activeMediaIndex ? " active" : "");
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", index === activeMediaIndex ? "true" : "false");
      button.setAttribute("aria-label", `${lang === "es" ? "Imagen" : "Image"} ${index + 1}`);
      button.addEventListener("click", () => {
        activeMediaIndex = index;
        renderMedia(place, placeId);
      });
      mediaDots.appendChild(button);
    });
  }

  function changeMedia(delta) {
    if (!activePinId || !placesData || !placesData.places[activePinId]) return;
    const place = placesData.places[activePinId];
    const pool = mediaPoolForPlace(place);
    const count = pool && Array.isArray(pool.items) ? pool.items.length : 0;
    if (count < 2) return;
    activeMediaIndex = (activeMediaIndex + delta + count) % count;
    renderMedia(place, activePinId);
  }

  const BOOK_NAMES_ES = {
    Genesis: "Génesis", Exodus: "Éxodo", Numbers: "Números", Joshua: "Josué", Judges: "Jueces",
    "1 Kings": "1 Reyes", "2 Kings": "2 Reyes", Isaiah: "Isaías", Matthew: "Mateo", Mark: "Marcos",
    Luke: "Lucas", John: "Juan", Acts: "Hechos", Romans: "Romanos", Revelation: "Apocalipsis",
  };
  const BOOK_NAMES_EN = Object.fromEntries(Object.entries(BOOK_NAMES_ES).map(([en, es]) => [es, en]));

  function canonicalReference(reference) {
    let text = String(reference || "").trim();
    Object.entries(BOOK_NAMES_EN).forEach(([es, en]) => {
      if (text === es || text.startsWith(`${es} `)) text = en + text.slice(es.length);
    });
    return text;
  }

  function displayReference(reference) {
    let text = canonicalReference(reference);
    if (lang !== "es") return text;
    Object.entries(BOOK_NAMES_ES).forEach(([en, es]) => {
      if (text === en || text.startsWith(`${en} `)) text = es + text.slice(en.length);
    });
    return text;
  }

  function extractScriptureRefs(text) {
    if (!text) return [];
    const rx = /\b(?:Genesis|Exodus|Numbers|Joshua|Judges|1 Kings|2 Kings|Isaiah|Matthew|Mark|Luke|John|Acts|Romans|Revelation|Génesis|Éxodo|Números|Josué|Jueces|1 Reyes|2 Reyes|Isaías|Mateo|Marcos|Lucas|Juan|Hechos|Romanos|Apocalipsis)\s+\d+(?::\d+(?:[–-]\d+)?)?(?:[–-]\d+(?::\d+)?)?/gi;
    return text.match(rx) || [];
  }

  function collectScriptureRefs(place, journey, note) {
    const refs = [];
    if (place && Array.isArray(place.scriptureRefs)) refs.push(...place.scriptureRefs);
    if (journey && Array.isArray(journey.scriptureRefs)) refs.push(...journey.scriptureRefs);
    refs.push(...extractScriptureRefs(fallbackText(note)));
    refs.push(...extractScriptureRefs(fallbackText(place && place.desc)));
    return [...new Set(refs.map(canonicalReference).filter(Boolean))];
  }

  function renderScripture(place, placeId, journey, note) {
    ++bibleRenderToken;
    const refs = collectScriptureRefs(place, journey, note);
    scriptureHeading.textContent = lang === "es" ? "Textos bíblicos" : "Biblical texts";
    scriptureRefs.replaceChildren();
    scriptureText.replaceChildren();

    if (!refs.length) {
      const empty = document.createElement("p");
      empty.className = "scripture-empty";
      empty.textContent = lang === "es" ? "No hay referencias asociadas todavía." : "No references are associated yet.";
      scriptureText.appendChild(empty);
      return;
    }

    const journeyId = currentJourneyKey;
    refs.forEach((reference) => {
      const chip = document.createElement(externalBibleResolver ? "button" : "span");
      chip.className = "scripture-ref";
      chip.textContent = displayReference(reference);
      if (externalBibleResolver) {
        chip.type = "button";
        chip.title = lang === "es" ? "Abrir en la Biblia secundaria" : "Open in the secondary Bible";
        chip.addEventListener("click", () => {
          Promise.resolve(externalBibleResolver({reference,language:lang,mapId:currentMap.id,placeId,journeyId}))
            .catch(error => console.warn("Verbo Atlas Bible resolver failed.", error));
        });
      }
      scriptureRefs.appendChild(chip);
    });

    const notice = document.createElement("div");
    notice.className = "scripture-connect";
    notice.textContent = externalBibleResolver
      ? (lang === "es" ? "Selecciona una referencia para abrirla sin cambiar tu Biblia principal." : "Select a reference to open it without changing your main Bible.")
      : (lang === "es" ? "Conecta la Biblia de Verbo para abrir estas referencias." : "Connect Verbo’s Bible layer to open these references.");
    scriptureText.appendChild(notice);
  }

  function openPanel(id) {
    const changedPin = activePinId !== id;
    activePinId = id;
    if (changedPin) activeMediaIndex = 0;
    document.querySelectorAll(".pin").forEach((p) => p.classList.toggle("active", p.dataset.id === id));
    const place = placesData.places[id];
    if (!place) return;
    panelKicker.textContent = lang === "es" ? "Ubicación" : "Location";
    panelTitle.textContent = resolveText(place.name, { scope: "place-name", mapId: currentMap.id, placeId: id });
    const journey = currentJourneyKey && placesData.journeys && placesData.journeys[currentJourneyKey];
    const note = journey && journey.placeNotes && journey.placeNotes[id];
    panelDesc.textContent = resolveText(note || place.desc, { scope: note ? "use-place-note" : "place-description", mapId: currentMap.id, placeId: id, journeyId: currentJourneyKey });
    renderMedia(place, id);
    renderScripture(place, id, journey, note);
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    panelBackdrop.classList.add("open");
  }

  function closePanel() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    panelBackdrop.classList.remove("open");
  }

  function populateMapSelect() {
    mapSelect.replaceChildren();
    mapsRegistry.maps.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = resolveText(m.label, { scope: "map-title", mapId: m.id });
      mapSelect.appendChild(opt);
    });
  }

  function populateJourneySelect() {
    journeySelect.replaceChildren();
    Object.entries(placesData.journeys || {}).forEach(([key, journey]) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = resolveText(journey.label, { scope: "journey-title", mapId: currentMap.id, journeyId: key });
      journeySelect.appendChild(opt);
    });
    journeySelect.disabled = !journeySelect.options.length;
  }

  function refreshHint() {
    const journey = currentJourneyKey && placesData && placesData.journeys && placesData.journeys[currentJourneyKey];
    if (journey && journey.desc) {
      hintText.textContent = resolveText(journey.desc, { scope: "use-description", mapId: currentMap.id, journeyId: currentJourneyKey });
      return;
    }
    hintText.textContent = lang === "es"
      ? "El SVG maestro permanece intacto · Selecciona un uso o ruta y toca un punto"
      : "The master SVG remains intact · Choose a use or route and tap a point";
  }

  function refreshTexts() {
    if (atlasLabel) atlasLabel.textContent = lang === "es" ? "Mapa Verbo" : "Verbo Map";
    mapTitle.textContent = resolveText(currentMap.label, { scope: "map-title", mapId: currentMap.id });
    populateMapSelect();
    mapSelect.value = currentMap.id;
    populateJourneySelect();
    if (currentJourneyKey && placesData.journeys[currentJourneyKey]) journeySelect.value = currentJourneyKey;
    if (langToggle) langToggle.textContent = lang.toUpperCase();
    if (mapControlLabel) mapControlLabel.textContent = lang === "es" ? "Mapa" : "Map";
    if (useControlLabel) useControlLabel.textContent = lang === "es" ? "Uso / ruta" : "Use / route";
    if (zoomInButton) {
      const text = lang === "es" ? "Acercar" : "Zoom in";
      zoomInButton.setAttribute("aria-label", text);
      zoomInButton.title = text;
    }
    if (zoomOutButton) {
      const text = lang === "es" ? "Alejar" : "Zoom out";
      zoomOutButton.setAttribute("aria-label", text);
      zoomOutButton.title = text;
    }
    if (zoomResetButton) {
      const text = lang === "es" ? "Restablecer vista" : "Reset view";
      zoomResetButton.setAttribute("aria-label", text);
      zoomResetButton.title = text;
    }
    if (mapFrame) mapFrame.setAttribute("aria-label", lang === "es"
      ? "Mapa interactivo. Usa rueda, pellizco o controles para acercar y alejar."
      : "Interactive map. Use the wheel, pinch gesture, or controls to zoom.");
    refreshHint();
    applyMasterTranslations();
    document.querySelectorAll(".pin-label[data-place-id]").forEach((el) => {
      const id = el.dataset.placeId;
      el.textContent = resolveText(placesData.places[id].name, { scope: "place-name", mapId: currentMap.id, placeId: id });
    });
    document.querySelectorAll(".pin[data-id]").forEach((el) => {
      const id = el.dataset.id;
      el.setAttribute("aria-label", resolveText(placesData.places[id].name, { scope: "place-name", mapId: currentMap.id, placeId: id }));
    });
    if (activePinId) openPanel(activePinId);
  }

  async function switchMap(mapId, resetPanel) {
    currentMap = mapsRegistry.maps.find((m) => m.id === mapId);
    if (!currentMap) return;
    const loaded = await loadMapData(currentMap);
    if (!loaded) return;
    rememberMapId(currentMap.id);
    if (resetPanel) closePanel();
    activePinId = null;
    resetCamera();
    applyMasterTranslations();
    populateJourneySelect();
    currentJourneyKey = Object.keys(placesData.journeys || {})[0] || null;
    journeySelect.value = currentJourneyKey || "";
    if (currentJourneyKey) renderJourney(currentJourneyKey, false);
    else { layerRoute.replaceChildren(); layerPins.replaceChildren(); }
    refreshTexts();
    requestAnimationFrame(fitMapFrame);
  }

  async function setLanguage(next) {
    lang = next;
    refreshTexts();
  }

  async function init() {
    await Promise.all([loadRegistry(), loadMediaCatalog()]);
    populateMapSelect();
    const savedMapId = storedMapId();
    const initialMap = mapsRegistry.maps.find((map) => map.id === savedMapId) || mapsRegistry.maps[0];
    await switchMap(initialMap.id, false);
    installZoomInteractions();

    mapSelect.addEventListener("change", (e) => switchMap(e.target.value, true));
    journeySelect.addEventListener("change", (e) => renderJourney(e.target.value, true));
    if (langToggle) langToggle.addEventListener("click", () => setLanguage(lang === "es" ? "en" : "es"));
    panelClose.addEventListener("click", closePanel);
    panelBackdrop.addEventListener("click", closePanel);
    mediaPrev && mediaPrev.addEventListener("click", () => changeMedia(-1));
    mediaNext && mediaNext.addEventListener("click", () => changeMedia(1));
    panel && panel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" && event.target.closest(".panel-media")) { event.preventDefault(); changeMedia(-1); }
      if (event.key === "ArrowRight" && event.target.closest(".panel-media")) { event.preventDefault(); changeMedia(1); }
      if (event.key === "Escape") closePanel();
    });
    window.addEventListener("resize", fitMapFrame, { passive: true });
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(() => fitMapFrame());
      observer.observe(mapStage);
    }
    requestAnimationFrame(fitMapFrame);
  }

  // Integration hook for Verbo's production translation layer.
  // Resolver signature: ({ entry, language, fallback, scope, mapId, ... }) => string | Promise<string>
  window.VerboAtlas = {
    setLanguage,
    getLanguage: () => lang,
    fitMapFrame,
    setTextResolver(resolver) {
      externalTextResolver = typeof resolver === "function" ? resolver : null;
      if (currentMap) refreshTexts();
    },
    setBibleResolver(resolver) {
      externalBibleResolver = typeof resolver === "function" ? resolver : null;
      if (activePinId && placesData && placesData.places[activePinId]) openPanel(activePinId);
    },
    getMediaForPlace(placeId) {
      if (!placesData || !placesData.places[placeId]) return null;
      const place = placesData.places[placeId];
      return mediaPoolForPlace(place);
    },
    resetView: resetCamera,
    zoomIn() { zoomFromCenter(BUTTON_ZOOM_FACTOR); },
    zoomOut() { zoomFromCenter(1 / BUTTON_ZOOM_FACTOR); },
    getZoom() {
      const [, , mw, mh] = masterViewBox;
      const [, , w, h] = getCurrentViewBox();
      return Math.max(mw / w, mh / h);
    },
    getCurrentMap: () => currentMap && currentMap.id,
  };

  init().catch((error) => {
    console.error(error);
    hintText.textContent = "No se pudo cargar el atlas: " + error.message;
  });
})();
