import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { BackofficeSession, ensureCsrf, mapBusiness, request } from "../api";
import { Business } from "../types";
import { NotificationCenter } from "../components/NotificationCenter";
import { AdvertiserOnboarding } from "../components/AdvertiserOnboarding";
import { BusinessManagementModal } from "../components/BusinessManagementModal";
import { optimizeImageFile, parseTags } from "../utils/content";
import { BACKOFFICE_VERSION } from "../version";
import { refreshCategories } from "../categories";
import {
  Field,
  RecordData,
  Resource,
  resourceByKey,
  resources,
} from "./resources";
import "./management.css";

interface Props {
  businesses: Business[];
  onSaveBusiness: (business: Business) => Promise<void>;
  onChangeBusinessStatus: (
    business: Business,
    status: NonNullable<Business["status"]>,
  ) => Promise<void>;
  onDeleteBusiness: (business: Business) => Promise<void>;
  onBusinessCreated: (business: Business) => void;
  onExit: () => void | Promise<void>;
  onLogout: () => void | Promise<void>;
  session: BackofficeSession;
}
const newLabel = (resource: Resource) =>
  `${["categories", "tags", "reviews", "subscriptions", "invoices"].includes(resource.key) ? "Nova" : "Novo"} ${resource.singular}`;
const apiPath = (key: string, id?: string | number) =>
  `/api/backoffice/${key}/${id == null ? "" : `${encodeURIComponent(id)}/`}`;
const money = (value: any) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const visibleStatus = (resource: Resource, row: RecordData) =>
  resource.key === "invoices" &&
  row.status === "open" &&
  row.due_date < localToday()
    ? "overdue"
    : row[resource.filter || "status"];
const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
const routePath = (key: string, id?: any) =>
  `/backoffice/gestao/${key}${id == null ? "" : `/${encodeURIComponent(id)}`}`;
const currentRoute = () => {
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts[1] === "gestao")
    return {
      key: parts[2] || "dashboard",
      id: parts[3] ? decodeURIComponent(parts[3]) : "",
    };
  if (parts[1] === "estabelecimentos")
    return { key: "businesses", id: parts[2] || "" };
  return {
    key:
      (
        {
          financeiro: "invoices",
          comercial: "advertisements",
          "novo-anuncio": "onboarding",
          cadastro: "businesses",
          avaliacoes: "reviews",
        } as Record<string, string>
      )[parts[1]] || "dashboard",
    id: parts[1] === "cadastro" ? "novo" : "",
  };
};

