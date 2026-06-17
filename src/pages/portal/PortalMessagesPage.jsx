import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Send, Paperclip, FileText, Sparkles } from "lucide-react";
import FileUpload from "../../components/ui/FileUpload";
import Modal from "../../components/ui/Modal";
import { formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";

export const PortalMessagesPage = () => {
  const { user, userProfile } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Fetch messages where user is a participant
    const msgRef = collection(db, "chats");
    const q = query(msgRef, where("participants", "array-contains", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Sort client-side by createdAt to avoid requiring a Firestore composite index
        const sorted = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const timeA = a.createdAt?.seconds 
              ? a.createdAt.seconds * 1000 
              : a.createdAt?.toDate 
                ? a.createdAt.toDate().getTime() 
                : new Date(a.createdAt || 0).getTime();
            const timeB = b.createdAt?.seconds 
              ? b.createdAt.seconds * 1000 
              : b.createdAt?.toDate 
                ? b.createdAt.toDate().getTime() 
                : new Date(b.createdAt || 0).getTime();
            return timeA - timeB;
          });
        setMessages(sorted);
      } else {
        setMessages([]);
      }
      // Scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, (error) => {
      console.warn("Error fetching message records:", error);
      setMessages([]);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachment) return;

    try {
      const msgRef = collection(db, "chats");
      await addDoc(msgRef, {
        senderId: user.uid,
        senderName: userProfile?.name || "Client",
        text: newMessage.trim(),
        attachmentUrl: attachment?.url || null,
        attachmentName: attachment?.name || null,
        createdAt: new Date(),
        participants: [user.uid, "support"],
        read: false
      });
      setNewMessage("");
      setAttachment(null);
    } catch (err) {
      console.error(err);
      toast.error("Error sending message");
    }
  };

  const handleAttachmentSuccess = (fileInfo) => {
    setAttachment(fileInfo);
    setIsAttachOpen(false);
    toast.success(`Attached file: ${fileInfo.name}`);
  };

  return (
    <div className="h-[75vh] flex flex-col bg-white border border-[#E7E1D6] rounded-[20px] shadow-sm overflow-hidden font-sans">
      {/* Header */}
      <div className="px-6 py-4 bg-[#F7F5F1] border-b border-[#E7E1D6] flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-full bg-[#E7E1D6] border border-[#C8A45D]/30 text-[#1A1A1A] flex items-center justify-center font-bold">
            R
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider font-display">Rana G. (Visa Consultant)</h3>
            <span className="text-[9px] text-[#C8A45D] font-extrabold flex items-center gap-1 uppercase tracking-widest">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>Dedicated Advisor</span>
            </span>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F7F5F1]/30">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] space-y-1 ${isMe ? "text-right" : "text-left"}`}>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{msg.senderName}</span>
                <div 
                  className={`p-4 rounded-xl text-xs leading-relaxed ${
                    isMe 
                      ? "bg-[#C8A45D] text-white rounded-tr-none shadow-sm" 
                      : "bg-white text-[#1A1A1A] rounded-tl-none border border-[#E7E1D6] shadow-sm"
                  }`}
                >
                  {msg.text && <p className="whitespace-pre-wrap font-medium">{msg.text}</p>}
                  {msg.attachmentUrl && (
                    <a
                      href={msg.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center space-x-1.5 mt-2.5 p-2 rounded-lg border border-dashed text-[10px] font-mono transition-colors ${
                        isMe 
                          ? "border-white/40 text-white hover:bg-white/10" 
                          : "border-[#E7E1D6] text-[#C8A45D] hover:bg-[#F7F5F1]"
                      }`}
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate max-w-[150px]">{msg.attachmentName}</span>
                    </a>
                  )}
                </div>
                <span className="text-[9px] text-gray-400 block mt-1 font-mono">{formatDate(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose bar */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-[#E7E1D6] flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsAttachOpen(true)}
          className={`p-2.5 rounded-lg border transition-all ${
            attachment 
              ? "text-[#C8A45D] border-[#C8A45D] bg-[#C8A45D]/10" 
              : "text-gray-400 border-[#E7E1D6] bg-[#F7F5F1] hover:border-[#C8A45D] hover:text-[#C8A45D]"
          }`}
          title="Attach PDF or scan copy"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        
        <input
          type="text"
          className="flex-1 px-4 py-2.5 bg-[#F7F5F1] border border-[#E7E1D6] text-[#1A1A1A] placeholder-gray-400 text-xs rounded-lg focus:outline-none focus:border-[#C8A45D] transition-colors"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />

        <button
          type="submit"
          className="p-2.5 bg-[#C8A45D] hover:bg-[#b08e4f] text-white rounded-lg shadow-sm flex items-center justify-center transition-all"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {/* Attachment upload modal */}
      <Modal
        isOpen={isAttachOpen}
        onClose={() => setIsAttachOpen(false)}
        title="Attach Travel Documents"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Attach document scans, bank receipt PDFs or visa pictures. Our travel concierge will receive the files in real-time.
          </p>
          <FileUpload
            collectionName="chats"
            documentId={user.uid}
            docType="chat_docs"
            onUploadSuccess={handleAttachmentSuccess}
          />
        </div>
      </Modal>

    </div>
  );
};

export default PortalMessagesPage;
