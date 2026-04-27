import React from "react";
import { Breadcrumb } from "react-bootstrap";
import { Link } from "react-router-dom";
import { getBreadcrumbItems } from "../../utils/navigationUtils";

function PageTitleBreadcrumb({
  title,
  path,
  isAddNew,
  onclickToggle = () => { },
  btnTitle = "Add New",
  btnIcon = "",
  customButton = null,
  disabled = false,
  icon = "", // New prop to explicitly pass the icon from sidebar
}) {
  const breadcrumbItems = getBreadcrumbItems(path);

  const getDynamicIcon = (titleText) => {
    const t = titleText.toLowerCase();
    if (t.includes("growth")) return "bi-graph-up-arrow";
    if (t.includes("user") || t.includes("account") || t.includes("profile")) return "bi-person";
    if (t.includes("dashboard") || t.includes("overview")) return "bi-speedometer2";
    if (t.includes("analytics") || t.includes("trend") || t.includes("statistic")) return "bi-bar-chart-steps";
    if (t.includes("setting")) return "bi-gear";
    if (t.includes("announcement") || t.includes("news")) return "bi-megaphone";
    if (t.includes("report")) return "bi-trend-up";
    if (t.includes("slideshow")) return "bi-images";
    return "bi-layers";
  };

  // Use the passed icon if available, otherwise fallback to dynamic detection
  const bgIcon = icon ? (icon.startsWith("bi ") ? icon.replace("bi ", "") : icon) : getDynamicIcon(title);

  return (
    <div className="mb-5 mt-4">
      <div className="p-4 rounded-4 position-relative overflow-hidden shadow-sm" style={{
        background: 'var(--bs-tertiary-bg)',
        border: '1px solid var(--bs-border-color-translucent)'
      }}>
        {/* Abstract Background Decoration - Dynamic based on sidebar icon or content */}
        <div className="position-absolute top-0 end-0 opacity-10" style={{ transform: 'translate(20%, -20%)' }}>
          <i className={`bi ${bgIcon}`} style={{ fontSize: '10rem' }}></i>
        </div>

        <div className="position-relative d-flex flex-column flex-md-row align-items-center justify-content-between gap-4" style={{ zIndex: 1 }}>
          <div className="text-center text-md-start">
            <h2 className="fw-black mb-1" style={{ color: 'var(--bs-emphasis-color)', letterSpacing: '-1.5px' }}>{title}</h2>
            <Breadcrumb className="mb-0 custom-modern-breadcrumb">
              {breadcrumbItems.map((item, index) => (
                <Breadcrumb.Item
                  key={index}
                  linkAs={item.link ? Link : undefined}
                  linkProps={item.link ? { to: item.link } : undefined}
                  active={index === breadcrumbItems.length - 1}
                >
                  {item.text}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Render custom button if provided, otherwise fallback to default */}
            {customButton ? (
              customButton
            ) : isAddNew ? (
              <button
                onClick={onclickToggle}
                disabled={disabled}
                className="btn-modern-primary-sm d-flex align-items-center gap-2"
              >
                <i className={`bi ${btnIcon ? btnIcon : "bi-plus-lg"}`}></i>
                <span>{btnTitle}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

    </div>
  );
}

export default PageTitleBreadcrumb;
