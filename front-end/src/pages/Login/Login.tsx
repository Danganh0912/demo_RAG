import { useAuthStore } from "@/stores/useAuth";
import { localStorageUtils } from "@/utils/localStorage";
import { Button } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate()
  const { login, user } = useAuthStore()

  console.log('user', user)

  useEffect(() => {
    if (user) {
      localStorageUtils.setItem('USER', user)
      navigate('/chat')
    }
  }, [user])
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const validateForm = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!emailRegex.test(email)) {
      alert("Email phải có định dạng @gmail.com");
      return false;
    }

    if (!password.trim()) {
      alert("Mật khẩu không được để trống!");
      return false;
    }

    return true;
  };

  const handleLogin = async (e:any) => {
    e.preventDefault();

    if (!validateForm()) return;

    console.log("Đăng nhập với:", { email, password });
    const data = {
      email: email,
      password: password
    }
    if(data){
      login(data)
    }
    
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-black">
        <h2 className="text-2xl font-bold text-center mb-6">Đăng nhập</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email (@gmail.com)"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
          />
          <Button
            htmlType="submit"
            type="text"
            className="w-full !bg-black hover:!bg-indigo-600 !text-white !p-5 rounded-lg"
          >
            Đăng nhập
          </Button>
        </form>
        <div className="mt-4 text-center text-sm flex justify-center items-center gap-1">
          Chưa có tài khoản?{" "}
          <Link to="/register">
            <p className="text-black hover:underline">Đăng ký ngay</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
