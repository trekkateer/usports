import { Picker } from "@react-native-picker/picker";
import { useEffect, useState, useRef } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { router } from "expo-router";
import { useEvents } from "../context/EventContext";
import {
  SKILL_LEVELS,
  SkillLevel,
  useProfile,
} from "../context/ProfileContext";
import { colors, commonStyles } from "../styles/common";
import { Platform } from "react-native";

// Selectable options for the form's dropdowns and buttons
const SPORTS = [
  "Basketball",
  "Soccer",
  "Volleyball",
  "Tennis",
  "Football",
  "Frisbee",
  "Rock Climbing",
  "Spikeball"
];

const VENUES = [
  "Spoelhof Fieldhouse",
  "Gainey Athletic Complex",
  "Van Noord Arena"
];

// Hours 1-12, quarter-hour slots, and player counts 2-30
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ["00", "15", "30", "45"];
const MERIDIEMS = ["AM", "PM"];
const PLAYER_COUNTS = Array.from({ length: 29 }, (_, i) => i + 2);

// Local calendar date as YYYY-MM-DD. Not toISOString(), which shifts to UTC
// and can land on the wrong day.
const toDateString = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// 12-hour clock to 24-hour. Midnight and noon are the awkward cases: 12 AM is
// hour 0, while 12 PM stays 12.
const to24Hour = (hour: number, meridiem: string) => {
  if (meridiem === "AM") return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
};

