import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';

type Suit = '♠' | '♥' | '♦' | '♣' | 'JOKER';
type NumberRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
type CardRank = NumberRank | 'JOKER';

type Card = {
  id: string;
  suit: Suit;
  rank: CardRank;
};

type Punishments = {
  [key in NumberRank]: string;
} & {
  joker: string;
};

const defaultPunishments: Punishments = {
  1: '漢気じゃんけん',
  2: '引いた人が誰かを指名して飲ませる',
  3: '引いた人が飲む',
  4: '女子が飲む',
  5: '引いた人の両隣が飲む',
  6: '男子が飲む',
  7: '7が出たら全員で指を立てて、最後まで残った人が飲む（指たて）',
  8: 'バディ（相棒）を1人決めて、その人と運命共同体になる',
  9: '好きなゲームを一つ始める',
  10: '山手線ゲームをする',
  11: '好きなフィールドルール（縛り）を一つ追加する',
  12: 'クエスチョンマスター（質問マスター）になる',
  13: 'ジャックポット（盛り上がる罰ゲームを自由に決める）',
  joker: 'ジョーカー：一気に飲む',
};

const suits: Suit[] = ['♠', '♥', '♦', '♣'];

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const createDeck = (): Card[] => {
  const cards: Card[] = [];

  suits.forEach((suit) => {
    for (let rank = 1; rank <= 13; rank++) {
      cards.push({
        id: `${suit}-${rank}-${Math.random()}`,
        suit,
        rank: rank as NumberRank,
      });
    }
  });

  // ジョーカーを2枚追加（必要に応じて1枚に変更してOK）
  cards.push({
    id: `JOKER-1`,
    suit: 'JOKER',
    rank: 'JOKER',
  });
  cards.push({
    id: `JOKER-2`,
    suit: 'JOKER',
    rank: 'JOKER',
  });

  return shuffleArray(cards);
};

const getPunishmentText = (
  card: Card | null,
  punishments: Punishments,
): string => {
  if (!card) {
    return '中央のカードの山をタップしてゲームを開始！';
  }

  if (card.rank === 'JOKER') {
    return punishments.joker;
  }

  return punishments[card.rank as NumberRank];
};

type Screen = 'game' | 'settings';

