import axios, { AxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const defaultHeaderApplicationJson = { 'Content-Type': 'application/json' };
const defaultHeadersFormData = { 'Content-Type': 'multipart/form-data' };

type TypeHeaders = 'application/json' | 'multipart/form-data';
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

type UseCallAPIProps = {
  method: Method,
  url: string,
  showToast?: boolean,
  token?: any,
  data?: any,
  typeHeaders?: TypeHeaders,
  config?: AxiosRequestConfig
};

// Hàm gọi API chung
const useCallAPI = async ({
  method,
  url,
  token,
  data,
  typeHeaders = 'application/json',
  config,
  showToast = false
}: UseCallAPIProps): Promise<any> => {
  let defaultHeaders = typeHeaders === 'application/json' ? defaultHeaderApplicationJson : defaultHeadersFormData;
  
  try {
    const response = await axios({
      method,
      url,
      headers: {
        ...defaultHeaders,
        ...config?.headers,
        Authorization: token ? `Bearer ${token}` : undefined
      },
      data,
      ...config
    });

    if (response?.data) {
      if (showToast) toast.success('Thành công!');
      return response.data;
    } else {
      if (showToast) toast.warning('Không có phản hồi từ máy chủ');
    }
  } catch (error: any) {
    console.log(`Error with ${method} request to ${url}:`, error);
    if (showToast) {
      console.log('errorrrrrrrrrrrrr', error)
      const errorMessage = error?.response?.data?.detail || error.message || 'Đã xảy ra lỗi';
      toast.error(`Lỗi: ${errorMessage}`);
    }
  }
};

export default useCallAPI;
