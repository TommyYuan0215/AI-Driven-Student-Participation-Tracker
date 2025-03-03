import React from 'react';

function ExampleCarouselImage({ text, imageUrl }) {
  return (
    <div 
      className="carousel-image-container"
      style={{
        height: '80vh',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'  // Added for overlay positioning
      }}
    >
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt={text}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.30)',  // 75% opaque black overlay
              pointerEvents: 'none'  // Allows clicking through the overlay
            }}
          />
        </>
      ) : (
        <div 
          style={{
            color: '#fff',
            fontSize: '1.5rem',
            padding: '20px'
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

export default ExampleCarouselImage;