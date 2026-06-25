import React from "react";
import { TrendingUp } from "lucide-react";

export const KPICard = ({ title, value, Icon, trend, color = "gold" }) => {
  const IconComponent = Icon || TrendingUp;

  const colorStyles = {
    gold: "text-secondary border-secondary/20",
    blue: "text-info border-info/20",
    green: "text-success border-success/20",
    orange: "text-warning border-warning/20",
    red: "text-danger border-danger/20"
  };

  const selectedColorClass = colorStyles[color] || colorStyles.gold;

  return (
    <div className="glass-card gold-hover p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-on-primary-container/60 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg bg-white/5 border ${selectedColorClass}`}>
          <IconComponent className="h-5 w-5" />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-display font-bold text-white tracking-tight">{value}</h3>
        {trend && (
          <div className="flex items-center mt-2 text-xs">
            <span className={`font-semibold ${trend.isPositive ? "text-success" : "text-danger"}`}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
            <span className="text-on-primary-container/40 ml-1.5">{trend.label || "since last month"}</span>
          </div>
        )}
      </div>
      {/* Decorative luxury gradient background glow */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-secondary-container/5 blur-2xl rounded-full pointer-events-none"></div>
    </div>
  );
};

export default KPICard;
