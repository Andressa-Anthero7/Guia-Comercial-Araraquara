export const advertiserPaths = {
  overview: "/area-do-anunciante",
  businesses: "/area-do-anunciante/estabelecimentos",
  ads: "/area-do-anunciante/anuncios",
  coupons: "/area-do-anunciante/cupons",
  finance: "/area-do-anunciante/financeiro",
  profile: "/area-do-anunciante/cadastro",
} as const;
export type AdvertiserTab = keyof typeof advertiserPaths;
export const advertiserRouteEvent = "advertiser-routechange";
export function advertiserTabFromPath(path: string): AdvertiserTab | null {
  const normalized = path.replace(/\/+$/, "");
  return (Object.keys(advertiserPaths) as AdvertiserTab[]).find(tab => advertiserPaths[tab] === normalized) ?? null;
}

/** Only local, known advertiser sections may be used as a post-login destination. */
export function advertiserAuthTarget(authenticated: boolean, pathname: string, search: string, hash: string) {
  const params = new URLSearchParams(search);
  let path = pathname.replace(/\/+$/, "");
  if (authenticated) {
    if (!path.startsWith("/area-do-anunciante")) {
      const next = params.get("next") || "";
      path = advertiserTabFromPath(next) ? next.replace(/\/+$/, "") : advertiserPaths.overview;
    }
    params.delete("next");
  } else {
    if (advertiserTabFromPath(path) && path !== advertiserPaths.overview) params.set("next", path);
    path = "/anunciante/login";
  }
  const query = params.toString();
  return path + (query ? `?${query}` : "") + hash;
}
