import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Pools from "./pages/Pools";

const App: React.FC = () => (
  <div className="app">
    <Navbar />
    <main>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pools" element={<Pools />} />
      </Routes>
    </main>
  </div>
);

export default App;