export default function App() {
  const [screen, setScreen] = useState<Screen>('game');
  const [deck, setDeck] = useState<Card[]>(() => createDeck());
  const [drawnCards, setDrawnCards] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [kingCount, setKingCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [punishments, setPunishments] =
    useState<Punishments>(defaultPunishments);

  // カードの3Dフリップアニメーション用（裏→表）
  // 0: 裏面が手前 / 1: 表面が手前 になるようにしている
  const flipAnim = useRef(new Animated.Value(0)).current;
  const AnimatedTouchableOpacity =
    Animated.createAnimatedComponent(TouchableOpacity);

  const cardAnimatedStyle = {
    transform: [
      {
        perspective: 1000,
      },
    ],
  };

  // 表面（数字側）の回転：180deg（裏向き）→ 360deg（表向き）
  const frontSideAnimatedStyle = {
    transform: [
      { perspective: 1000 },
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  };

  // 裏面（TAP側）の回転：0deg（表向き）→ 180deg（裏向き）
  const backSideAnimatedStyle = {
    transform: [
      { perspective: 1000 },
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const handleDrawCard = () => {
    if (isGameOver || deck.length === 0) {
      return;
    }

    setDeck((prevDeck) => {
      if (prevDeck.length === 0) return prevDeck;

      const [nextCard, ...restDeck] = prevDeck;

      setCurrentCard(nextCard);
      setDrawnCards((prev) => [nextCard, ...prev]);

      if (nextCard.rank === 13) {
        setKingCount((prevKings) => {
          const nextKings = prevKings + 1;
          if (nextKings >= 4) {
            setIsGameOver(true);
          }
          return nextKings;
        });
      }

      return restDeck;
    });

    // 裏面（TAP）→ 表面（カード）の3Dフリップアニメーション
    flipAnim.setValue(0); // まず裏面の状態から
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handleShuffle = () => {
    setDeck(createDeck());
    setDrawnCards([]);
    setCurrentCard(null);
    setKingCount(0);
    setIsGameOver(false);
  };

  const updatePunishment = (rank: NumberRank | 'JOKER', text: string) => {
    setPunishments((prev) => ({
      ...prev,
      ...(rank === 'JOKER' ? { joker: text } : { [rank]: text }),
    }));
  };

  const renderCardFace = () => {
    if (!currentCard) {
      return null;
    }
    if (currentCard.rank === 'JOKER') {
      return (
        <View style={styles.cardInner}>
          <Text style={styles.cardRank}>JOKER</Text>
        </View>
      );
    }

    const colorStyle =
      currentCard.suit === '♥' || currentCard.suit === '♦'
        ? styles.cardRed
        : styles.cardBlack;

    return (
      <View style={styles.cardInner}>
        <Text style={[styles.cardSuit, colorStyle]}>{currentCard.suit}</Text>
        <Text style={[styles.cardRank, colorStyle]}>
          {currentCard.rank === 1
            ? 'A'
            : currentCard.rank === 11
            ? 'J'
            : currentCard.rank === 12
            ? 'Q'
            : currentCard.rank === 13
            ? 'K'
            : currentCard.rank}
        </Text>
      </View>
    );
  };

  const renderCardBack = () => {
    return (
      <View style={styles.cardInner}>
        <Text style={styles.cardBackText}></Text>
      </View>
    );
  };

  const remainingCards = deck.length;
  const punishmentText = getPunishmentText(currentCard, punishments);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Kings - 飲み会トランプ</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              setScreen((prev) => (prev === 'game' ? 'settings' : 'game'))
            }
          >
            <Text style={styles.headerButtonText}>
              {screen === 'game' ? 'ルール編集' : 'ゲームに戻る'}
            </Text>
          </TouchableOpacity>
        </View>

        {screen === 'game' ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>
                残り枚数: {remainingCards} / {deck.length + drawnCards.length}
              </Text>
              <Text style={styles.infoText}>キング: {kingCount} / 4</Text>
            </View>

            <View style={styles.gameArea}>
              <AnimatedTouchableOpacity
                style={[
                  styles.card,
                  cardAnimatedStyle,
                  isGameOver || remainingCards === 0
                    ? styles.cardDisabled
                    : undefined,
                ]}
                activeOpacity={0.8}
                onPress={handleDrawCard}
              >
                {/* 表面（カード） */}
                <Animated.View
                  style={[styles.cardSide, frontSideAnimatedStyle]}
                >
                  {renderCardFace()}
                </Animated.View>
                {/* 裏面（TAP） */}
                <Animated.View
                  style={[styles.cardSide, styles.cardBackSide, backSideAnimatedStyle]}
                >
                  {renderCardBack()}
                </Animated.View>
              </AnimatedTouchableOpacity>

              {isGameOver && (
                <Text style={styles.gameOverText}>
                  4枚目のキングが出ました！ゲーム終了！
                </Text>
              )}
              {!isGameOver && remainingCards === 0 && (
                <Text style={styles.gameOverText}>カードがなくなりました。</Text>
              )}
            </View>

            <View style={styles.punishmentArea}>
              <Text style={styles.punishmentTitle}>このカードの罰ゲーム</Text>
              <Text style={styles.punishmentText}>{punishmentText}</Text>
            </View>

            <View style={styles.footerButtons}>
              <TouchableOpacity
                style={styles.shuffleButton}
                onPress={handleShuffle}
              >
                <Text style={styles.shuffleButtonText}>シャッフル</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.settingsArea}>
            <Text style={styles.settingsTitle}>罰ゲームの内容を編集</Text>
            <Text style={styles.settingsSubtitle}>
              文言を変更すると、すぐにメイン画面に反映されます。
            </Text>
            <ScrollView
              style={styles.settingsScroll}
              contentContainerStyle={styles.settingsScrollContent}
            >
              {(
                [
                  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
                ] as NumberRank[]
              ).map((rank) => (
                <View key={rank} style={styles.settingItem}>
                  <Text style={styles.settingLabel}>カード {rank}</Text>
                  <TextInput
                    value={punishments[rank]}
                    onChangeText={(text) => updatePunishment(rank, text)}
                    style={styles.settingInput}
                    placeholder="罰ゲームの内容を入力"
                    multiline
                  />
                </View>
              ))}

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>ジョーカー</Text>
                <TextInput
                  value={punishments.joker}
                  onChangeText={(text) => updatePunishment('JOKER', text)}
                  style={styles.settingInput}
                  placeholder="ジョーカーの罰ゲームを入力"
                  multiline
                />
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B4F3F',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF22',
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoText: {
    color: '#E3F2ED',
    fontSize: 14,
  },
  gameArea: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 180,
    height: 260,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  cardDisabled: {
    opacity: 0.4,
  },
  cardInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  cardBackSide: {
    // 裏面は背景とはっきり違う色にする
    backgroundColor: '#1E3A8A', // 濃い青
  },
  cardSuit: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardRank: {
    fontSize: 36,
    fontWeight: '700',
  },
  cardRed: {
    color: '#D32F2F',
  },
  cardBlack: {
    color: '#111111',
  },
  cardBackText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gameOverText: {
    marginTop: 16,
    color: '#FFCDD2',
    fontSize: 16,
    fontWeight: '700',
  },
  punishmentArea: {
    flex: 1,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF11',
  },
  punishmentTitle: {
    color: '#E0F2F1',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  punishmentText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  footerButtons: {
    marginTop: 12,
    alignItems: 'center',
  },
  shuffleButton: {
    backgroundColor: '#FFCA28',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 999,
  },
  shuffleButtonText: {
    color: '#4E342E',
    fontSize: 16,
    fontWeight: '700',
  },
  settingsArea: {
    flex: 1,
    marginTop: 8,
  },
  settingsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  settingsSubtitle: {
    color: '#E0F2F1',
    fontSize: 13,
    marginBottom: 8,
  },
  settingsScroll: {
    flex: 1,
  },
  settingsScrollContent: {
    paddingBottom: 80,
  },
  settingItem: {
    marginBottom: 12,
  },
  settingLabel: {
    color: '#E0F2F1',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '600',
  },
  settingInput: {
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    textAlignVertical: 'top',
  },
});
