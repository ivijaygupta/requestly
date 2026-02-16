import React from "react";
import { Provider, PROVIDER_TYPE_INFO, getConfigSummary } from "../../types";
import { MdMoreVert } from "@react-icons/all-files/md/MdMoreVert";
import { MdDelete } from "@react-icons/all-files/md/MdDelete";
import { Dropdown, Tooltip } from "../../../ui";
import { cn } from "../../../lib/utils";

interface ProviderCardProps {
  provider: Provider;
  onClick: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onClick, onDelete }) => {
  const typeInfo = PROVIDER_TYPE_INFO[provider.type];
  const secretCount = provider.secrets.length;
  const configSummary = getConfigSummary(provider.type, provider.config || {});

  const menuItems = [
    {
      key: "delete",
      danger: true,
      icon: <MdDelete />,
      label: "Delete provider",
      onClick: () => onDelete(provider),
    },
  ];

  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 p-5 rounded-xl transition-all duration-200 cursor-pointer",
        "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 hover:shadow-lg hover:shadow-black/20",
        "animate-in fade-in slide-in-from-bottom-2"
      )}
      onClick={() => onClick(provider)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick(provider);
        }
      }}
    >
      {/* Provider Icon */}
      <div
        className="flex items-center justify-center w-12 h-12 rounded-lg border-2 font-bold text-xs shrink-0 transition-transform group-hover:scale-110 duration-200"
        style={{
          backgroundColor: typeInfo.bgColor,
          borderColor: typeInfo.color,
          color: typeInfo.color,
        }}
      >
        {typeInfo.shortLabel}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-base font-semibold text-zinc-100 truncate group-hover:text-white transition-colors">
            {provider.name}
          </h4>
          <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Dropdown
              trigger={
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-100 hover:bg-zinc-700/50 transition-all"
                >
                  <MdMoreVert className="w-5 h-5" />
                </button>
              }
              items={menuItems}
              placement="bottomRight"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-zinc-500">
          {/* Provider Type Badge */}
          <span
            className="px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider font-bold"
            style={{
              color: typeInfo.color,
              backgroundColor: typeInfo.bgColor,
              borderColor: `${typeInfo.color}40`,
            }}
          >
            {typeInfo.label}
          </span>

          <span className="text-zinc-700 select-none">•</span>

          <span className="font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
            {secretCount} {secretCount === 1 ? "secret" : "secrets"}
          </span>

          {configSummary && (
            <>
              <span className="text-zinc-700 select-none">•</span>
              <Tooltip content={configSummary}>
                <span className="truncate italic max-w-[150px]">{configSummary}</span>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
