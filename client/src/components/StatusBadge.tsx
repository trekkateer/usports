import { StyleProp, Text, TextStyle } from "react-native";
import { EventStatus, statusColors } from "../styles/common";

const statusLabels: Record<EventStatus, string> = {
  open: "Open",
  full: "Full",
  cancelled: "Cancelled",
};

type StatusBadgeProps = {
  status: EventStatus;
  style?: StyleProp<TextStyle>;
};

// A small colored pill showing whether a game is open, full, or cancelled
export default function StatusBadge({ status, style }: StatusBadgeProps) {
  return (
    <Text testID="status-badge" style={[
        {
          fontSize: 12,
          fontWeight: 600,
          color: "white",
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
          overflow: "hidden",
          alignSelf: "flex-start",
          backgroundColor: statusColors[status]
        },
        style,
      ]}
    >
      {statusLabels[status]}
    </Text>
  );
}
