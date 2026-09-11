import { useEffect, useRef, useState } from "react";
import { advertiserPaths, advertiserRouteEvent, AdvertiserTab, advertiserTabFromPath } from "../../advertiserRoutes";

const locationKey = () => location.pathname + location.search + location.hash;
const historyIndex = () => typeof history.state?.advertiserIndex === "number" ? history.state.advertiserIndex as number : null;

export function useAdvertiserNavigation(canLeave: () => boolean, onLeave: () => void) {
  const [tab, setTab] = useState(() => advertiserTabFromPath(location.pathname));
  const state = useRef({ index: historyIndex() ?? 0, url: locationKey(), restoring: false, canLeave, onLeave });
  state.current.canLeave = canLeave;
  state.current.onLeave = onLeave;
  useEffect(() => {
    if (historyIndex() === null) history.replaceState({ ...history.state, advertiserIndex: state.current.index }, "");
    const sync = () => {
      state.current.index = historyIndex() ?? state.current.index;
      state.current.url = locationKey();
      setTab(advertiserTabFromPath(location.pathname));
    };
    const pop = (event: PopStateEvent) => {
      const current = state.current;
      if (current.restoring) { current.restoring = false; event.stopImmediatePropagation(); return; }
      if (locationKey() === current.url) return;
      if (!current.canLeave()) {
        event.stopImmediatePropagation();
        const target = historyIndex();
        if (target !== null && target !== current.index) {
          current.restoring = true;
          history.go(current.index - target);
        } else history.replaceState({ ...history.state, advertiserIndex: current.index }, "", current.url);
        return;
      }
      current.onLeave();
      sync();
    };
    window.addEventListener("popstate", pop, true);
    window.addEventListener(advertiserRouteEvent, sync);
    return () => { window.removeEventListener("popstate", pop, true); window.removeEventListener(advertiserRouteEvent, sync); };
  }, []);
  const navigate = (next: AdvertiserTab) => {
    if (advertiserTabFromPath(location.pathname) === next || !state.current.canLeave()) return;
    state.current.onLeave();
    const index = state.current.index + 1;
    history.pushState({ advertiserIndex: index }, "", advertiserPaths[next]);
    window.dispatchEvent(new Event(advertiserRouteEvent));
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return { tab, navigate };
}
