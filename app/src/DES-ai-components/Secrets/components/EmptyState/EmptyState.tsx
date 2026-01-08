import React from "react";
import { RQButton } from "lib/design-system-v2/components";
import { MdAdd } from "@react-icons/all-files/md/MdAdd";
import "./EmptyState.scss";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actionLabel, onAction, icon }) => {
  return (
    <div className="secrets-empty-state">
      {icon && <div className="secrets-empty-state__icon">{icon}</div>}
      <div className="secrets-empty-state__content">
        <h3 className="secrets-empty-state__title">{title}</h3>
        <p className="secrets-empty-state__description">{description}</p>
      </div>
      {actionLabel && onAction && (
        <RQButton type="primary" icon={<MdAdd />} onClick={onAction} className="secrets-empty-state__action">
          {actionLabel}
        </RQButton>
      )}
    </div>
  );
};
