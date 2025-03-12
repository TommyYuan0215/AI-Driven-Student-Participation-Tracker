import React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getBreadcrumbItems } from '../utils/navigationUtils';

function PageTitleBreadcrumb({ title, path }) {
    const breadcrumbItems = getBreadcrumbItems(path);

    return (
        <div className="mb-3 mx-3 my-2">
            <div className="p-3">
                <h2 className="mb-2 text-center py-4">{title}</h2>
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
            </div>
        </div>
    );
}

export default PageTitleBreadcrumb;