import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaBook, FaSearch, FaBookmark, FaUser } from "react-icons/fa"; // Используем react-icons

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <div className="tabs-container">
      {/* Контент страницы */}
      <div className="tab-content">
        <Outlet />
      </div>

      {/* Нижняя панель навигации */}
      <nav className="bottom-navigation">
        <NavLink
          to="/library"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <FaBook size={24} />
          <span>{t("tabs.library")}</span>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <FaSearch size={24} />
          <span>{t("tabs.search")}</span>
        </NavLink>

        <NavLink
          to="/mybooks"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <FaBookmark size={24} />
          <span>{t("tabs.my_books")}</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <FaUser size={24} />
          <span>{t("tabs.profile")}</span>
        </NavLink>
      </nav>
    </div>
  );
}
