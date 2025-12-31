import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdOutlineAnimation } from "@react-icons/all-files/md/MdOutlineAnimation";
import { MdOutlineDesignServices } from "@react-icons/all-files/md/MdOutlineDesignServices";
import { MdOutlineMenuBook } from "@react-icons/all-files/md/MdOutlineMenuBook";
import PATHS from "config/constants/sub/paths";
import "./DesignToolbar.scss";

const DESIGN_TOOLBAR_POSITION_KEY = "design-toolbar-position";

interface Position {
  x: number;
  y: number;
}

export const DesignToolbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const isInteractionsPage =
    location.pathname === PATHS.DESIGN.INTERACTIONS.RELATIVE ||
    location.pathname === PATHS.DESIGN.INTERACTIONS.ABSOLUTE;

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem(DESIGN_TOOLBAR_POSITION_KEY);
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        setPosition(pos);
      } catch (e) {
        // Invalid saved position, use default
      }
    }
  }, []);

  // Apply position to toolbar
  useEffect(() => {
    if (toolbarRef.current) {
      if (position.x === 0 && position.y === 0) {
        // Default: center bottom
        toolbarRef.current.style.left = "50%";
        toolbarRef.current.style.bottom = "24px";
        toolbarRef.current.style.transform = "translateX(-50%)";
      } else {
        toolbarRef.current.style.left = `${position.x}px`;
        toolbarRef.current.style.top = `${position.y}px`;
        toolbarRef.current.style.bottom = "auto";
        toolbarRef.current.style.transform = "none";
      }
    }
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start dragging if clicking on a button
    if ((e.target as HTMLElement).closest(".design-toolbar-button")) {
      return;
    }

    if (toolbarRef.current) {
      setIsDragging(true);
      const rect = toolbarRef.current.getBoundingClientRect();
      dragStartPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (toolbarRef.current) {
        const newX = e.clientX - dragStartPos.current.x;
        const newY = e.clientY - dragStartPos.current.y;

        // Constrain to viewport
        const maxX = window.innerWidth - toolbarRef.current.offsetWidth;
        const maxY = window.innerHeight - toolbarRef.current.offsetHeight;

        const constrainedX = Math.max(0, Math.min(newX, maxX));
        const constrainedY = Math.max(0, Math.min(newY, maxY));

        setPosition({ x: constrainedX, y: constrainedY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Save position to localStorage
      if (toolbarRef.current) {
        const rect = toolbarRef.current.getBoundingClientRect();
        localStorage.setItem(DESIGN_TOOLBAR_POSITION_KEY, JSON.stringify({ x: rect.left, y: rect.top }));
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleInteractionsClick = () => {
    navigate(PATHS.DESIGN.INTERACTIONS.ABSOLUTE);
  };

  return (
    <div ref={toolbarRef} className={`design-toolbar ${isDragging ? "dragging" : ""}`} onMouseDown={handleMouseDown}>
      <div className="design-toolbar-content">
        <button
          className={`design-toolbar-button ${isInteractionsPage ? "active" : ""}`}
          onClick={handleInteractionsClick}
          title="Design Interactions"
        >
          <MdOutlineAnimation size={16} />
          <span>Interactions</span>
        </button>

        <button
          className="design-toolbar-button design-toolbar-button-placeholder"
          disabled
          title="Design System (Coming Soon)"
        >
          <MdOutlineDesignServices size={16} />
          <span>Design System</span>
        </button>

        <button
          className="design-toolbar-button design-toolbar-button-placeholder"
          disabled
          title="Guidelines (Coming Soon)"
        >
          <MdOutlineMenuBook size={16} />
          <span>Guidelines</span>
        </button>
      </div>
    </div>
  );
};
