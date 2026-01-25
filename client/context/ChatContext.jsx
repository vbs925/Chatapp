import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";



// eslint-disable-next-line react-refresh/only-export-components
export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([]);
    const [users, setUser] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null)
    const [unseenmessages, setUnseenMessages] = useState({})


    const { socket, axios } = useContext(AuthContext);


    // function to get all the users fro sidebar 

    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUser(data.users)
                setUnseenMessages(data.unseenMessages || {})
            }
        }
        catch (error) {
            toast.error(error.message)
        }
    }


    // function to get messages for selected user

    // eslint-disable-next-line no-unused-vars
    const getMessages = async (userId) => {
        setMessages([]);
        setUnseenMessages((prev) => ({ ...prev, [userId]: 0 }));
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages)
            }
        }

        catch (error) {
            toast.error(error.message)
        }
    }


    // function to send messages to selected user

    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.success) {
                setMessages((prevMessages) => [...prevMessages, data.message])

            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)

        }
    }

    // function to subcribe to messages for selected user 

    const subsribeToMessages = async () => {
        if (!socket) return;

        socket.on("newMessage", (newMessages) => {
            if (selectedUser && newMessages.senderId === selectedUser._id) {
                newMessages.seen = true;
                setMessages((prevMessages) => [...prevMessages, newMessages]);
                axios.put(`/api/messages/mark/${newMessages._id}`);
            } else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages, [newMessages.senderId]:
                        prevUnseenMessages[newMessages.senderId] ? prevUnseenMessages[newMessages.senderId] + 1 : 1
                }))
            }
        })
    }
    // function to unsubcribe from messages 

    const unsubcribeFromMessage = () => {
        if (socket) socket.off("newMessage");
    }
    useEffect(() => {
        subsribeToMessages();
        return () => unsubcribeFromMessage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, selectedUser])



    const value = {
        messages, users, selectedUser,
        getUsers, getMessages, sendMessage,
        setSelectedUser, unseenmessages, setUnseenMessages,

    }
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}
