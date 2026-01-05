import { useState } from "react";
import WhoIsWatching from "./components/WhoIsWatching";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  const handleUserSelected = () => {
    setShowDashboard(true);
  };

  return (
    <div className="app">
      {!showDashboard ? (
        <WhoIsWatching onUserSelect={handleUserSelected} />
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

export default App;
