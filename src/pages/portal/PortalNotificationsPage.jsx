import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../../lib/firestore";
import { Bell, Check, MailOpen } from "lucide-react";
import { formatShortDate } from "../../utils/formatters";
import toast from "react-hot-toast";

export const PortalNotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = getNotifications(user.uid, (data) => {
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      toast.success("Notification marked as read");
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) {
      toast("All notifications are already read");
      return;
    }
    try {
      await markAllNotificationsRead(user.uid);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] tracking-wide">Notifications</h1>
          <p className="text-xs text-gray-500">Stay updated with your visa file progression and embassy announcements.</p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="self-start sm:self-center px-4 py-2.5 bg-white border border-[#E7E1D6] hover:border-[#C8A45D] hover:text-[#C8A45D] text-gray-700 font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <MailOpen className="h-4 w-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-gray-400">Loading your notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-[#E7E1D6] rounded-[20px] p-12 text-center text-xs text-gray-400 italic space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#F7F5F1] flex items-center justify-center border border-[#E7E1D6] text-gray-400">
            <Bell className="w-5 h-5" />
          </div>
          <p>You have no notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => {
            const date = notif.createdAt?.toDate ? notif.createdAt.toDate() : new Date(notif.createdAt);
            return (
              <div
                key={notif.id}
                className={`p-5 rounded-[20px] border transition-all flex items-start gap-4 ${
                  notif.read
                    ? "border-[#E7E1D6] bg-white opacity-75 shadow-sm"
                    : "border-[#C8A45D]/40 bg-[#C8A45D]/5 hover:border-[#C8A45D]/60 shadow-md"
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${
                  notif.read
                    ? "bg-[#F7F5F1] text-gray-400 border border-[#E7E1D6]"
                    : "bg-[#C8A45D]/10 text-[#C8A45D] border border-[#C8A45D]/20"
                }`}>
                  <Bell className="h-5 w-5" />
                </div>
                
                <div className="flex-grow min-w-0 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`text-xs font-semibold ${notif.read ? "text-gray-400" : "text-[#1A1A1A]"}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-mono shrink-0">
                      {formatShortDate(date)}
                    </span>
                  </div>
                  
                  <p className={`text-xs leading-relaxed ${notif.read ? "text-gray-400" : "text-gray-600 font-normal"}`}>
                    {notif.message}
                  </p>

                  {!notif.read && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="mt-2.5 text-[9px] font-semibold text-[#C8A45D] hover:text-[#b08e4f] uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                    >
                      <Check className="h-3 w-3" />
                      <span>Mark as read</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default PortalNotificationsPage;
