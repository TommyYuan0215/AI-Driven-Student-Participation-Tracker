import { sidebarItems as adminItems } from "../views/Admin/AdminNavigation";
import { sidebarItems as educatorItems } from "../views/Educator/EducatorNavigation";

export const getBreadcrumbItems = (currentPath) => {
  if (!currentPath) return [];

  const items = [];
  const normalizedPath = currentPath.startsWith("/views")
    ? currentPath
    : `/views${currentPath}`;
  const isAdminPath = normalizedPath.includes("/views/admin");
  const navigationItems = isAdminPath ? adminItems : educatorItems;
  const basePath = <i className="bi bi-house"></i>;
  const baseLink = isAdminPath ? "/admin/dashboard" : "/educator/dashboard";

  const findMatchingItem = (navItems, path, breadcrumbPath = []) => {
    for (const item of navItems) {
      const itemPath = item.path?.startsWith("/views")
        ? item.path
        : `/views${item.path}`;

      const isDisabled =
        (item.id === "settings" ||
          item.id === "datamanagement" ||
          item.id === "postanalytics" ||
          item.id === "contentmanagement") &&
        item.subItems;

      if (itemPath === path) {
        return [...breadcrumbPath, { ...item, disabled: isDisabled }];
      }

      if (item.subItems) {
        const result = findMatchingItem(item.subItems, path, [
          ...breadcrumbPath,
          { ...item, disabled: isDisabled },
        ]);
        if (result) return result;
      }
    }
    return null;
  };

  // Add base dashboard/home item
  items.push({
    text: basePath,
    link: baseLink,
  });

  // Find matching path and build breadcrumb
  const matchingPath = findMatchingItem(navigationItems, normalizedPath);
  if (matchingPath) {
    matchingPath.forEach((item, index) => {
      if (index < matchingPath.length - 1) {
        // Add intermediate items with links (unless disabled)
        items.push({
          text: item.label,
          link: item.disabled ? null : item.path?.replace(/^\/views/, ""),
          disabled: item.disabled,
        });
      } else {
        // Add final item without link
        items.push({ text: item.label });
      }
    });
  }

  return items;
};

// Helper function to get the correct navigation title
export const getNavigationTitle = (currentPath) => {
  const isAdminPath = currentPath.includes("/views/admin");
  const navigationItems = isAdminPath ? adminItems : educatorItems;

  const findTitle = (items, path) => {
    for (const item of items) {
      const itemPath = item.path.startsWith("/views")
        ? item.path
        : `/views${item.path}`;
      if (itemPath === path) return item.label;
      if (item.subItems) {
        const subTitle = findTitle(item.subItems, path);
        if (subTitle) return subTitle;
      }
    }
    return null;
  };

  return findTitle(navigationItems, currentPath) || "Dashboard";
};
