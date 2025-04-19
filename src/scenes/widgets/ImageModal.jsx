import React from 'react';
import { useState, useEffect } from "react";
import {useTheme} from "@mui/material";

const ImageModal = ({ images, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
    const { palette } = useTheme();



  
  useEffect(() => {
    if (isOpen) {
      // Small delay before showing content for better animation
      setTimeout(() => {
        setIsVisible(true);
      }, 50);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Disable scrolling on body when modal is open
      document.body.style.overflow = 'hidden';
      
      // Add escape key listener
      const handleEscKey = (e) => {
        if (e.key === 'Escape') onClose();
      };
      
      window.addEventListener('keydown', handleEscKey);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isOpen, onClose]);
  
  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(nextSlide, 3000); // Change slide every 3 seconds
      return () => clearInterval(interval);
    }
  }, [currentIndex, isOpen, images.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop overlay */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${isVisible ? 'opacity-80' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Modal container */}
      <div 
        className={`relative max-w-4xl w-full mx-4 transition-all duration-300 z-10 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className={`absolute -top-10 right-0 text-[${palette.neutral.mediumMain}] text-xl p-2 z-20`}
        >
          ✕
        </button>
        
        {/* Carousel */}
        <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
          {/* Navigation buttons */}
          <button 
            className={`absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-[${palette.neutral.mediumMain}]  w-10 h-10 rounded-full flex items-center justify-center z-20 hover:bg-opacity-70 transition-all`}
            onClick={prevSlide}
          >
            &lt;
          </button>
          
          <button 
            className={`absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-[${palette.neutral.mediumMain}] w-10 h-10 rounded-full flex items-center justify-center z-20 hover:bg-opacity-70 transition-all`}
            onClick={nextSlide}
          >
            &gt;
          </button>
          
          {/* Images */}
          <div className="relative h-96 md:h-[70vh] w-full">
            {images.map((img, index) => (
              <img
                key={index}
                src={`${import.meta.env.VITE_URL}/assets/${img}`}
                alt={`Slide ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                  index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              />
            ))}
          </div>
          
 
        </div>
      </div>
    </div>
  );
};

export default ImageModal;