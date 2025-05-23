import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Chat from "@/pages/Chat";
import useScrollbarWidth from "@/hooks/useScrollBarWidth";
import Login from "@/pages/Login/Login";
import Register from "@/pages/Register/Register";

const AppRoutes = () => {
  const width = useScrollbarWidth()
  return (
    <Router>
      <div className="h-screen" style={{width: width}}>
        <Routes>
          <Route path="/" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </div>
    </Router>
  );
};

export default AppRoutes;
