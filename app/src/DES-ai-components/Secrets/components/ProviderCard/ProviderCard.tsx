import React from "react";
import { Dropdown, Tooltip } from "antd";
import { Provider, PROVIDER_TYPE_INFO, getConfigSummary } from "../../types";
import { MdMoreVert } from "@react-icons/all-files/md/MdMoreVert";
import { MdDelete } from "@react-icons/all-files/md/MdDelete";
import { RQButton } from "lib/design-system-v2/components";
import "./ProviderCard.scss";

interface ProviderCardProps {
  provider: Provider;
  onClick: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onClick, onDelete }) => {
  const typeInfo = PROVIDER_TYPE_INFO[provider.type];
  const secretCount = provider.secrets.length;
  const configSummary = getConfigSummary(provider.type, provider.config || {});

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDeleteClick = (info: { key: string; domEvent: React.MouseEvent }) => {
    info.domEvent.stopPropagation();
    onDelete(provider);
  };

  const menuItems = [
    {
      key: "delete",
      danger: true,
      icon: <MdDelete />,
      label: "Delete provider",
      onClick: handleDeleteClick,
    },
  ];

  return (
    <div
      className="provider-card"
      onClick={() => onClick(provider)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick(provider);
        }
      }}
    >
      <div
        className="provider-card__icon"
        style={{
          backgroundColor: typeInfo.bgColor,
          borderColor: typeInfo.color,
        }}
      >
        <span className="provider-card__icon-text" style={{ color: typeInfo.color }}>
          {typeInfo.shortLabel}
        </span>
      </div>

      <div className="provider-card__content">
        <div className="provider-card__header">
          <h4 className="provider-card__name">{provider.name}</h4>
          <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
            <RQButton
              type="transparent"
              icon={<MdMoreVert />}
              onClick={handleMenuClick}
              className="provider-card__menu-btn"
            />
          </Dropdown>
        </div>

        <div className="provider-card__meta">
          <span
            className="provider-card__type"
            style={{
              color: typeInfo.color,
              backgroundColor: typeInfo.bgColor,
              borderColor: `${typeInfo.color}40`,
            }}
          >
            {typeInfo.label}
          </span>
          <span className="provider-card__separator">•</span>
          <span className="provider-card__secrets">
            {secretCount} {secretCount === 1 ? "secret" : "secrets"}
          </span>
          {configSummary && (
            <>
              <span className="provider-card__separator">•</span>
              <Tooltip title={configSummary}>
                <span className="provider-card__config">{configSummary}</span>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
