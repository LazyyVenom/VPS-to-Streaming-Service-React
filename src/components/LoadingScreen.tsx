import { BiCameraMovie } from "react-icons/bi";
import "./LoadingScreen.css";

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="logo-container">
          <BiCameraMovie className="loading-icon" />
          <h1 className="loading-logo">ANUBHAVFLIX</h1>
        </div>
        <div className="loading-bar-container">
          <div className="loading-bar">
            <div className="loading-bar-fill"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
