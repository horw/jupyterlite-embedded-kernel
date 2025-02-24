export const globalStyles = `
  :root {
    --ui-red: #FF3B30;
    --ui-red-dark: #E0321F;
    --ui-red-light: #FF6961;
    --ui-navy: #1C1C28;
    --ui-navy-light: #2D2D3A;
    --ui-white: #FFFFFF;
    --ui-gray: #8E8E93;
    --ui-gray-light: #F2F2F7;
    --ui-shadow-sm: 0 2px 8px rgba(28, 28, 40, 0.08);
    --ui-shadow-md: 0 8px 24px rgba(28, 28, 40, 0.12);
    --ui-shadow-lg: 0 20px 40px rgba(28, 28, 40, 0.16);
  }
`;

export const animations = `
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const overlayStyles = `
  .welcome-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(28, 28, 40, 0.75);
    backdrop-filter: blur(12px) saturate(180%);
    z-index: 999;
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
  }

  .jp-kernel-welcome-panel.visible .welcome-overlay {
    opacity: 1;
    pointer-events: all;
  }
`;

export const dialogStyles = `
  .welcome-dialog {
    will-change: transform, width, height, border-radius;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -60%);
    opacity: 0;
    background: var(--ui-white);
    padding: 2rem;
    border-radius: 20px;
    box-shadow: var(--ui-shadow-lg);
    max-width: 90%;
    width: 500px;
  }

  .jp-kernel-welcome-panel.visible .welcome-dialog {
    transform: translate(-50%, -50%);
    opacity: 1;
  }

  .jp-kernel-welcome-panel.minimizing .welcome-overlay {
    opacity: 0;
  }

  .jp-kernel-welcome-panel.minimizing .welcome-dialog {
    transform: translate(calc(100% - 60px), -20px) scale(0.2);
    border-radius: 50%;
    width: 44px;
    height: 44px;
    padding: 0;
    opacity: 1;
  }
`;

export const minimizedStyles = `
  .minimized {
    position: fixed !important;
    bottom: 20px !important;
    right: 20px !important;
    transform: none !important;
    border-radius: 50% !important;
    width: 64px !important;
    height: 64px !important;
    padding: 0 !important;
    cursor: pointer;
    background: var(--ui-red) !important;
    border: 3px solid rgba(255, 255, 255, 0.9) !important;
    box-shadow: 0 4px 16px rgba(231, 19, 45, 0.3) !important;
    z-index: 999999999 !important;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
    animation: float 2s infinite ease-in-out;
  }

  .minimized * {
    opacity: 0 !important;
    transition: opacity 0.2s ease;
  }

  .minimized::after {
    content: '⚡️';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 20px;
    opacity: 1 !important;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
  }

  .minimized:hover {
    transform: scale(1.15) !important;
    box-shadow: 0 6px 24px rgba(231, 19, 45, 0.4) !important;
    border-color: white !important;
  }

  .minimized:active {
    transform: scale(0.95) !important;
  }
`;

export const cardStyles = `
  .welcome-card {
    opacity: 0;
    transform: translateY(12px);
    animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    background: var(--ui-white) !important;
    border: 1.5px solid var(--ui-gray-light) !important;
    border-radius: 16px !important;
    padding: 1.25rem !important;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
    margin-bottom: 0.75rem;
    position: relative;
    overflow: hidden;
  }

  .welcome-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(120deg, var(--ui-red), var(--ui-red-dark));
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
  }

  .welcome-card:hover {
    transform: translateY(-2px) scale(1.02);
    border-color: var(--ui-red) !important;
    box-shadow: var(--ui-shadow-md),
                0 0 0 1px var(--ui-red),
                0 0 0 4px rgba(255, 59, 48, 0.12);
  }

  .welcome-card:hover::before {
    opacity: 1;
  }

  .welcome-card:active {
    transform: translateY(0) scale(0.98);
  }

  .card-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
  }

  .welcome-card:hover .welcome-icon,
  .welcome-card:hover .card-title,
  .welcome-card:hover .card-description {
    color: var(--ui-white) !important;
  }

  .welcome-card:nth-child(1) { animation-delay: 0.1s; }
  .welcome-card:nth-child(2) { animation-delay: 0.2s; }
  .welcome-card:nth-child(3) { animation-delay: 0.3s; }

  .welcome-icon {
    font-size: 2rem;
    margin-right: 1.25rem;
    color: var(--ui-red);
    transition: all 0.3s ease;
    text-shadow: var(--ui-shadow-sm);
  }

  .welcome-title {
    color: var(--ui-navy);
    font-size: 1.75rem !important;
    margin: 0 0 1.75rem !important;
    font-weight: 700;
    letter-spacing: -0.5px;
    line-height: 1.2;
  }

  .card-title {
    color: var(--ui-navy);
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 0.375rem;
    transition: color 0.3s ease;
    letter-spacing: -0.3px;
  }

  .card-description {
    color: var(--ui-gray);
    font-size: 0.9375rem;
    transition: color 0.3s ease;
    line-height: 1.4;
  }
`;

export const buttonStyles = `
  .close-button {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    cursor: pointer;
    color: var(--ui-gray);
    background: var(--ui-gray-light);
    border: none;
    font-size: 1.25rem;
    padding: 0;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    opacity: 0.9;
    transform-origin: center;
  }

  .close-button:hover {
    color: var(--ui-white);
    background: var(--ui-red);
    opacity: 1;
    transform: scale(1.1);
    box-shadow: var(--ui-shadow-sm);
  }

  .close-button:active {
    transform: scale(0.95);
  }
`;
