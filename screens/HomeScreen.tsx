import { View, Text, Button } from "react-native";
import { createTable, insert, select } from "../helpers/sqlite";

const HomeScreen = ({ navigation }: { navigation: any }) => {
  return (
    <View>
      <Text>ホーム画面</Text>
      <Button title="詳細" onPress={() => navigation.navigate("Details")} />
    </View>
  );
};

export default HomeScreen;
