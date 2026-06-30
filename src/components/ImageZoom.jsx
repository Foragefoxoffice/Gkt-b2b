import React, { useState, useRef, useEffect } from 'react';

const ImageZoom = ({ src, alt, className, onClick, style, imgStyle }) => {
  const [showZoom, setShowZoom] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 });
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const LENS_SIZE = 160; // Smaller lens for stronger magnification
  const ZOOM_PANEL_SIZE = "580px"; // Larger zoom panel (600x600)
  const ZOOM_PANNEL_HEIGHT = "96vh";

  // For mobile inline zoom
  const [mobileZoomStyle, setMobileZoomStyle] = useState({
    transformOrigin: 'center center',
    transform: 'scale(1)',
    transition: 'transform 0.15s ease-out'
  });

  const handleMouseMove = (e) => {
    if (!imgRef.current) return;

    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    let x = e.clientX - left;
    let y = e.clientY - top;

    if (isMobile) {
      // Inline zoom for mobile
      const px = (x / width) * 100;
      const py = (y / height) * 100;
      setMobileZoomStyle({
        transformOrigin: `${px}% ${py}%`,
        transform: 'scale(2.2)',
        transition: 'none'
      });
    } else {
      setShowZoom(true);
      setImgDims({ width, height });

      let lensX = x - LENS_SIZE / 2;
      let lensY = y - LENS_SIZE / 2;

      // Restrict lens within the image boundaries
      if (lensX < 0) lensX = 0;
      if (lensY < 0) lensY = 0;
      if (lensX > width - LENS_SIZE) lensX = width - LENS_SIZE;
      if (lensY > height - LENS_SIZE) lensY = height - LENS_SIZE;

      setLensPos({ x: lensX, y: lensY });

      // Calculate percentage for background position
      const bgX = (lensX / (width - LENS_SIZE)) * 100;
      const bgY = (lensY / (height - LENS_SIZE)) * 100;

      setBgPos({ x: bgX, y: bgY });
    }
  };

  const handleMouseLeave = () => {
    setShowZoom(false);
    if (isMobile) {
      setMobileZoomStyle({
        transformOrigin: 'center center',
        transform: 'scale(1)',
        transition: 'transform 0.15s ease-out'
      });
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center ${isMobile ? 'overflow-hidden rounded-lg' : ''}`}
      style={{ width: '100%', height: '100%', ...style }}
    >
      <div
        className="relative cursor-crosshair overflow-hidden rounded-lg inline-flex items-center justify-center shadow-lg border border-slate-200/50"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`${className}`}
          style={{
            display: 'block',
            // Make main image smaller on desktop
            ...(!isMobile ? { maxWidth: '350px', maxHeight: '100vh' } : mobileZoomStyle),
            ...imgStyle
          }}
        />

        {/* Desktop Lens */}
        {!isMobile && showZoom && (
          <div
            className="absolute bg-white/20 border border-white/50 pointer-events-none"
            style={{
              width: `${LENS_SIZE}px`,
              height: `${LENS_SIZE}px`,
              left: `${lensPos.x}px`,
              top: `${lensPos.y}px`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)'
            }}
          />
        )}
      </div>

      {/* Desktop Right Side Zoom Panel */}
      {!isMobile && showZoom && imgDims.width > 0 && (
        <div
          className="absolute z-[2000] bg-white rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-slate-200 pointer-events-none overflow-hidden"
          style={{
            left: 'calc(100% + 30px)', // Gap from the image
            top: '50%',
            transform: 'translateY(-50%)',
            width: `${ZOOM_PANEL_SIZE}`,
            height: `${ZOOM_PANNEL_HEIGHT}`,
            backgroundImage: `url(${src})`,
            backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
            // Mathematically exact scale mapping lens area to zoom panel
            backgroundSize: `${(imgDims.width / LENS_SIZE) * 100}% ${(imgDims.height / LENS_SIZE) * 100}%`,
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}
    </div>
  );
};

export default ImageZoom;
