import { useChatStore } from "@/stores/useChatStore";
import { useShallow } from "zustand/shallow";
import { Drawer, Button, Dropdown, Avatar, Menu } from "antd";
import React, { useEffect, useState } from "react";
import { FiMenu, FiEdit, FiTrash } from "react-icons/fi";
import useCallAPI from "@/utils/useCallAPI";
import { URL_API } from "@/utils/urlAPI";
import "../styles/chat.scss";
import { toast } from "react-toastify";
import { useAuthStore, UserData } from "@/stores/useAuth";
import { localStorageUtils } from "@/utils/localStorage";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

type ConversationHistoryItem = {
  conversation_id: string
  title: string
}

interface ChatLayoutProps {
  children: React.ReactNode
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const { id, setId, resetId, setFetchData, hasFetchedMessageHistoryList, setHasFetchedMessageHistoryList, resetAllChatData } = useChatStore(
    useShallow((state) => ({
      id: state.id,
      setId: state.setId,
      resetId: state.resetId,
      fetchData: state.fetchData,
      setFetchData: state.setFetchData,
      hasFetchedMessageHistoryList: state.hasFetchedMessageHistoryList,
      setHasFetchedMessageHistoryList: state.setHasFetchedMessageHistoryList,
      resetAllChatData: state.resetAllChatData
    })),
  )
  const { logout } = useAuthStore()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [messageHistoryList, setMessageHistoryList] = useState<ConversationHistoryItem[]>([])

  useEffect(() => {
    (async () => {
      console.log('re-render-data-1111111')
      const respose = await localStorageUtils.getItem('USER')
      if (respose) {
        setUserData(respose)
      }
    })()     
  },[])

  useEffect(() => {
    if (!hasFetchedMessageHistoryList && userData) {
      console.log('hasFetchedMessageHistoryList', hasFetchedMessageHistoryList);
      console.log('userData', userData);
      (async () => {
        const response = await useCallAPI({
          method: 'GET',
          url: `${URL_API}get_conversations/${userData?.user_id}`
        })
        if (response.status === 1 && Array.isArray(response?.data) && response?.data?.length > 0) {
          console.log('re-render-data')
          setMessageHistoryList(response?.data)
          console.log('response?.data',response?.data);
          setHasFetchedMessageHistoryList(true)
        }
      })()
    }
  }, [hasFetchedMessageHistoryList, userData])

  const onDeleteConversation = async (id: string) => {
    const response = await useCallAPI({
      method: 'DELETE',
      url: `${URL_API}delete_conversation/${id}`,
    })
    if (response.status === 1) {
      setHasFetchedMessageHistoryList(false)
      toast.success("Tin nhắn đã được xóa thành công!", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  }
  const navigate = useNavigate()
  const handleLogout = () => {
    localStorageUtils.removeItem("USER");
    logout()
    resetAllChatData()
    setUserData(null)
    navigate('/')
  };
  

  const menu = (
    <Menu>
      <Menu.Item
        key="logout"
        icon={<UserOutlined className="!text-2xl !text-black-600" />}
      >
        <span className="!text-lg !text-black-600">{userData?.username || ''}</span>
      </Menu.Item>
      <Menu.Item
        key="logout"
        icon={<LogoutOutlined className="!text-2xl !text-red-600" />}
        onClick={handleLogout}
      >
        <span className="!text-lg !text-red-600">Đăng xuất</span>
      </Menu.Item>
    </Menu>
  );
  

  return (
    <div className="h-screen w-screen flex">
      {/* Drawer */}
      <Drawer
        title={
          <div className="flex justify-between items-center">
            <Button type="text" onClick={() => setOpen(false)}>
              <FiMenu size={24} strokeWidth={1.5} color="black" />
            </Button>
            <Button type="text" onClick={resetId}>
              <FiEdit size={24} strokeWidth={1.5} color="black" />
            </Button>
          </div>
        }
        placement="left"
        closable={false} // Ẩn nút đóng mặc định
        onClose={() => setOpen(false)}
        open={open}
        mask={false}
        width={500} // Độ rộng của Drawer
      >
        {messageHistoryList?.map((item) => (
          <div
            key={item?.conversation_id}
            className="w-full group relative hover:bg-gray-100 rounded-md transition-all"
          >
            <Button
              type="text"
              className="w-full button-drawer"
              onClick={() => {
                if (item?.conversation_id !== id) {
                  setId(item?.conversation_id);
                  setFetchData(true);
                }
              }}
            >
              <p className="text-xl">{item?.title}</p>

              {/* Trash icon */}
              <Button type="text" onClick={() => { onDeleteConversation(item?.conversation_id) }}>
                <FiTrash
                  size={18}
                  className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => {
                    // TODO: handle delete
                    console.log("Delete:", item?.conversation_id);
                  }}
                />
              </Button>
            </Button>
          </div>
        ))}
      </Drawer>

      {/* Nội dung chính của trang */}
      <div
        className={`h-full flex-1 transition-all duration-300 ${open ? "ml-[500px]" : "ml-0"
          }`}>
        {/* Header */}
        <div className="flex w-full justify-between items-center p-4.5 bg-gray-100 shadow-md">
          {open ?
            <div></div> :
            <div>
              <Button type="text" onClick={() => setOpen(true)}>
                <FiMenu size={24} strokeWidth={1.5} color="black" />
              </Button>
              <Button type="text">
                <FiEdit size={24} strokeWidth={1.5} color="black" />
              </Button>
            </div>
          }
          <div className="text-xl font-semibold">
            Chat Bot
            </div>
          <div>
            {/* icon user */}
            <Dropdown overlay={menu} trigger={["click"]}>
              <Avatar size="large" icon={<UserOutlined />} style={{ cursor: "pointer" }} />
            </Dropdown>
          </div>
        </div>

        {/* Nội dung chat */}
        <div className="p-4 flex flex-col justify-center items-center">{children}</div>
      </div>
    </div>
  );
};

export default ChatLayout;
