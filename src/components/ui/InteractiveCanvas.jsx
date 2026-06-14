import React from "react";

export const InteractiveCanvas = () => {
  return (
    <div className="aurora-wrapper">
      <div className="aurora-container">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
        <div className="aurora-blob aurora-blob-4" />
      </div>
      <style>{`
        .aurora-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
          background: #FCFBF8;
        }

        .aurora-container {
          position: absolute;
          width: 100%;
          height: 100%;
          filter: blur(140px);
          opacity: 0.28;
          transition: opacity 0.5s ease;
        }

        .aurora-blob {
          position: absolute;
          border-radius: 50%;
          mix-blend-mode: multiply;
        }

        .aurora-blob-1 {
          top: -10%;
          left: -10%;
          width: 60vw;
          height: 60vh;
          background: radial-gradient(circle, rgba(29, 80, 58, 0.8) 0%, rgba(29, 80, 58, 0) 70%);
          animation: aurora-float-1 25s infinite alternate ease-in-out;
        }

        .aurora-blob-2 {
          top: 10%;
          right: -10%;
          width: 65vw;
          height: 65vh;
          background: radial-gradient(circle, rgba(212, 175, 55, 0.6) 0%, rgba(212, 175, 55, 0) 70%);
          animation: aurora-float-2 30s infinite alternate ease-in-out;
        }

        .aurora-blob-3 {
          bottom: -10%;
          left: 15%;
          width: 70vw;
          height: 70vh;
          background: radial-gradient(circle, rgba(116, 198, 157, 0.7) 0%, rgba(116, 198, 157, 0) 70%);
          animation: aurora-float-3 28s infinite alternate ease-in-out;
        }

        .aurora-blob-4 {
          top: 30%;
          left: 30%;
          width: 55vw;
          height: 55vh;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0) 70%);
          animation: aurora-float-4 22s infinite alternate ease-in-out;
        }

        @keyframes aurora-float-1 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          50% { transform: translate(15vw, -5vh) scale(1.15) rotate(120deg); }
          100% { transform: translate(-5vw, 10vh) scale(0.9) rotate(240deg); }
        }

        @keyframes aurora-float-2 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          50% { transform: translate(-10vw, 15vh) scale(0.85) rotate(-180deg); }
          100% { transform: translate(5vw, -5vh) scale(1.1) rotate(-360deg); }
        }

        @keyframes aurora-float-3 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          50% { transform: translate(8vw, -12vh) scale(1.2) rotate(90deg); }
          100% { transform: translate(-12vw, 5vh) scale(0.8) rotate(180deg); }
        }

        @keyframes aurora-float-4 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          50% { transform: translate(-15vw, -10vh) scale(0.9) rotate(-90deg); }
          100% { transform: translate(10vw, 10vh) scale(1.15) rotate(-180deg); }
        }
      `}</style>
    </div>
  );
};

export default InteractiveCanvas;