"use client";

import React, { FC, useEffect, useState } from 'react';
import './style/btt.css';

const BackToTopButton: FC = () => {

  const [isVisible, setIsVisible] = useState<boolean>(false);

  const scrollToTop = (): void => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const toggleVisibility = (): void => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <button 
      className={`back-to-top ${isVisible ? 'show' : ''}`} 
      onClick={scrollToTop}
      title="Zum Seitenanfang"
      aria-label="Nach oben scrollen"
    >
      ↑
    </button>
  );
};

export default BackToTopButton;