import React, { useState } from 'react';

const ImageZoom = ({ src, alt, className, onClick, style, imgStyle }) => {
  const [zoomStyle, setZoomStyle] = useState({
    transformOrigin: 'center center',
    transform: 'scale(1)',
    transition: 'transform 0.15s ease-out'
  });

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2.2)',
      transition: 'none'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)',
      transition: 'transform 0.15s ease-out'
    });
  };

  return (
    <div 
      className="overflow-hidden rounded-lg cursor-zoom-in flex items-center justify-center" 
      style={{ width: '100%', height: '100%', ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <img
        src={src}
        alt={alt}
        className={className}
        style={{
          ...zoomStyle,
          display: 'block',
          ...imgStyle
        }}
      />
    </div>
  );
};

export default ImageZoom;
