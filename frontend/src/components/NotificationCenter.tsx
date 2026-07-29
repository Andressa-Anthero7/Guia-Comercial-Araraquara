import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellRing, CheckCheck, Smartphone } from "lucide-react";
import {
  BackofficeNotification, getPushConfig, loadBackofficeNotifications,
  markAllNotificationsRead, markNotificationRead, savePushSubscription
} from "../api";

function base64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(character => character.charCodeAt(0)));
}

function relativeDate(value: string) {
  const minutes = Math.round((new Date(value).getTime() - Date.now()) / 60000);
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<BackofficeNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [enablingPush, setEnablingPush] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const unread = useMemo(
    () => notifications.filter(notification => !notification.is_read).length,
    [notifications]
  );

  const reload = async () => {
    try {
      setNotifications(await loadBackofficeNotifications());
    } catch {
      // The global session handler will handle authentication errors.
    }
  };

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), 30000);
    const focus = () => void reload();
    window.addEventListener("focus", focus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    const inspectPush = async () => {
      if (!("serviceWorker" in navigator) || typeof Notification === "undefined") return;
      setPermission(Notification.permission);
      if (Notification.permission !== "granted") {
        setPushEnabled(false);
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration("/");
      setPushEnabled(Boolean(await registration?.pushManager.getSubscription()));
    };
    void inspectPush();
  }, [open]);

  const enablePush = async () => {
    setError("");
    setEnablingPush(true);
    try {
      if (typeof Notification === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Este navegador não oferece suporte a notificações push.");
      }
      if (Notification.permission === "denied") {
        setPermission("denied");
        throw new Error("As notificações estão bloqueadas. Clique no ícone ao lado do endereço do site, abra as permissões, selecione “Permitir” em Notificações e recarregue a página.");
      }
      const permission = await Notification.requestPermission();
      setPermission(permission);
      if (permission === "denied") {
        throw new Error("A permissão foi bloqueada. Abra as permissões do site na barra de endereço, altere Notificações para “Permitir” e recarregue a página.");
      }
      if (permission !== "granted") {
        throw new Error("A permissão não foi concluída. Clique novamente em ativar e escolha “Permitir” na mensagem do navegador.");
      }
      const { public_key } = await getPushConfig();
      if (!public_key) throw new Error("O push ainda não foi configurado no servidor.");
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(public_key)
      });
      await savePushSubscription(subscription.toJSON());
      setPushEnabled(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível ativar o push.");
    } finally {
      setEnablingPush(false);
    }
  };

  const openNotification = async (notification: BackofficeNotification) => {
    if (!notification.is_read) await markNotificationRead(notification.id);
    window.location.href = notification.url || "/backoffice";
  };

  const markAll = async () => {
    await markAllNotificationsRead();
    await reload();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen(value => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-slate-700 hover:bg-slate-50"
        title="Notificacoes"
      >
        {unread ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {unread > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,390px)] overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div><div className="text-sm font-bold text-slate-950">Notificações</div><div className="text-xs text-slate-500">{unread} não lida(s)</div></div>
            {unread > 0 && <button onClick={()=>void markAll()} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-950"><CheckCheck className="h-4 w-4"/>Marcar todas</button>}
          </div>
          {!pushEnabled && (
            <div className="border-b border-slate-200 bg-slate-50 p-3">
              <button disabled={enablingPush} onClick={()=>void enablePush()} className="flex w-full items-center gap-3 rounded-md border border-slate-300 bg-white p-3 text-left hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60">
                <Smartphone className="h-5 w-5 text-slate-600"/>
                <span><b className="block text-xs text-slate-900">{enablingPush ? "Ativando notificações..." : "Ativar notificações neste dispositivo"}</b><small className="text-slate-500">Receba alertas mesmo fora do Backoffice.</small></span>
              </button>
              {permission === "denied" && !error && <div className="mt-2 text-xs font-semibold text-amber-700">Notificações bloqueadas neste navegador. Libere a permissão nas configurações do site.</div>}
              {error && <div className="mt-2 text-xs font-semibold text-rose-700">{error}</div>}
            </div>
          )}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
            {notifications.map(notification => (
              <button key={notification.id} onClick={()=>void openNotification(notification)} className={`block w-full px-4 py-3 text-left hover:bg-slate-50 ${notification.is_read ? "bg-white" : "bg-blue-50/50"}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.is_read ? "bg-slate-300" : "bg-blue-600"}`}/>
                  <span className="min-w-0"><b className="block text-sm text-slate-900">{notification.title}</b><span className="mt-0.5 block text-xs leading-relaxed text-slate-600">{notification.message}</span><small className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{relativeDate(notification.created_at)}</small></span>
                </div>
              </button>
            ))}
            {!notifications.length && <div className="px-4 py-10 text-center text-sm text-slate-500">Nenhuma notificação no momento.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
