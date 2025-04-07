import React from "react";
import { Breadcrumb, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { getBreadcrumbItems } from "../../utils/navigationUtils";

function PageTitleBreadcrumb({
  title,
  path,
  isAddNew,
  onclickToggle = () => {},
  btnTitle = "Add New",
  btnIcon = "",
}) {
  const breadcrumbItems = getBreadcrumbItems(path);

  return (
    <div className="mb-3 mx-3 my-2">
      <div className="p-3">
        <h2 className="mb-2 text-center py-4">{title}</h2>
        <div className="d-flex justify-content-between">
          <Breadcrumb className="mb-0">
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

          {isAddNew && (
            <Button
              variant="primary"
              onClick={onclickToggle}
              className="d-flex align-items-center btn btn-sm"
            >
              <i className={`bi ${btnIcon ? btnIcon : "bi-plus-lg"}`}></i>
              <span className="ms-2">{btnTitle}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PageTitleBreadcrumb;
