import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Web3Provider } from "./context/Web3Context";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { FarmerManagementPage } from "./pages/FarmerManagementPage";
import { ProductRegistrationPage } from "./pages/ProductRegistrationPage";
import { BatchDetailsPage } from "./pages/BatchDetailsPage";
import { SupplyChainManagementPage } from "./pages/SupplyChainManagementPage";
import { ConsumerVerifyPage } from "./pages/ConsumerVerifyPage";
import { ParticipantAccessPage } from "./pages/ParticipantAccessPage";
import { AboutPage } from "./pages/AboutPage";

export const App: React.FC = () => {
  return (
    <Web3Provider>
      <Router>
        <div className="flex flex-col min-h-screen bg-[#070b09] text-stone-100">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/farmers" element={<FarmerManagementPage />} />
              <Route path="/register-batch" element={<ProductRegistrationPage />} />
              <Route path="/batches/:batchId" element={<BatchDetailsPage />} />
              <Route path="/supply-chain" element={<SupplyChainManagementPage />} />
              <Route path="/verify" element={<ConsumerVerifyPage />} />
              <Route path="/verify/:batchId" element={<ConsumerVerifyPage />} />
              <Route path="/access" element={<ParticipantAccessPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </Web3Provider>
  );
};

export default App;
