import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check, Code, FolderTree, Terminal, Video } from 'lucide-react';

const onboardingData = [
  {
    id: '1',
    title: 'Welcome to Code Canvas',
    description: 'Your all-in-one coding environment. Build, learn, and share code anywhere.',
    icon: Code,
  },
  {
    id: '2',
    title: 'File Explorer',
    description: 'Browse and manage your projects with ease. Create, edit, and organize files and folders.',
    icon: FolderTree,
  },
  {
    id: '3',
    title: 'Integrated Terminal',
    description: 'Run commands, execute code, and install packages directly from the app.',
    icon: Terminal,
  },
  {
    id: '4',
    title: 'Learn with DevReels',
    description: 'Watch short-form coding tutorials and tips from experienced developers.',
    icon: Video,
  },
];

const OnboardingScreen = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = () => {
    // Set onboarding completed flag in localStorage
    localStorage.setItem('hasCompletedOnboarding', 'true');
    navigate('/auth');
  };

  const skipOnboarding = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    navigate('/auth');
  };

  const currentSlide = onboardingData[currentIndex];
  const IconComponent = currentSlide.icon;

  return (
    <div className="onboarding-screen">
      <button className="skip-button" onClick={skipOnboarding}>Skip</button>
      
      <div className="slide">
        <div className="icon-container">
          <IconComponent size={40} color="#3794FF" />
        </div>
        <h1 className="title">{currentSlide.title}</h1>
        <p className="description">{currentSlide.description}</p>
      </div>
      
      <div className="footer">
        <div className="pagination">
          {onboardingData.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
            />
          ))}
        </div>
        
        <button className="next-button" onClick={handleNext}>
          {currentIndex < onboardingData.length - 1 ? (
            <ChevronRight size={24} color="#FFFFFF" />
          ) : (
            <Check size={24} color="#FFFFFF" />
          )}
        </button>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .onboarding-screen {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #1E1E1E;
          color: white;
          position: relative;
        }
        
        .skip-button {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          color: #9D9D9D;
          font-size: 16px;
          cursor: pointer;
        }
        
        .slide {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }
        
        .icon-container {
          width: 80px;
          height: 80px;
          border-radius: 40px;
          background-color: rgba(55, 148, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        
        .title {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 16px;
        }
        
        .description {
          font-size: 16px;
          max-width: 400px;
          line-height: 1.6;
          margin-bottom: 40px;
          color: #9D9D9D;
        }
        
        .footer {
          padding: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .pagination {
          display: flex;
        }
        
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 4px;
          background-color: #3E3E42;
          margin-right: 8px;
        }
        
        .dot.active {
          width: 24px;
          background-color: #3794FF;
        }
        
        .next-button {
          width: 56px;
          height: 56px;
          border-radius: 28px;
          background-color: #3794FF;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
        }
      `}} />
    </div>
  );
};

export default OnboardingScreen;