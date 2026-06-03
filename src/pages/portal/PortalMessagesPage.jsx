import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot, addDoc, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { MessageSquare, Send, Paperclip, FileText, ChevronLeft, User } from "lucide-react";
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
  const [activeThread, setActiveThread] = useState(true); // Single active chat MVP
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Fetch messages sorted by timestamp
    const msgRef = collection(db, "chats");
    const q = query(msgRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      // Scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, (error) => {
      console.warn("Using mock message records fallback:", error);
      setMessages([
        { id: "1", senderId: "advisor", senderName: "Rana G. (Advisor)", text: "Hi Sarah, I reviewed your bank statements. They look good, but we need the stamp on the last page.", createdAt: new Date(Date.now() - 3600000) },
        { id: "2", senderId: user.uid, senderName: "Sarah Connor", text: "Sure, I am uploading the stamped version now.", createdAt: new Date(Date.now() - 1800000) }
      ]);
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
        createdAt: new Date()
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
    <div className="h-[75vh] flex flex-col glass-card border border-on-primary-fixed-variant/60 overflow-hidden font-sans">
      {/* Header */}
      <div className="px-6 py-4 bg-primary-container border-b border-on-primary-fixed-variant/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-full bg-secondary-container/10 border border-secondary/20 text-secondary flex items-center justify-center font-bold">
            R
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Rana G. (Visa Consultant)</h3>
            <span className="text-[9px] text-success font-bold flex items-center animate-pulse">
              ● Online Support
            </span>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-primary-container/20">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] space-y-1 ${isMe ? "text-right" : "text-left"}`}>
                <span className="text-[9px] text-on-primary-container/40 uppercase tracking-widest">{msg.senderName}</span>
                <div 
                  className={`p-3.5 rounded-card text-xs font-sans shadow-md leading-relaxed ${
                    isMe 
                      ? "bg-secondary-container text-on-primary-fixed rounded-tr-none font-semibold" 
                      : "bg-primary-container text-white rounded-tl-none border border-outline-variant/10"
                  }`}
                >
                  {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                  {msg.attachmentUrl && (
                    <a
                      href={msg.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center space-x-1.5 mt-2 p-1.5 rounded bg-white/5 border border-dashed text-[10px] font-mono ${
                        isMe ? "border-primary-container/20 text-on-primary-fixed" : "border-on-primary-fixed-variant text-secondary"
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="truncate max-w-[120px]">{msg.attachmentName}</span>
                    </a>
                  )}
                </div>
                <span className="text-[9px] text-on-primary-container/30 block mt-1 font-mono">{formatDate(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose bar */}
      <form onSubmit={handleSendMessage} className="p-4 bg-primary-container border-t border-on-primary-fixed-variant/80 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsAttachOpen(true)}
          className={`p-2 rounded-lg bg-primary-container border border-on-primary-fixed-variant hover:border-secondary/40 transition-colors ${
            attachment ? "text-secondary border-secondary" : "text-on-primary-container/50 hover:text-white"
          }`}
          title="Attach PDF or scan copy"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        
        <input
          type="text"
          className="flex-1 px-4 py-2.5 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/30 text-xs rounded-button focus:outline-none focus:border-secondary"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />

        <button
          type="submit"
          className="p-2.5 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed rounded-button shadow-sm flex items-center justify-center"
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
          <p className="text-[10px] text-on-primary-container/60 leading-normal font-sans">
            Attach document scans, bank receipt PDFs or visa pictures. Our consultant reviews the attachment in real-time.
          </p>
          <FileUpload
            collectionName="chats"
            documentId="attachments"
            docType="chat_docs"
            onUploadSuccess={handleAttachmentSuccess}
          />
        </div>
      </Modal>

    </div>
  );
};

export default PortalMessagesPage;
