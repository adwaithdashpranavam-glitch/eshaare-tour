import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Send, Paperclip, FileText } from "lucide-react";
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
        participants: [user.uid, "support"]
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
    <div className="h-[75vh] flex flex-col bg-white border border-[#E5E7EB] rounded-[24px] overflow-hidden font-sans shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 bg-[#F8F6F2] border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-full bg-[#0F3D2E] text-[#C6A969] border border-[#C6A969]/30 font-bold flex items-center justify-center text-sm shadow-inner">
            SJ
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Sarah Johnson (Visa Advisor)</h3>
            <span className="text-[9px] text-green-600 font-bold flex items-center animate-pulse mt-0.5">
              ● Online Support
            </span>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8F6F2]/40">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] space-y-1 ${isMe ? "text-right" : "text-left"}`}>
                <span className="text-[9px] text-[#6B7280] uppercase tracking-widest font-semibold">{msg.senderName}</span>
                <div 
                  className={`p-3.5 rounded-2xl text-xs font-sans shadow-sm leading-relaxed ${
                    isMe 
                      ? "bg-[#0F3D2E] text-white rounded-tr-none font-medium" 
                      : "bg-white text-[#1A1A1A] rounded-tl-none border border-[#E5E7EB]"
                  }`}
                >
                  {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                  {msg.attachmentUrl && (
                    <a
                      href={msg.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center space-x-1.5 mt-2 p-2 rounded-xl border border-dashed text-[10px] font-mono transition-colors ${
                        isMe ? "border-white/30 text-white hover:text-[#C6A969]" : "border-[#E5E7EB] text-[#0F3D2E] hover:text-[#C6A969]"
                      }`}
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate max-w-[120px]">{msg.attachmentName}</span>
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
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-[#E5E7EB] flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsAttachOpen(true)}
          className={`p-2.5 rounded-xl bg-[#F8F6F2] hover:bg-[#0F3D2E]/5 border border-[#E5E7EB] transition-colors ${
            attachment ? "text-[#C6A969] border-[#C6A969]" : "text-gray-500 hover:text-[#0F3D2E]"
          }`}
          title="Attach travel documents"
        >
          <Paperclip className="h-4.5 w-4.5" />
        </button>
        
        <input
          type="text"
          className="flex-1 px-4 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] placeholder-gray-400 text-xs rounded-xl focus:outline-none focus:border-[#0F3D2E]"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />

        <button
          type="submit"
          className="p-2.5 bg-[#0F3D2E] text-white hover:bg-[#0F3D2E]/90 rounded-xl shadow-sm flex items-center justify-center transition-colors"
        >
          <Send className="h-4 w-4 text-[#C6A969]" />
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
          <p className="text-[10px] text-gray-500 leading-normal font-sans">
            Attach document scans, bank receipt PDFs or visa pictures. Our consultant reviews the attachment in real-time.
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
