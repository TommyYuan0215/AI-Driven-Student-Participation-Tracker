import React from 'react';
import { Spinner } from 'react-bootstrap';

function LoadingSpinner({ text = "Loading..." }) {
    return (
        <div 
            className="d-flex flex-column align-items-center justify-content-center"             
            style={{ minHeight: 'calc(100vh - 250px)' }}
        > 
            <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">{text}</span>
            </Spinner>
            <p className="mt-3 text-primary">{text}</p>
        </div>
    );
}

export default LoadingSpinner;