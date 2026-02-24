import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Analyze from "./pages/Analyze";
import Contacts from "./pages/Contacts";
import History from "./pages/History";
import Layout from "./components/Layout";
import "./App.css";
import { Toaster } from "sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="analyze" element={<Analyze />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="history" element={<History />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;