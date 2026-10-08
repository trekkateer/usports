import { Stack } from "expo-router";
import { EventProvider } from "../context/EventContext";
import { ProfileProvider } from "../context/ProfileContext";

export default function RootLayout() {
  return (
    <ProfileProvider>
      <EventProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="event/[id]"
            options={{
              title: "Game Details",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="host"
            options={{
              title: "Host a Game",
              presentation: "modal",
            }}
          />
        </Stack>
      </EventProvider>
    </ProfileProvider>
  );
}
