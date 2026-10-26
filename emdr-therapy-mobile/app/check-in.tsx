import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { BilateralMark, Card, DS, PrimaryButton } from "@/components/ui/design-system";

const bodyChoices = ["Tense", "Warm", "Tired", "Steady", "Not sure"];
const feelingChoices = ["Calm", "Worried", "Sad", "Irritated", "Okay", "No word fits"];
const outsideChoices = ["I notice a color", "I hear a sound", "I feel supported by a surface"];

export default function CheckInScreen() {
  const [focus, setFocus] = useState<"outside" | "body">("outside");
  const [selected, setSelected] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const toggle = (value: string) => {
    setFinished(false);
    setSelected((items) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value].slice(0, 4));
  };
  const reset = () => { setSelected([]); setFinished(false); };
  const options = focus === "outside" ? outsideChoices : [...bodyChoices, ...feelingChoices];

  return (
    <ScreenContainer containerClassName="bg-[#F4F7F5]" className="px-5 pt-4">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>OPTIONAL CHECK-IN</Text><Text style={styles.title}>What do you notice, if anything?</Text></View>
          <BilateralMark size={40} />
        </View>
        <Text style={styles.copy}>There is no right answer. This is not a clinical assessment. You can skip, choose nothing, or stop at any time.</Text>
        <View style={styles.switchRow} accessibilityRole="radiogroup" accessibilityLabel="Choose where to focus">
          <Choice label="Around me" selected={focus === "outside"} onPress={() => { setFocus("outside"); setSelected([]); setFinished(false); }} />
          <Choice label="Body and feelings" selected={focus === "body"} onPress={() => { setFocus("body"); setSelected([]); setFinished(false); }} />
        </View>
        <Card>
          <Text style={styles.prompt}>{focus === "outside" ? "You might notice a color, sound, or point of support." : "If comfortable, choose words that fit your experience right now."}</Text>
          <View style={styles.choices}>
            {options.map((item) => <Choice key={item} label={item} selected={selected.includes(item)} onPress={() => toggle(item)} checkbox />)}
          </View>
        </Card>
        {finished ? (
          <Card tint={DS.mint}>
            <Text style={styles.prompt}>Your words, just as you chose them:</Text>
            <Text style={styles.summary}>{selected.length ? selected.join(" · ") : "Nothing selected"}</Text>
            <Text style={styles.copy}>No meaning or diagnosis has been inferred. This check-in was not saved.</Text>
          </Card>
        ) : null}
        <PrimaryButton onPress={() => setFinished(true)}>Done with check-in</PrimaryButton>
        <Pressable accessibilityRole="button" onPress={reset} style={styles.secondary}><Text style={styles.secondaryText}>Clear selections</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.secondary}><Text style={styles.secondaryText}>Leave without saving</Text></Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function Choice({ label, selected, onPress, checkbox = false }: { label: string; selected: boolean; onPress: () => void; checkbox?: boolean }) {
  return (
    <Pressable accessibilityRole={checkbox ? "checkbox" : "radio"} accessibilityState={checkbox ? { checked: selected } : { selected }} onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40, gap: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  eyebrow: { color: DS.deep, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginTop: 4 },
  title: { color: DS.ink, fontSize: 28, lineHeight: 34, fontWeight: "700", marginTop: 6, maxWidth: 280 },
  copy: { color: DS.muted, fontSize: 13, lineHeight: 19 },
  prompt: { color: DS.ink, fontSize: 15, lineHeight: 22, fontWeight: "700" },
  switchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  choice: { minHeight: 44, paddingHorizontal: 13, paddingVertical: 10, borderWidth: 1, borderColor: DS.line, borderRadius: 14, backgroundColor: "#FFFFFF", justifyContent: "center" },
  choiceSelected: { borderColor: DS.deep, backgroundColor: DS.lavender },
  choiceText: { color: DS.ink, fontSize: 13, fontWeight: "600" },
  choiceTextSelected: { color: DS.deep },
  summary: { color: DS.deep, fontSize: 14, lineHeight: 21, fontWeight: "700", marginTop: 8, marginBottom: 8 },
  secondary: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: DS.deep, fontWeight: "700", fontSize: 13 },
});