export default function CreateScreen() {
  // createEvent adds the game; profile supplies the host, so it's never typed in
  const { createEvent } = useEvents();
  const { profile } = useProfile();

  // Gets todays date
  const today = toDateString(new Date());

  // One piece of state per field
  const [sport, setSport] = useState(SPORTS[0]);
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(MINUTES[0]);
  const [meridiem, setMeridiem] = useState("PM");
  const [minPlayers, setMinPlayers] = useState(10);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("Intermediate");

  // Venue selection logic
  const [venueQuery, setVenueQuery] = useState('');
  const [venueQResults, setVenueQResults] = useState(['']);
  const ctrl = useRef<AbortController | null>(null);

  // Changes the suggested venues every time a new char is typed
  useEffect(() => {
    // No suggestions once a venue is chosen, or if less than two chars have been typed
    if (venue === venueQuery || venueQuery.trim().length < 2) {
      setVenueQResults([]);
      return;
    }

    // Gets the venue results
    setVenueQResults(VENUES.filter((i) => i.startsWith(venueQuery)));
  }, [venueQuery, venue]);

  // Any edit to the text un-chooses the venue so the user can search again
  const handleVenueChange = (text: string) => {
    setVenue('');
    setVenueQuery(text);
  };

  // Clears the chosen venue and the search text
  const resetVenue = () => {
    setVenue('');
    setVenueQuery('');
  };

  // Combine the separate date and time selections into the single ISO string
  const handleSubmit = () => {
    const [year, month, day] = date.split("-").map(Number);
    const dateTime = new Date(year, month - 1, day, to24Hour(hour, meridiem), Number(minute), 0, 0);

    createEvent({
      sport,
      venue,
      description,
      dateTime: dateTime.toISOString(),
      minPlayers,
      skillLevel,
      host: profile.displayName,
    });

    // Close the popup and return to whichever tab opened it
    if (router.canGoBack()) router.back();
  };

  return (
    <ScrollView
      style={[commonStyles.container, {paddingTop: 16}]}
      contentContainerStyle={styles.content}
      // Let taps reach buttons (e.g. venue suggestions) while the keyboard is open
      keyboardShouldPersistTaps="handled"
    >
      {/* Sport as a grid of toggle buttons, venue as a dropdown, and description as a plain old textbox */}
      <View style={[commonStyles.card, styles.card]}>
        <Text style={styles.label}>Sport</Text>
        <ScrollView horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.buttonContainer}
        >
          {SPORTS.map((option) => (
            <Pressable
              key={option}
              onPress={() => setSport(option)}
              style={[
                styles.Button,
                option === sport && styles.ButtonSelected
              ]}
            >
              <Text
                style={[
                  styles.ButtonText,
                  option === sport && styles.ButtonTextSelected
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>Venue</Text>
        <View style={styles.textInputWrapper}>
          <View style={styles.textInputRow}>
            {/* selectTextOnFocus highlights a chosen venue so typing replaces it */}
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              value={venueQuery}
              onChangeText={handleVenueChange}
              selectTextOnFocus
              placeholder="Start typing..."
            />
            {venueQuery !== '' && (
              <Pressable onPress={resetVenue} style={styles.clearButton} accessibilityLabel="Clear venue">
                <Text style={styles.clearButtonText}>✕</Text>
              </Pressable>
            )}
          </View>
          {venueQResults.map((option) => (
            <Pressable
              key={option}
              // Sets the venue and fills the textbox with it
              onPress={() => {
                setVenue(option);
                setVenueQuery(option);
                setVenueQResults([]);
                Keyboard.dismiss();
              }}
              style={[styles.Button, option === venue && styles.ButtonSelected]}
            >
              <Text
                style={[
                  styles.ButtonText,
                  option === venue && styles.ButtonTextSelected
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Input a description of the event */}
        <Text style={styles.label}>Description</Text>
        <View style={styles.textInputWrapper}>
          <TextInput multiline maxLength={500}
              style={[styles.textInput, { textAlignVertical: "top", height: 120}]}
              value={description}
              onChangeText={setDescription}
              placeholder="Start typing..."
            />
        </View>
      </View>

      {/* When the game happens: calendar for the day, three pickers for the time */}
      <View style={[commonStyles.card, styles.card]}>
        <Text style={styles.label}>Date</Text>
        {/* minDate blocks scheduling games in the past */}
        <Calendar
          minDate={today}
          onDayPress={(day: { dateString: string }) => setDate(day.dateString)}
          markedDates={{
            [date]: { selected: true, selectedColor: colors.primary },
          }}
        />

        <Text style={styles.label}>Time</Text>
        <View style={styles.timeRow}>
          <View style={[styles.wheelPickerWrapper, styles.timePicker]}>
            <Picker selectedValue={hour} onValueChange={setHour} itemStyle={styles.wheelPicker}>
              {HOURS.map((option) => (
                <Picker.Item
                  key={option}
                  label={String(option)}
                  value={option}
                />
              ))}
            </Picker>
          </View>
          <View style={[styles.wheelPickerWrapper, styles.timePicker]}>
            <Picker selectedValue={minute} onValueChange={setMinute} itemStyle={styles.wheelPicker}>
              {MINUTES.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>
          <View style={[styles.wheelPickerWrapper, styles.timePicker]}>
            <Picker selectedValue={meridiem} onValueChange={setMeridiem} itemStyle={styles.wheelPicker}>
              {MERIDIEMS.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* Headcount threshold and the skill tier the game is aimed at */}
      <View style={[commonStyles.card, styles.card]}>
        <Text style={styles.label}>Minimum Players</Text>
        <View style={styles.textInputWrapper}>
          <TextInput keyboardType="number-pad"
            value={minPlayers.toString()}
            style={styles.textInput}
            onChangeText={(text) => setMinPlayers(+text.replace(/[^0-9]/g, ''))}
          />
        </View>
        {/*<View style={styles.wheelPickerWrapper}>
          <Picker selectedValue={minPlayers} onValueChange={setMinPlayers} itemStyle={styles.wheelPicker}>
            {PLAYER_COUNTS.map((option) => (
              <Picker.Item key={option} label={String(option)} value={option} />
            ))}
          </Picker>
        </View>*/}

        <Text style={styles.label}>Skill Level</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.buttonContainer}
        >
          {SKILL_LEVELS.map((option) => (
            <Pressable
              key={option}
              onPress={() => setSkillLevel(option)}
              style={[
                styles.Button,
                skillLevel === option && styles.ButtonSelected
              ]}
            >
              <Text
                style={[
                  styles.ButtonText,
                  skillLevel === option && styles.ButtonTextSelected
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Submits the form; the host is auto-joined by createEvent */}
      <Pressable
        style={[commonStyles.button, styles.submitButton]}
        onPress={handleSubmit}
      >
        <Text style={commonStyles.buttonText}>Create Game</Text>
      </Pressable>
    </ScrollView>
  );
}

// Layout only; colors and card/button styling come from commonStyles
const styles = StyleSheet.create({
  content: { paddingBottom: 40, gap: 16 },
  card: { marginHorizontal: 16, gap: 12 },
  label: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },

  // Textbox selectors
  textInputWrapper: {
    borderWidth: 1,
    borderRadius: 8,
  },
  textInput: {
    padding: 12,
    fontSize: 18,
    color: colors.textPrimary,
  },
  textInputRow: { flexDirection: "row", alignItems: "center" },
  clearButton: { paddingHorizontal: 12, paddingVertical: 8 },
  clearButtonText: { fontSize: 16, color: colors.textSecondary },

  // Wheel selectors
  wheelPickerWrapper: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    overflow: "hidden",
    ...Platform.select({
      ios: { height: 120 },
      default: {},       // web/Android stay compact — they render a real dropdown
    }),
  },
  wheelPicker: {
    fontSize: 16,
    color: colors.textPrimary,
    ...Platform.select({
      ios: { height: 120 },
      default: {},       // web/Android stay compact — they render a real dropdown
    }),
  },
  timeRow: { flexDirection: "row", gap: 8, height: 120},
  timePicker: { flex: 1, height: 120},
  submitButton: { marginHorizontal: 16 },

  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  scrollViewContainer: {
    width: '100%'
  },
  Button: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#E5E5E1',
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  ButtonSelected: {
    backgroundColor:colors.primary,
    borderColor: colors.primary,
  },
  ButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3D3D3A',
  },
  ButtonTextSelected: {
    color: "white",
  },
});
