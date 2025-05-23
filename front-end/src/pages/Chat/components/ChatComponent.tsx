import { BsThreeDots } from "react-icons/bs";
import { AiOutlinePlus, AiOutlineSearch, AiOutlineArrowUp } from "react-icons/ai";
import { Button, Menu,Image, Dropdown } from "antd";
import { useEffect, useRef, useState } from "react";
import "../styles/chat.scss";
import useCallAPI from "@/utils/useCallAPI";
import { URL_API } from "@/utils/urlAPI";
import { useChatStore } from "@/stores/useChatStore";
import { useShallow } from "zustand/shallow";
import { Spin } from 'antd';
import { UserData } from "@/stores/useAuth";
import { localStorageUtils } from "@/utils/localStorage";
import { GEMINI, QWEN } from "@/uikits/images";

type MessageType = {
  id: string;
  conversation_id: string;
  message: string;
  answer: string;
};

interface ChatComponentProps {

}
const ChatComponent: React.FC<ChatComponentProps> = () => {
  const [text, setText] = useState("");
  const textAreaRef = useRef<any>(null);
  const [conversation, setConversation] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [nowText, setNowText] = useState<string>()
  const [selectedModel, setSelectedModel] = useState<'qwen' | 'gemini'>('qwen');

  const { id, setId, fetchData, setFetchData, setHasFetchedMessageHistoryList } = useChatStore(
    useShallow((state) => ({ id: state.id, setId: state.setId, resetId: state.resetId, fetchData: state.fetchData, setFetchData: state.setFetchData, setHasFetchedMessageHistoryList: state.setHasFetchedMessageHistoryList })),
  )
  const [userData, setUserData] = useState<UserData | null>(null)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>()

  useEffect(() => {
    if (id) {
      setCurrentConversationId(id)
    } else if (id === null) {
      setCurrentConversationId(null)
      setConversation([])
    }
  }, [id])

  useEffect(() => {
    (async () => {
      const respose = await localStorageUtils.getItem('USER')
      if (respose) {
        setUserData(respose)
      }
    })()
  }, [])


  useEffect(() => {
    if (fetchData && currentConversationId) {
      setConversation([]);
      (async () => {
        const response = await useCallAPI({
          method: 'GET',
          url: `${URL_API}chat_history/${currentConversationId}`
        });

        if (
          response &&
          response?.status === 1 &&
          Array.isArray(response?.data) &&
          response?.data?.length > 0
        ) {
          console.log('response.data', JSON.stringify(response?.data))
          setConversation(response?.data);
        }
      })();
    }
  }, [fetchData, currentConversationId]);


  const handleSubmit = async () => {
    if (text.trim() !== "" && !loading) {
      setNowText(text)
      if (currentConversationId && userData) {
        setFetchData(false)
        setLoading(true)
        const response = await useCallAPI({
          method: 'POST',
          url: `${URL_API}chat`,
          data: {
            message: text,
            conversation_id: currentConversationId,
            user_id: userData?.user_id,
            model: selectedModel == 'qwen' ? 'qwen:7b' : 'gemini'
          }
        })
        if (response?.status === 1 && response?.data) {
          if (response?.data?.message && response?.data?.answer) {
            setConversation((prev) => [
              ...prev,
              { id: (Date.now()).toString(), conversation_id: response?.data?.conversation_id, message: response?.data?.message, answer: response?.data?.answer }
            ]);
          }
        }
        setLoading(false)
      } else if (!currentConversationId && userData) {
        setFetchData(false)
        setLoading(true)
        const response = await useCallAPI({
          method: 'POST',
          url: `${URL_API}chat`,
          data: {
            message: text,
            user_id: userData?.user_id,
            model: selectedModel == 'qwen' ? 'qwen:7b' : 'gemini'
          }
        })
        if (response.status === 1 && response?.data) {
          if (response?.data?.message && response?.data?.answer) {
            setId(response?.data?.conversation_id)
            setCurrentConversationId(response?.data?.conversation_id)
            setConversation((prev) => [
              ...prev,
              { id: (Date.now()).toString(), conversation_id: response?.data?.conversation_id, message: response?.data?.message, answer: response?.data?.answer }
            ]);
            setHasFetchedMessageHistoryList(false)
          }
        }
        setLoading(false)
      }
      setText("");
      setNowText("")
      if (textAreaRef.current) {
        textAreaRef.current.style.height = "auto";
      }
    }
  };
  const modelData = {
    qwen: {
      label: 'Qwen:7b',
      src: QWEN,
      className: '!text-black-600',
      width: 20,
    },
    gemini: {
      label: 'Gemini',
      src: GEMINI,
      className: '!text-black-600',
      width: 20,
    },
  };
  const handleMenuClick = ({ key }: { key: 'qwen' | 'gemini' }) => {
    setSelectedModel(key);
  };


  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item 
      key="qwen" 
      className="flex gap-2"
      icon={
        <Image
          src={QWEN}
          width={20}
          preview={false}
          style={{ borderRadius: '50%' }}
        />
      }>
        <span className="!text-lg !text-black-700 ">Qwen:7b</span>
      </Menu.Item>
  
      <Menu.Item 
      key="gemini" 
      className="flex gap-2"
      icon={
        <Image
          src={GEMINI}
          width={20}
          preview={false}
        />
      }>
        <span className="!text-lg !text-red-600">Gemini</span>
      </Menu.Item>
    </Menu>
  );

  const handleInput = (e: any) => {
    setText(e.target.value);
    const textarea = textAreaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 500)}px`;
  };
  return (
    <div className="flex flex-col h-[800px] items-center justify-center">
      <div className="w-[70vw] flex flex-col h-full max-h-full items-center justify-center">
        {/* Phần hiển thị đoạn chat */}
        <div
          className={`flex flex-col gap-2 ${conversation?.length > 0 ? 'border overflow-y-auto flex-1' : 'justify-center'
            } border-gray-300 rounded-lg p-3 mb-2 w-full`}
        >
          {conversation?.length > 0 ? (
            <>
              {conversation.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-2 mb-4">
                  {/* Message của user - nằm bên phải */}
                  <div className="self-end max-w-[70%] bg-blue-500 text-white p-3 rounded-2xl text-xl">
                    {msg.message}
                  </div>

                  {/* Answer của hệ thống - nằm bên trái */}
                  <div className="self-start max-w-[70%] bg-gray-300 text-black p-3 rounded-2xl text-xl">
                    {msg.answer}
                  </div>
                </div>
              ))}
              <div>
                {nowText &&
                  <div className="flex flex-col gap-2 mb-4">
                    {/* Message của user - nằm bên phải */}
                    <div className="self-end max-w-[70%] bg-blue-500 text-white p-3 rounded-2xl text-xl">
                      {nowText}
                    </div>

                    {/* Answer của hệ thống - nằm bên trái */}
                    <div className="self-start max-w-[70%]  text-black p-3 rounded-2xl text-xl">
                    </div>
                  </div>
                }
              </div>
              <div>
                {loading &&
                  <div className="flex justify-center items-center h-full">
                    <Spin size="large" />
                  </div>
                }
              </div>
            </>
          ) : (
            <div>
              {loading ?
                <div className="flex justify-center items-center h-full">
                  <Spin size="large" />
                </div>
                :
                <div className="flex flex-col justify-center items-center h-full">
                  <p className="text-3xl text-black font-medium">Tôi có thể giúp gì cho bạn?</p>
                </div>
              }
            </div>
          )}
        </div>

        {/* Phần gõ text */}
        <div className="border border-gray-300 rounded-3xl p-2 w-full">
          <textarea
            ref={textAreaRef}
            value={text}
            onChange={handleInput}
            placeholder="Nhập nội dung..."
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                if (!loading) {
                  e.preventDefault();
                  handleSubmit();
                }
              }
            }}
            className="w-full min-h-[2rem] max-h-[20rem] resize-none p-3 text-lg overflow-auto focus:outline-none focus:ring-0"
          />
          <div className="flex justify-between items-center pl-2 pr-2">
            <div className="flex gap-2.5">
              <Button type="text" className="custom-button">
                <AiOutlinePlus className="text-2xl text-gray-600 hover:text-blue-500 cursor-pointer" />
              </Button>
              <Button type="text" className="custom-button">
                <AiOutlineSearch className="text-2xl text-gray-600 hover:text-blue-500 cursor-pointer" />
              </Button>
              <Button type="text" className="custom-button">
                <BsThreeDots className="text-2xl text-gray-600 hover:text-blue-500 cursor-pointer" />
              </Button>
            </div>
            <div className="flex gap-3">
              <Dropdown overlay={menu} trigger={['click']} className="!border px-5 rounded-full border-gray-300">
                <div className="flex items-center gap-2 cursor-pointer">
                  <Image
                    src={modelData[selectedModel].src}
                    width={modelData[selectedModel].width}
                    preview={false}
                    className="rounded-full"
                  />
                  <span className={`text-base ${modelData[selectedModel].className}`}>
                    {modelData[selectedModel].label}
                  </span>
                </div>
              </Dropdown>
              <Button type="text" className="custom-button" onClick={handleSubmit}>
                <AiOutlineArrowUp className="text-2xl text-gray-600 hover:text-blue-500 cursor-pointer" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ChatComponent