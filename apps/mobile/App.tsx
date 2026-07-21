import { StatusBar } from "expo-status-bar"
import { StyleSheet, Text, View } from "react-native"

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Life ID</Text>
      <Text style={styles.sub}>تطبيق المريض — MVP</Text>
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 32, fontWeight: "800", color: "#1fb2a3" },
  sub: { marginTop: 8, color: "#64748b" }
})
