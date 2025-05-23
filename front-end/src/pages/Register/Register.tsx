import { useAuthStore } from "@/stores/useAuth";
import { localStorageUtils } from "@/utils/localStorage";
import { Button } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate()
  const { register, user } = useAuthStore()

  console.log('user', user)

  useEffect(() => {
    if (user) {
      localStorageUtils.setItem('USER', user)
      navigate('/chat')
    }
  }, [user])
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e : any) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const validateForm = () => {
    const { email, username, password, confirmPassword } = formData;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      alert("Email phải có định dạng @gmail.com");
      return false;
    }

    if (!username.trim()) {
      alert("Tên người dùng không được để trống!");
      return false;
    }

    if (!password.trim()) {
      alert("Mật khẩu không được để trống!");
      return false;
    }

    if (password !== confirmPassword) {
      alert("Mật khẩu và xác nhận mật khẩu không khớp!");
      return false;
    }

    return true;
  };

  const handleRegister = (e : any) => {
    e.preventDefault();

    if (!validateForm()) return;

    const data = {
      email: formData.email,
      username: formData.username,
      password: formData.password,
    };

    if(data){
      register(data)
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Đăng ký</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email (@gmail.com)"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="text"
            name="username"
            placeholder="Tên người dùng"
            required
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="password"
            name="password"
            placeholder="Mật khẩu"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Nhập lại mật khẩu"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400"
          />
          <Button
            htmlType="submit"
            type="text"
            className="w-full !bg-black hover:!bg-indigo-600 !text-white !p-5 rounded-lg"
          >
            Đăng ký
          </Button>
        </form>

        <div className="mt-4 text-center text-sm flex justify-center items-center gap-1">
          Đã có tài khoản?{" "}
          <Link to="/">
            <p className="text-black hover:underline">Đăng nhập</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
