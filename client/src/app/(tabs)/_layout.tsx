import { router } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { colors } from "../../styles/common";
import { background } from "@expo/ui/swift-ui/modifiers";

export default function TabsLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown" tintColor="black">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Find Games</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "sportscourt", selected: "sportscourt.fill" }}
          md="sports_basketball"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md="person"
        />
      </NativeTabs.Trigger>

      {/* Plus icon with open /host as a popup, rather than having its own page */}
      <NativeTabs.Trigger name="add" role="search" disabled
        listeners={{ tabPress: () => router.push("/host") }}
      >
        <NativeTabs.Trigger.Icon
          sf={{ default: "plus", selected: "plus" }}
          md="add_circle"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
