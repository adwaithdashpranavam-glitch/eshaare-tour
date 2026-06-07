import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../../lib/firestore";
import { Bell, Check, MailOpen, AlertCircle, Calendar, Trash2 } from "lucide-react";
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
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">Notifications</h1>
          <p className="text-xs text-on-primary-container/50">Stay updated with your visa file progression and embassy announcements.</p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="self-start sm:self-center px-4 py-2 border border-[#1A2B47] hover:border-secondary hover:text-secondary text-[#EDE0C4]/80 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <MailOpen className="h-4 w-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-on-primary-container/40">Loading your notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="glass-card p-12 border border-on-primary-fixed-variant/40 text-center text-xs text-on-primary-container/40 italic space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary-container flex items-center justify-center border border-on-primary-fixed-variant/60 text-on-primary-container/40">
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
                className={`glass-card p-5 border transition-all flex items-start gap-4 ${
                  notif.read
                    ? "border-on-primary-fixed-variant/40 bg-white/[0.01] opacity-75"
                    : "border-secondary/25 bg-secondary-container/5 hover:border-secondary/40"
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${
                  notif.read
                    ? "bg-[#111E35] text-on-primary-container/40"
                    : "bg-secondary-container/10 text-secondary"
                }`}>
                  <Bell className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`text-sm font-semibold truncate ${notif.read ? "text-[#EDE0C4]/80" : "text-white"}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-on-primary-container/40 whitespace-nowrap font-mono">
                      {formatShortDate(date)}
                    </span>
                  </div>
                  <p className="text-xs text-on-primary-container/60 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {!notif.read && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="p-1.5 rounded bg-primary-container border border-on-primary-fixed-variant hover:border-secondary text-secondary hover:text-white transition-colors shrink-0"
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