export function Backoffice(props: Props) {
  const [route, setRoute] = useState(currentRoute);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const change = () => setRoute(currentRoute());
    addEventListener("popstate", change);
    return () => removeEventListener("popstate", change);
  }, []);
  const navigate = (key: string, id?: any) => {
    if (!dispatchEvent(new Event("management-navigate", { cancelable: true })))
      return;
    history.pushState({}, "", routePath(key, id));
    setRoute(currentRoute());
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };
  const resource = resourceByKey(route.key);
  const changed = (key: string, item: RecordData) => {
    if (key === "businesses") props.onBusinessCreated(mapBusiness(item as any));
    if (key === "categories") void refreshCategories();
  };
  return (
    <div className="management">
      {menuOpen && (
        <button
          className="mg-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`mg-sidebar ${menuOpen ? "is-open" : ""}`}>
        <a
          className="mg-brand"
          href="/backoffice"
          onClick={(event) => {
            event.preventDefault();
            navigate("dashboard");
          }}
        >
          <span>
            <Building2 size={24} />
          </span>
          <div>
            Guia Comercial<small>ARARAQUARA · GESTÃO</small>
          </div>
        </a>
        <nav aria-label="Gestão da aplicação">
          <button
            className={route.key === "dashboard" ? "selected" : ""}
            onClick={() => navigate("dashboard")}
          >
            <LayoutDashboard size={17} />
            Visão geral
          </button>
          {[...new Set(resources.map((item) => item.group))].map((group) => (
            <div key={group}>
              <p className="mg-nav-group">{group}</p>
              {resources
                .filter((item) => item.group === group)
                .map((item) => (
                  <button
                    key={item.key}
                    className={route.key === item.key ? "selected" : ""}
                    onClick={() => navigate(item.key)}
                  >
                    {item.title}
                    <ChevronRight size={14} />
                  </button>
                ))}
            </div>
          ))}
        </nav>
        <div className="mg-sidebar-foot">
          <span>Backoffice {BACKOFFICE_VERSION}</span>
          <button onClick={props.onExit}>
            Ver guia público <ArrowUpRight size={16} />
          </button>
        </div>
      </aside>
      <div className="mg-workspace">
        <header className="mg-topbar">
          <div>
            <button
              className="mg-menu mg-icon"
              aria-label="Abrir menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span className="mg-breadcrumb">
              Gestão <span>/</span>{" "}
              {resource?.title ||
                (route.key === "onboarding"
                  ? "Novo anunciante"
                  : "Visão geral")}
            </span>
          </div>
          <div>
            <NotificationCenter />
            <span className="mg-user">
              {props.session.name || props.session.username}
              <small>
                {props.session.is_superuser
                  ? "Superadministrador"
                  : "Equipe de gestão"}
              </small>
            </span>
            <button
              className="mg-icon"
              aria-label="Sair da conta"
              onClick={props.onLogout}
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <main id="management-content">
          {route.key === "dashboard" && (
            <Dashboard
              navigate={navigate}
              name={props.session.name || props.session.username}
            />
          )}
          {resource && (
            <ResourceManager
              key={resource.key}
              resource={resource}
              recordId={route.id}
              navigate={navigate}
              superuser={!!props.session.is_superuser}
              onChanged={changed}
            />
          )}
          {route.key === "onboarding" && (
            <AdvertiserOnboarding
              onCancel={() => navigate("businesses")}
              onComplete={(business) => {
                props.onBusinessCreated(business);
                navigate("businesses");
              }}
            />
          )}
          {!resource && !["dashboard", "onboarding"].includes(route.key) && (
            <div className="mg-empty">
              <h1>Módulo não encontrado</h1>
              <button onClick={() => navigate("dashboard")}>
                Voltar à visão geral
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Dashboard({
  navigate,
  name,
}: {
  navigate: (key: string, id?: any) => void;
  name: string;
}) {
  const [data, setData] = useState<Record<string, RecordData[]> | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      const keys = [
        "businesses",
        "advertisements",
        "reviews",
        "invoices",
        "subscriptions",
      ];
      const values = await Promise.all(
        keys.map((key) => request<RecordData[]>(apiPath(key))),
      );
      setData(
        Object.fromEntries(keys.map((key, index) => [key, values[index]])),
      );
    } catch (error) {
      setError(errorMessage(error));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const today = localToday();
  const pending =
    data?.businesses.filter((item) => item.status === "pending") || [];
  const reviews = data?.reviews.filter((item) => !item.is_approved) || [];
  const ads =
    data?.advertisements.filter((item) => item.status === "review") || [];
  const overdue =
    data?.invoices.filter(
      (item) =>
        item.status === "overdue" ||
        (item.status === "open" && item.due_date < today),
    ) || [];
  const open =
    data?.invoices.filter((item) =>
      ["open", "overdue"].includes(item.status),
    ) || [];
  return (
    <>
      <div className="mg-page-heading">
        <div>
          <p className="mg-eyebrow">SEU PAINEL DE CONTROLE</p>
          <h1>Olá, {name.split(" ")[0]}.</h1>
          <p>Acompanhe o guia e cuide do que precisa de atenção.</p>
        </div>
        <button className="mg-primary" onClick={() => navigate("onboarding")}>
          <Plus size={18} />
          Novo anunciante
        </button>
      </div>
      {error && (
        <div className="mg-error" role="alert">
          {error}
          <button onClick={load}>Tentar novamente</button>
        </div>
      )}
      {!data && !error && <p role="status">Carregando visão geral…</p>}
      {data && (
        <>
          <div className="mg-stats">
            {[
              {
                label: "Empresas publicadas",
                value: data.businesses.filter(
                  (item) => item.status === "active",
                ).length,
                detail: `${data.businesses.length} cadastros no guia`,
                key: "businesses",
              },
              {
                label: "Empresas pagas",
                value: data.businesses.filter(
                  (item) => item.plan_type === "paid",
                ).length,
                detail: "Planos e páginas personalizadas",
                key: "businesses",
              },
              {
                label: "A receber",
                value: money(
                  open.reduce((sum, item) => sum + Number(item.total), 0),
                ),
                detail: `${open.length} cobranças em aberto`,
                key: "invoices",
              },
              {
                label: "Em atraso",
                value: money(
                  overdue.reduce((sum, item) => sum + Number(item.total), 0),
                ),
                detail: `${overdue.length} cobranças vencidas`,
                key: "invoices",
              },
            ].map((item) => (
              <button
                key={item.label}
                className="mg-stat"
                onClick={() => navigate(item.key)}
              >
                <span>
                  {item.label}
                  <ArrowUpRight size={17} />
                </span>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </button>
            ))}
          </div>
          <div className="mg-dashboard-grid">
            <section className="mg-panel">
              <div className="mg-panel-heading">
                <h2>Precisa de atenção</h2>
                <button
                  className="mg-icon"
                  aria-label="Atualizar visão geral"
                  onClick={load}
                >
                  <RefreshCw size={17} />
                </button>
              </div>
              {[
                {
                  label: "Cadastros aguardando aprovação",
                  count: pending.length,
                  key: "businesses",
                },
                {
                  label: "Avaliações para moderar",
                  count: reviews.length,
                  key: "reviews",
                },
                {
                  label: "Anúncios em revisão",
                  count: ads.length,
                  key: "advertisements",
                },
                {
                  label: "Cobranças vencidas",
                  count: overdue.length,
                  key: "invoices",
                },
              ].map((item) => (
                <button
                  className="mg-task"
                  key={item.key}
                  onClick={() => navigate(item.key)}
                >
                  <span>{item.label}</span>
                  <strong
                    className={item.count ? "mg-count attention" : "mg-count"}
                  >
                    {item.count}
                  </strong>
                  <ChevronRight size={17} />
                </button>
              ))}
            </section>
            <section className="mg-panel">
              <div className="mg-panel-heading">
                <h2>Rotinas frequentes</h2>
              </div>
              <div className="mg-quick-links">
                <button onClick={() => navigate("businesses")}>
                  <Building2 size={22} />
                  <strong>Liberar uma empresa</strong>
                  <span>
                    Editar cadastro, selecionar Pago e definir o subdomínio.
                  </span>
                </button>
                <button onClick={() => navigate("invoices", "novo")}>
                  <Plus size={22} />
                  <strong>Criar cobrança</strong>
                  <span>Escolher assinatura, valor e vencimento.</span>
                </button>
              </div>
            </section>
          </div>
          <section className="mg-panel">
            <div className="mg-panel-heading">
              <h2>Todos os módulos</h2>
              <span>{resources.length} áreas de gestão</span>
            </div>
            <div className="mg-module-grid">
              {resources.map((item) => (
                <button key={item.key} onClick={() => navigate(item.key)}>
                  <strong>
                    {item.title}
                    <ArrowUpRight size={16} />
                  </strong>
                  <span>{item.description}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}

function initialValues(resource: Resource, record?: RecordData): RecordData {
  return Object.fromEntries(
    resource.fields.map((field) => {
      let value =
        record?.[field.key] ??
        field.initial ??
        (field.type === "checkbox" ? false : "");
      if (record && field.key === "images")
        value = (record.gallery_images ?? record.images ?? []).map(
          (item: any) => (typeof item === "string" ? item : item.image),
        );
      if (record && field.key === "tags")
        value = record.tag_names ?? record.tags ?? [];
      if (field.type === "datetime-local" && value) {
        const date = new Date(value);
        value = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      }
      return [field.key, value];
    }),
  );
}

function displayValue(
  field: Field | undefined,
  value: any,
  references: Record<string, RecordData[]>,
) {
  if (field?.resource) {
    const target = resourceByKey(field.resource)!;
    const lookup = (id: any) => {
      const row = references[field.resource!]?.find(
        (item) => String(item[field.valueKey || "id"]) === String(id),
      );
      return row ? row[target.labelKey] || `#${row.id}` : id ? `#${id}` : "—";
    };
    return Array.isArray(value) ? value.map(lookup).join(", ") : lookup(value);
  }
  if (field?.options)
    return (
      field.options.find(
        (option) => String(option[0]) === String(value),
      )?.[1] ?? value
    );
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (field?.type === "money" || field?.key === "total") return money(value);
  if (field?.type?.startsWith("date") && value)
    return new Date(
      String(value).length === 10 ? `${value}T12:00:00` : value,
    ).toLocaleString(
      "pt-BR",
      field.type === "date"
        ? { dateStyle: "short" }
        : { dateStyle: "short", timeStyle: "short" },
    );
  return value === "" || value == null ? "—" : String(value);
}

function ResourceManager({
  resource,
  recordId,
  navigate,
  superuser,
  onChanged,
}: {
  resource: Resource;
  recordId: string;
  navigate: (key: string, id?: any) => void;
  superuser: boolean;
  onChanged: (key: string, item: RecordData) => void;
}) {
  const [rows, setRows] = useState<RecordData[]>([]);
  const [references, setReferences] = useState<Record<string, RecordData[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<RecordData | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const canWrite = !resource.privileged || superuser;
  const preview = rows.find((row) => row.id === previewId);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const dependencies = [
        ...new Set(
          resource.fields.map((field) => field.resource).filter(Boolean),
        ),
      ] as string[];
      const values = await Promise.all([
        request<RecordData[]>(apiPath(resource.key)),
        ...dependencies.map((key) => request<RecordData[]>(apiPath(key))),
      ]);
      setRows(values[0]);
      setReferences(
        Object.fromEntries(
          dependencies.map((key, index) => [key, values[index + 1]]),
        ),
      );
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [resource]);
  useEffect(() => {
    void load();
  }, [load]);
  const record = rows.find(
    (item) => String(item[resource.lookup || "id"]) === recordId,
  );
  const filtered = useMemo(
    () =>
      rows.filter(
        (item) =>
          (!filter || String(visibleStatus(resource, item)) === filter) &&
          (!search ||
            resource.columns
              .map((key) =>
                displayValue(
                  resource.fields.find((field) => field.key === key),
                  key === resource.filter
                    ? visibleStatus(resource, item)
                    : item[key],
                  references,
                ),
              )
              .join(" ")
              .toLocaleLowerCase("pt-BR")
              .includes(search.toLocaleLowerCase("pt-BR"))),
      ),
    [rows, filter, search, resource, references],
  );
  const filterField = resource.fields.find(
    (field) => field.key === resource.filter,
  );
  const options = filterField?.options ?? [
    ["true", "Sim"],
    ["false", "Não"],
  ];
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pages);
  const label = (key: string) =>
    resource.fields.find((field) => field.key === key)?.label ??
    (
      { total: "Total", business_name: "Estabelecimento" } as Record<
        string,
        string
      >
    )[key] ??
    key;
  const value = (row: RecordData, key: string) =>
    displayValue(
      resource.fields.find((field) => field.key === key) ?? { key, label: key },
      key === resource.filter ? visibleStatus(resource, row) : row[key],
      references,
    );
  const exportCsv = () => {
    const escape = (value: any) => {
      let text = String(value ?? "");
      if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const contents = [
      resource.columns.map(label),
      ...filtered.map((row) => resource.columns.map((key) => value(row, key))),
    ]
      .map((row) => row.map(escape).join(";"))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", contents], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${resource.key}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      await ensureCsrf();
      await request(apiPath(resource.key, deleting[resource.lookup || "id"]), {
        method: "DELETE",
      });
      setRows((rows) => rows.filter((item) => item.id !== deleting.id));
      onChanged(resource.key, { ...deleting, status: "inactive" });
      setDeleting(null);
      setMessage("Cadastro excluído.");
    } catch (error) {
      setError(errorMessage(error));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };
  if (recordId && !loading && !error) {
    if (recordId !== "novo" && !record)
      return (
        <div className="mg-empty">
          <h1>Cadastro não encontrado</h1>
          <button onClick={() => navigate(resource.key)}>Voltar à lista</button>
        </div>
      );
    return (
      <RecordEditor
        key={`${resource.key}-${recordId}`}
        resource={resource}
        record={record}
        references={references}
        superuser={superuser}
        onCancel={() => navigate(resource.key)}
        onSaved={(item) => {
          setRows((rows) =>
            record
              ? rows.map((row) => (row.id === item.id ? item : row))
              : [item, ...rows],
          );
          onChanged(resource.key, item);
          setMessage("Cadastro salvo com sucesso.");
          navigate(resource.key);
        }}
      />
    );
  }
  return (
    <>
      <div className="mg-page-heading">
        <div>
          <p className="mg-eyebrow">{resource.group}</p>
          <h1>{resource.title}</h1>
          <p>{resource.description}</p>
        </div>
        {canWrite && (
          <button
            className="mg-primary"
            onClick={() => {
              setMessage("");
              navigate(resource.key, "novo");
            }}
          >
            <Plus size={18} />
            {newLabel(resource)}
          </button>
        )}
      </div>
      {message && (
        <div className="mg-success" role="status">
          <Check size={18} />
          {message}
          <button aria-label="Fechar aviso" onClick={() => setMessage("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {error && (
        <div role="alert" className="mg-error">
          {error}
          <button onClick={load}>Tentar novamente</button>
        </div>
      )}
      <section className="mg-panel">
        <div className="mg-toolbar">
          <label className="mg-search">
            <Search size={18} />
            <input
              aria-label="Pesquisar cadastros"
              placeholder={`Pesquisar ${resource.title.toLowerCase()}…`}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          {resource.filter && (
            <label className="mg-filter">
              {filterField?.label}
              <select
                aria-label={filterField?.label}
                id={
                  resource.key === "businesses"
                    ? "backoffice-status-filter"
                    : undefined
                }
                value={filter}
                onChange={(event) => {
                  setFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todas</option>
                {options.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            className="mg-secondary"
            onClick={exportCsv}
            disabled={loading || !!error}
          >
            <Download size={16} />
            Exportar
          </button>
          <button
            className="mg-icon"
            aria-label="Atualizar lista"
            onClick={load}
          >
            <RefreshCw size={18} />
          </button>
        </div>
        {loading ? (
          <div className="mg-empty" role="status">
            Carregando cadastros…
          </div>
        ) : error ? (
          <div className="mg-empty">A lista não pôde ser atualizada.</div>
        ) : !filtered.length ? (
          <div className="mg-empty">
            <Search size={30} />
            <h2>
              {rows.length
                ? "Nenhum resultado encontrado"
                : "Nenhum cadastro ainda"}
            </h2>
            <p>
              {rows.length
                ? "Ajuste a pesquisa ou o filtro para encontrar o cadastro."
                : `Use ${newLabel(resource)} para começar.`}
            </p>
          </div>
        ) : (
          <>
            <div className="mg-table-wrap">
              <table>
                <thead>
                  <tr>
                    {resource.columns.map((key) => (
                      <th key={key}>{label(key)}</th>
                    ))}
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .slice((currentPage - 1) * 20, currentPage * 20)
                    .map((row) => (
                      <tr key={row.id}>
                        {resource.columns.map((key, index) => (
                          <td key={key} data-label={label(key)}>
                            {index === 0 ? (
                              <button
                                className="mg-record-link"
                                onClick={() =>
                                  navigate(
                                    resource.key,
                                    row[resource.lookup || "id"],
                                  )
                                }
                              >
                                <span>{value(row, key)}</span>
                                {resource.key === "businesses" && (
                                  <small>
                                    {row.category_name || "Sem categoria"}
                                  </small>
                                )}
                              </button>
                            ) : key === resource.filter ||
                              key === "plan_type" ? (
                              <span
                                className={`mg-badge ${["active", "paid", "published", true].includes(row[key]) ? "positive" : ""}`}
                              >
                                {value(row, key)}
                              </span>
                            ) : (
                              value(row, key)
                            )}
                          </td>
                        ))}
                        <td data-label="Ações">
                          <div className="mg-row-actions">
                            {resource.key === "businesses" && (
                              <button onClick={() => setPreviewId(row.id)}>
                                Resumo
                              </button>
                            )}
                            <button
                              onClick={() =>
                                navigate(
                                  resource.key,
                                  row[resource.lookup || "id"],
                                )
                              }
                            >
                              {canWrite && !row.is_superuser
                                ? "Editar"
                                : "Consultar"}
                            </button>
                            {canWrite && !resource.noDelete && (
                              <button
                                className="mg-danger-link"
                                onClick={() => setDeleting(row)}
                              >
                                Excluir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="mg-pagination">
              <span>
                {filtered.length} registro(s) · Página {currentPage} de {pages}
              </span>
              <div>
                <button
                  className="mg-icon"
                  aria-label="Página anterior"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="mg-icon"
                  aria-label="Próxima página"
                  disabled={currentPage >= pages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      {preview && (
        <BusinessManagementModal
          business={mapBusiness(preview as any)}
          onClose={() => setPreviewId(null)}
          onEdit={() => {
            setPreviewId(null);
            navigate(resource.key, preview.slug);
          }}
          onDelete={async () => {
            setPreviewId(null);
            setDeleting(preview);
          }}
          onStatusChange={async (_, status) => {
            await ensureCsrf();
            const item = await request<RecordData>(
              apiPath("businesses", preview.slug),
              { method: "PATCH", body: JSON.stringify({ status }) },
            );
            setRows((rows) =>
              rows.map((row) => (row.id === item.id ? item : row)),
            );
            onChanged("businesses", item);
          }}
        />
      )}
      {deleting && (
        <div className="mg-modal">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-heading"
            className="mg-confirm"
          >
            <h2 id="delete-heading">Excluir {resource.singular}?</h2>
            <p>
              <strong>
                {deleting[resource.labelKey] || `#${deleting.id}`}
              </strong>
            </p>
            <p>
              A exclusão é permanente e pode remover conteúdo vinculado. Para
              preservar o histórico, prefira desativar o cadastro quando essa
              opção estiver disponível.
            </p>
            <div className="mg-actions">
              <button
                className="mg-secondary"
                autoFocus
                disabled={busy}
                onClick={() => setDeleting(null)}
              >
                Cancelar
              </button>
              <button className="mg-danger" disabled={busy} onClick={remove}>
                {busy ? "Excluindo…" : "Excluir definitivamente"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function RecordEditor({
  resource,
  record,
  references,
  superuser,
  onCancel,
  onSaved,
}: {
  resource: Resource;
  record?: RecordData;
  references: Record<string, RecordData[]>;
  superuser: boolean;
  onCancel: () => void;
  onSaved: (item: RecordData) => void;
}) {
  const initial = useMemo(
    () => initialValues(resource, record),
    [resource, record],
  );
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const readonly = resource.privileged && (!superuser || record?.is_superuser);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useEffect(() => {
    const warn = (event: Event) => {
      if (dirty && !saving && !confirm("Descartar as alterações não salvas?"))
        event.preventDefault();
    };
    addEventListener("management-navigate", warn);
    return () => removeEventListener("management-navigate", warn);
  }, [dirty, saving]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);
  const change = (key: string, value: any) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  const cancel = onCancel;
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || uploading || readonly) return;
    setSaving(true);
    setError("");
    try {
      const payload: RecordData = {};
      for (const field of resource.fields) {
        if (
          (field.privileged && !superuser) ||
          (field.type === "password" && !form[field.key])
        )
          continue;
        if (
          record &&
          JSON.stringify(form[field.key]) === JSON.stringify(initial[field.key])
        )
          continue;
        let value = form[field.key];
        if (field.type === "datetime-local" && value)
          value = new Date(value).toISOString();
        if (value === "" && field.nullable) value = null;
        payload[field.key] = value;
      }
      if (resource.key === "businesses") {
        const limit = form.plan_type === "paid" ? 5 : 1;
        if (form.images.length > limit)
          throw new Error(
            `Este plano permite ${limit} imagem(ns). Remova as imagens extras da galeria antes de salvar.`,
          );
        if (form.images.some((value: string) => !value.trim()))
          throw new Error(
            "Envie uma imagem em cada espaço da galeria ou remova os espaços vazios.",
          );
        if (form.plan_type === "free")
          for (const key of [
            "public_subdomain",
            "meta_pixel_id",
            "google_analytics_id",
            "google_ads_id",
            "is_featured",
          ]) {
            if (form[key]) payload[key] = key === "is_featured" ? false : "";
          }
        else if (
          form.public_subdomain &&
          !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(form.public_subdomain)
        )
          throw new Error(
            "Subdomínio inválido. Use até 63 letras minúsculas, números e hífens, sem hífen no início ou fim.",
          );
      }
      await ensureCsrf();
      const item = await request<RecordData>(
        apiPath(resource.key, record?.[resource.lookup || "id"]),
        { method: record ? "PATCH" : "POST", body: JSON.stringify(payload) },
      );
      onSaved(item);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };
  const grouped: { name: string; fields: Field[] }[] = [];
  resource.fields.forEach((field) => {
    if (field.section || !grouped.length)
      grouped.push({ name: field.section || "Dados do cadastro", fields: [] });
    grouped[grouped.length - 1].fields.push(field);
  });
  const fieldControl = (field: Field) => {
    const id = `manage-${field.key}`;
    const disabled =
      !!readonly ||
      (!!field.privileged && !superuser) ||
      (resource.key === "businesses" &&
        form.plan_type !== "paid" &&
        [
          "public_subdomain",
          "meta_pixel_id",
          "google_analytics_id",
          "google_ads_id",
          "is_featured",
        ].includes(field.key));
    const common = {
      id,
      "aria-label": field.label,
      disabled,
      required: field.required,
      value: form[field.key] ?? "",
      onChange: (event: any) => change(field.key, event.target.value),
      maxLength: field.maxLength,
    };
    if (field.type === "checkbox")
      return (
        <label className="mg-checkbox" htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            checked={!!form[field.key]}
            disabled={disabled}
            onChange={(event) => change(field.key, event.target.checked)}
          />
          <span>{field.label}</span>
        </label>
      );
    if (field.type === "image")
      return (
        <ImageInput
          id={id}
          value={form[field.key]}
          disabled={disabled}
          onChange={(value) => change(field.key, value)}
          onError={setError}
          onBusy={setUploading}
        />
      );
    if (field.type === "gallery" || field.type === "media")
      return (
        <MediaInput
          field={field}
          value={form[field.key]}
          disabled={disabled}
          onChange={(value) => change(field.key, value)}
          onError={setError}
          onBusy={setUploading}
        />
      );
    if (field.type === "textarea") return <textarea {...common} rows={4} />;
    if (field.type === "tags")
      return (
        <input
          {...common}
          value={(form[field.key] || []).join(", ")}
          onChange={(event) => change(field.key, event.target.value.split(","))}
          onBlur={() => change(field.key, parseTags(form[field.key].join(",")))}
          placeholder="Separe as tags por vírgula"
        />
      );
    if (field.resource) {
      const target = resourceByKey(field.resource)!;
      let options = references[field.resource] ?? [];
      if (field.key === "user")
        options = options.filter(
          (item) =>
            (!item.is_staff && !item.is_superuser) || item.id === form.user,
        );
      if (resource.key === "coupons")
        options = options.filter(
          (item) =>
            item.plan_type === "paid" ||
            item[field.valueKey || "id"] === form[field.key],
        );
      if (
        resource.key === "subscriptions" &&
        field.key === "business" &&
        form.advertiser
      ) {
        const owner = references.advertisers?.find(
          (item) => String(item.id) === String(form.advertiser),
        );
        options = options.filter(
          (item) =>
            owner?.businesses.includes(item.id) || item.id === form.business,
        );
      }
      if (
        resource.key === "subscriptions" &&
        field.key === "advertisement" &&
        form.business
      )
        options = options.filter(
          (item) => String(item.business) === String(form.business),
        );
      return (
        <>
          <select
            {...common}
            multiple={field.type === "multireference"}
            value={
              field.type === "multireference"
                ? (form[field.key] || []).map(String)
                : (form[field.key] ?? "")
            }
            onChange={(event) =>
              change(
                field.key,
                field.type === "multireference"
                  ? Array.from(event.target.selectedOptions, (option) =>
                      Number(option.value),
                    )
                  : event.target.value,
              )
            }
          >
            {field.type !== "multireference" && (
              <option value="">
                {field.required ? "Selecione…" : "Sem vínculo"}
              </option>
            )}
            {options.map((item) => (
              <option key={item.id} value={item[field.valueKey || "id"]}>
                {field.resource === "subscriptions"
                  ? `${item.business_name} · ${item.advertiser_name} · #${item.id}`
                  : item[target.labelKey] || `#${item.id}`}
              </option>
            ))}
          </select>
          {field.type === "multireference" && (
            <small>
              Use Ctrl ou Cmd para selecionar mais de um estabelecimento.
            </small>
          )}
        </>
      );
    }
    if (field.options)
      return (
        <select {...common}>
          {form[field.key] &&
            !field.options.some(
              (item) => String(item[0]) === String(form[field.key]),
            ) && <option value={form[field.key]}>Valor atual</option>}
          {field.options.map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      );
    return (
      <input
        {...common}
        type={field.type === "money" ? "number" : field.type || "text"}
        step={field.type === "money" ? "0.01" : undefined}
        min={["money", "number"].includes(field.type || "") ? 0 : undefined}
        autoComplete={field.type === "password" ? "new-password" : undefined}
        onChange={(event) =>
          change(
            field.key,
            field.key === "public_subdomain"
              ? event.target.value.trim().toLowerCase()
              : event.target.value,
          )
        }
      />
    );
  };
  return (
    <form onSubmit={save} className="mg-editor">
      <button type="button" className="mg-back" onClick={cancel}>
        <ArrowLeft size={17} />
        Voltar para {resource.title.toLowerCase()}
      </button>
      <div className="mg-page-heading">
        <div>
          <p className="mg-eyebrow">{resource.title}</p>
          <h1>
            {record
              ? record[resource.labelKey] || `Editar ${resource.singular}`
              : newLabel(resource)}
          </h1>
          <p>
            {readonly
              ? "Consulta do cadastro. Esta conta não permite alterações neste registro."
              : "Confira os dados e salve as alterações."}
          </p>
        </div>
        {resource.key === "businesses" &&
          record?.public_subdomain &&
          record.status === "active" && (
            <a
              className="mg-secondary"
              href={`https://${record.public_subdomain}.guiacomararaquara.com.br`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir página <ArrowUpRight size={16} />
            </a>
          )}
      </div>
      <fieldset disabled={saving || uploading} className="mg-editor-fields">
        {grouped.map((group) => (
          <section key={group.name} className="mg-panel">
            <div className="mg-panel-heading">
              <h2>{group.name}</h2>
            </div>
            <div className="mg-form-grid">
              {group.fields.map((field) => (
                <div
                  key={field.key}
                  className={`mg-field ${["textarea", "gallery", "media"].includes(field.type || "") ? "wide" : ""}`}
                >
                  {field.type !== "checkbox" && (
                    <label htmlFor={`manage-${field.key}`}>
                      {field.label}
                      {field.required && <span aria-hidden="true"> *</span>}
                    </label>
                  )}
                  {fieldControl(field)}
                  {field.hint && <small>{field.hint}</small>}
                  {resource.key === "businesses" &&
                    field.key === "public_subdomain" &&
                    form.plan_type === "paid" &&
                    form.public_subdomain && (
                      <small className="mg-url">
                        https://{form.public_subdomain}.guiacomararaquara.com.br
                      </small>
                    )}
                  {resource.key === "businesses" &&
                    field.key === "plan_type" &&
                    form.plan_type === "free" &&
                    initial.plan_type === "paid" && (
                      <p className="mg-warning">
                        Ao salvar como gratuito, o subdomínio, o destaque e as
                        integrações de marketing serão desativados. A galeria
                        deve ficar com uma imagem.
                      </p>
                    )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </fieldset>
      {resource.key === "invoices" && (
        <p className="mg-total">
          Total da cobrança:{" "}
          <strong>
            {money(
              Number(form.amount) -
                Number(form.discount) +
                Number(form.late_fee),
            )}
          </strong>
        </p>
      )}
      {error && (
        <div className="mg-error" role="alert">
          {error}
        </div>
      )}
      <div className="mg-savebar">
        <span>
          {dirty
            ? "Alterações ainda não salvas"
            : record?.updated_at
              ? `Atualizado em ${new Date(record.updated_at).toLocaleString("pt-BR")}`
              : ""}
        </span>
        <div>
          <button
            type="button"
            className="mg-secondary"
            onClick={cancel}
            disabled={saving || uploading}
          >
            Cancelar
          </button>
          {!readonly && (
            <button
              type="submit"
              className="mg-primary"
              disabled={saving || uploading}
            >
              {saving
                ? "Salvando…"
                : uploading
                  ? "Processando imagem…"
                  : "Salvar cadastro"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function ImageInput({
  id,
  value,
  disabled,
  onChange,
  onError,
  onBusy,
}: {
  id: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onError: (error: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  return (
    <div className="mg-image-input">
      {value && <img src={value} alt="Prévia da imagem" />}
      <input
        id={id}
        aria-label={id.startsWith("manage-") ? undefined : "Link da imagem"}
        placeholder="https://… ou envie um arquivo"
        disabled={disabled}
        type="text"
        inputMode="url"
        value={value?.startsWith("data:") ? "" : value || ""}
        onChange={(event) => onChange(event.target.value)}
      />
      <label className="mg-file">
        <span>Enviar imagem</span>
        <input
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            onBusy(true);
            try {
              onChange(await optimizeImageFile(file));
            } catch (error) {
              onError(errorMessage(error));
            } finally {
              onBusy(false);
            }
          }}
        />
      </label>
      {value && (
        <button
          type="button"
          className="mg-danger-link"
          disabled={disabled}
          onClick={() => onChange("")}
        >
          Remover imagem
        </button>
      )}
    </div>
  );
}

function MediaInput({
  field,
  value,
  disabled,
  onChange,
  onError,
  onBusy,
}: {
  field: Field;
  value: any[];
  disabled: boolean;
  onChange: (value: any[]) => void;
  onError: (error: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const media = field.type === "media";
  const change = (index: number, update: any) =>
    onChange(
      value.map((item, position) => (position === index ? update : item)),
    );
  return (
    <div className="mg-gallery" id={`manage-${field.key}`}>
      {(value || []).map((item, index) => (
        <div className="mg-gallery-item" key={index}>
          <div className="mg-gallery-header">
            <strong>
              {media ? "Mídia" : "Imagem"} {index + 1}
            </strong>
            <div>
              <button
                type="button"
                disabled={disabled || index === 0}
                onClick={() => {
                  const items = [...value];
                  [items[index - 1], items[index]] = [
                    items[index],
                    items[index - 1],
                  ];
                  onChange(items);
                }}
              >
                Mover acima
              </button>
              <button
                type="button"
                className="mg-danger-link"
                disabled={disabled}
                onClick={() =>
                  onChange(value.filter((_, position) => position !== index))
                }
              >
                Remover
              </button>
            </div>
          </div>
          {media && (
            <label>
              Tipo
              <select
                value={item.media_type}
                disabled={disabled}
                onChange={(event) =>
                  change(index, { ...item, media_type: event.target.value })
                }
              >
                <option value="image">Imagem</option>
                <option value="video">Vídeo</option>
              </select>
            </label>
          )}
          {!media || item.media_type === "image" ? (
            <ImageInput
              id={`${field.key}-${index}`}
              disabled={disabled}
              value={media ? item.file_data : item}
              onChange={(value) =>
                change(index, media ? { ...item, file_data: value } : value)
              }
              onError={onError}
              onBusy={onBusy}
            />
          ) : (
            <label>
              Link do vídeo
              <input
                type="url"
                required
                disabled={disabled}
                value={item.file_data}
                onChange={(event) =>
                  change(index, { ...item, file_data: event.target.value })
                }
              />
            </label>
          )}
          {media && (
            <>
              <label>
                Texto alternativo
                <input
                  disabled={disabled}
                  value={item.alt_text || ""}
                  onChange={(event) =>
                    change(index, { ...item, alt_text: event.target.value })
                  }
                />
              </label>
              <label>
                Legenda
                <input
                  disabled={disabled}
                  value={item.caption || ""}
                  onChange={(event) =>
                    change(index, { ...item, caption: event.target.value })
                  }
                />
              </label>
            </>
          )}
        </div>
      ))}
      <button
        type="button"
        className="mg-secondary"
        disabled={disabled || value.length >= 10}
        onClick={() =>
          onChange([
            ...value,
            media
              ? {
                  media_type: "image",
                  file_data: "",
                  alt_text: "",
                  caption: "",
                  order: value.length,
                }
              : "",
          ])
        }
      >
        <Plus size={16} />
        Adicionar {media ? "mídia" : "imagem"}
      </button>
    </div>
  );
}
