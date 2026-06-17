import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../../lib/firestore";
import { Bell, Check, MailOpen } from "lucide-react";
import { formatShortDate } from "../../utils/formatters";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

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
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Notifications</h1>
          <p className="text-xs text-[#6B7280]">Stay updated with your visa file progression and embassy announcements.</p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="self-start sm:self-center px-4 py-2 bg-[#F8F6F2] border border-[#E5E7EB] hover:border-[#0F3D2E] hover:text-[#0F3D2E] text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <MailOpen className="h-4 w-4 text-[#C6A969]" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-gray-400">Loading your notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] p-12 rounded-[24px] text-center text-xs text-gray-400 italic space-y-3 shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#F8F6F2] flex items-center justify-center border border-[#E5E7EB] text-[#C6A969]">
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
                className={`bg-white border transition-all flex items-start gap-4 p-5 rounded-[20px] shadow-sm hover:shadow-md ${
                  notif.read
                    ? "border-[#E5E7EB] opacity-65"
                    : "border-[#0F3D2E]/25 bg-[#F8F6F2]/30 hover:border-[#0F3D2E]/40"
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  notif.read
                    ? "bg-gray-100 text-gray-400"
                    : "bg-[#0F3D2E]/5 text-[#0F3D2E] border border-[#0F3D2E]/10"
                }`}>
                  <Bell className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`text-sm font-semibold truncate ${notif.read ? "text-gray-500 font-medium" : "text-[#1A1A1A] font-bold"}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap font-mono">
                      {formatShortDate(date)}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${notif.read ? "text-gray-400" : "text-gray-600"}`}>
                    {notif.message}
                  </p>
                </div>

                {!notif.read && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="p-1.5 rounded-xl bg-[#F8F6F2] border border-[#E5E7EB] hover:border-[#0F3D2E] text-gray-500 hover:text-[#0F3D2E] transition-colors shrink-0"
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default PortalNotificationsPage;
