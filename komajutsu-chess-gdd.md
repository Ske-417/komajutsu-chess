# 駒術チェス (Komajutsu Chess) — Game Design Document v1.0

> React + TypeScript + chess.js でのWeb実装を想定した完全仕様書

---

## 1. ゲーム概要

スキルカードを収集・装備してチェス駒を育てながら相手キングのチェックメイトを目指す戦略ゲーム。通常チェスのルールをベースに、ドラフト・経験値・スキル吸収の3システムを追加。

### コアコンセプト
- 「なぜその駒を取るか」の動機が多層化（スキル目的の取り）
- 駒の強さが変動する非線形な駒価値
- ドラフト（事前戦略）× 盤上（戦術）の二層構造

---

## 2. スキルスロット

| 駒 | スロット数 | 備考 |
|---|---|---|
| ポーン (p) | 1 | |
| ナイト (n) | 2 | |
| ビショップ (b) | 2 | |
| ルーク (r) | 2 | |
| クイーン (q) | 3 | |
| キング (k) | 1 | 防御系スキルのみ装備可能 |

スロットが満タンの場合、相手はこの駒からスキルを吸収できない。

---

## 3. スキル取得の3ルート

### ルート1: ドラフト（ゲーム前）
1. スキルカード全16種×4枚(64枚)をシャッフル
2. 各プレイヤーに8枚配布
3. 各自8枚から5枚を選択（残り3枚を捨て山へ）
4. 選んだ5枚を好きな駒のスロットに割り当ててゲーム開始

### ルート2: 盤上の宝石
- 8マスに宝石を配置（詳細は Section 5）
- 駒がそのマスに移動すると対応カテゴリのスキルをランダムで1枚獲得
- 宝石は踏まれると消滅（復活なし）
- 宝石踏み時に EXP+3（金宝石は EXP+7）

### ルート3: 吸収（相手スキルを奪う）
- スキル持ちの相手駒を取った時のみ発動可能
- 奪えるスキルは1枚のみ
- 条件：自分の駒にスロットの空きがあること
- スロットが満タンの場合：既存スキルを捨てて付け替え可能（任意）

---

## 4. 経験値・レベルアップシステム

### EXP取得
| アクション | EXP |
|---|---|
| 移動（取りなし） | +1 |
| 相手駒を取る | +3 |
| 宝石マスを踏む | +3〜+7 |
| チェックをかける | +2 |
| スキル吸収成功 | +2 |

### レベルアップ閾値（駒単位で累計）
- Lv1 → Lv2: 10 EXP
- Lv2 → Lv3: さらに 20 EXP（累計 30 EXP）

### レベルアップのルール
- EXPは駒ごとに蓄積する
- 閾値超過時、その駒が持つスキルの中で最もLvが低いスキルが自動的にLv+1
- 同Lvのスキルが複数ある場合はプレイヤーが選択
- 複数スキルがある場合、レベルアップの余剰EXPは次のスキルに持ち越し

---

## 5. ボードデザイン

### 基本仕様
- 8×8標準チェス盤
- 宝石マスを8箇所追加（ゲーム開始時に配置）

### 宝石マス配置（180度回転対称）

```
  a  b  c  d  e  f  g  h
8 r  n  b  q  k  b  n  r
7 p  p  p  p  p  p  p  p
6 .  .  [R] .  .  [B] .  .
5 .  [G] .  [★] .  .  .  .
4 .  .  .  .  [★] .  [G] .
3 .  .  [B] .  .  [R] .  .
2 P  P  P  P  P  P  P  P
1 R  N  B  Q  K  B  N  R

[B]=青(移動系)  [R]=赤(戦闘系)  [G]=緑(防御系)  [★]=金(レア)
```

### コードで使う座標定義
```typescript
const GEM_POSITIONS: Record<string, GemType> = {
  'c3': 'blue',  // 移動系スキルをランダム1枚
  'f6': 'blue',
  'f3': 'red',   // 戦闘系スキルをランダム1枚
  'c6': 'red',
  'b5': 'green', // 防御系スキルをランダム1枚
  'g4': 'green',
  'd4': 'gold',  // 全カテゴリからランダム1枚 + Lv2で入手
  'e5': 'gold',
};
```

### 設計意図
- 中央(d4, e5)に金宝石 → 序盤からセンター争奪戦が起きる
- c3/f6(青) と f3/c6(赤) は白黒対称で公平
- b5/g4(緑) はやや外側 → 守備的プレイヤーが迂回して取りに行く

---

## 6. 全スキル詳細（16種）

### 移動系（blue）

#### 疾風 (Swift Wind)
| Lv | 効果 |
|---|---|
| 1 | この駒の移動距離+1（スライド系駒に有効：ルーク・ビショップ・クイーン） |
| 2 | 移動距離+2 |
| 3 | 移動距離+2 かつ 他の駒を飛び越えて移動できる |

#### 霞歩 (Mist Step)
| Lv | 効果 |
|---|---|
| 1 | 1ゲームに1回、任意の空きマスへ瞬間移動 |
| 2 | 2回使用可能 |
| 3 | 3回使用可能、かつ相手駒のいるマスへも移動可（取りとして処理） |

#### 二連撃 (Double Move)
| Lv | 効果 |
|---|---|
| 1 | 1ターンに2回移動できる（2回目は取り不可） |
| 2 | 2回移動、2回目も取り可 |
| 3 | 3回移動、すべての回で取り可 |

#### 踏破 (Trample)
| Lv | 効果 |
|---|---|
| 1 | この駒は自軍・敵軍問わず駒を飛び越えて移動できる |
| 2 | 飛び越えた相手駒に「呪縛Lv1」を付与する |
| 3 | 飛び越えたすべての相手駒を取りながら最終マスに到達 |

---

### 戦闘系（coral / red）

#### 爆裂 (Explosion)
| Lv | 効果 |
|---|---|
| 1 | 取られる時、隣接する相手駒1体を道連れにする |
| 2 | 隣接する相手駒2体を道連れ |
| 3 | 3×3マス範囲内の相手駒すべてを道連れ（キングを除く） |

#### 吸血 (Vampirism)
| Lv | 効果 |
|---|---|
| 1 | 相手駒を取った時、そのスキルを1つ「借用」（ゲーム終了で消滅） |
| 2 | 永続的に奪える |
| 3 | 2つのスキルから1つを選んで永続的に奪える |

#### 連鎖 (Chain Capture)
| Lv | 効果 |
|---|---|
| 1 | 1ターンに連続して2体まで取れる（取った後さらに1回移動・取り可） |
| 2 | 連続3体まで |
| 3 | 連続4体まで、かつ取るたびに移動距離+1（累積） |

#### 復讐 (Vengeance)
| Lv | 効果 |
|---|---|
| 1 | 取られた時、相手キングを1マス強制移動させる |
| 2 | キングを2マス強制移動 |
| 3 | キングを3マス強制移動 + 相手の手番を1回スキップ |

---

### 呪い系（purple）

#### 呪縛 (Bind)
| Lv | 効果 |
|---|---|
| 1 | 隣接する相手駒1体を2ターン行動不能に（1ゲーム2回まで） |
| 2 | 1体を3ターン停止 または 2体を2ターン停止（3回まで） |
| 3 | 3体を3ターン停止（使用回数制限なし） |

#### 腐食 (Corrosion)
| Lv | 効果 |
|---|---|
| 1 | 隣接中の相手駒はスキルを1つ無効化される（離れると回復） |
| 2 | スキル2つを無効化 |
| 3 | すべてのスキルを無効化 + 毎ターンその駒のEXP-2 |

#### 幻影 (Phantom)
| Lv | 効果 |
|---|---|
| 1 | この駒のコピー1体を隣接マスに生成（スキルなし）。相手が本物を1回当てると両方消える |
| 2 | スキルありコピー1体を生成 |
| 3 | スキルありコピー2体を生成 |

#### 呪印 (Curse Mark)
| Lv | 効果 |
|---|---|
| 1 | 相手駒1体に印をつける。その駒が移動するたびスキルのLvが1下がる |
| 2 | 移動するたびスキル1つが完全消滅 |
| 3 | 移動するたびスキル2つが消滅 + その駒の移動距離が半減 |

---

### 防御系（teal）

#### 鎧 (Armor)
| Lv | 効果 |
|---|---|
| 1 | 取られる攻撃を1回無効化（このスキルが消費される） |
| 2 | 2回無効化 |
| 3 | 3回無効化 + 無効化時に攻撃者を1マス押し返す |

#### 再生 (Regeneration)
| Lv | 効果 |
|---|---|
| 1 | 取られた後、3ターン後に取られたマスまたは近接マスに復活（スキルなし） |
| 2 | 2ターン後に復活（スキルなし） |
| 3 | 1ターン後に復活、保持スキルの半分（切り捨て）を引き継ぐ |

#### 影分身 (Shadow Clone)
| Lv | 効果 |
|---|---|
| 1 | この駒のコピーを隣接マスに1体生成（スキルなし） |
| 2 | コピー2体（スキルなし） |
| 3 | スキルありコピー2体（スキルも複製） |

#### 盾壁 (Shield Wall)
| Lv | 効果 |
|---|---|
| 1 | 隣接する自軍駒すべてが次の1回の特殊スキル攻撃を無効化 |
| 2 | 次の2回の特殊スキル攻撃を無効化 |
| 3 | 永続的に特殊スキル攻撃を無効化（この駒が移動するとリセット） |

---

## 7. ゲームモード

| モード | 概要 | ドラフト方法 |
|---|---|---|
| スタンダード | 通常対戦 | 8枚配布→5枚選択 |
| ローグライト | 5連戦キャンペーン。勝利時スキル持ち越し、敗北でリセット | 初戦はランダム2枚のみ |
| シールド戦 | ランダム10枚配布→5枚選択 | ランダム |
| ピースビルド | 全駒のスキルを自由編成して持ち込み | 自由 |

---

## 8. Bot AI仕様

### アーキテクチャ
```
BotEngine
├── ChessEngine（Minimax + Alpha-Beta Pruning）
│   ├── 合法手生成（chess.jsを使用）
│   ├── EvaluationFunction（評価関数）
│   └── 深さ設定（難易度別）
├── SkillEngine
│   ├── スキル価値評価
│   ├── スキル使用タイミング判定
│   └── 吸収機会検出
└── DraftEngine
    ├── スキル価値ランキング
    └── 相手選択に対するカウンター戦略
```

### 評価関数
```typescript
function evaluate(state: GameState, color: Color): number {
  let score = 0;

  // 1. 材料スコア
  const PIECE_VALUES: Record<PieceType, number> = {
    p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000
  };

  // 2. スキルボーナス
  const SKILL_BASE_VALUES: Record<SkillCategory, number> = {
    move: 60, combat: 80, curse: 60, defense: 60
  };
  const LV_MULTIPLIER = [0, 1.0, 1.5, 2.0];
  // skillBonus = sum of (SKILL_BASE_VALUES[skill.category] * LV_MULTIPLIER[skill.level])

  // 3. 盤面支配スコア（攻撃対象マス数 × 5）

  // 4. 宝石近接ボーナス（最寄り宝石への距離に反比例）

  // 5. スロット充填ボーナス（満タン駒1体につき+50）

  return score; // 正=白優勢、負=黒優勢
}
```

### 難易度別設定
| 難易度 | Minimax深さ | スキル評価 | 宝石戦略 | 吸収戦略 |
|---|---|---|---|---|
| Easy | 2 | なし（30%確率でランダム使用） | なし | なし |
| Medium | 4 | あり | 基本的な経路計算 | 機会があれば実行 |
| Hard | 6 | 高度なシナジー評価 | 最適コントロール | 優先的に狙う |

### スキル使用判定（Medium以上）
```typescript
function shouldUseSkill(skill: Skill, ctx: SkillContext): boolean {
  switch (skill.id) {
    case 'mist-step':
      return ctx.isKingInDanger || ctx.nearestGemDistance <= 2;
    case 'armor':
      return ctx.isPieceTargetedByHighValuePiece;
    case 'bind':
      return ctx.nearestThreateningPieceValue >= 5;
    case 'explosion':
      return ctx.adjacentEnemiesCount >= 1 && ctx.pieceIsTargeted;
    case 'chain-capture':
      return ctx.availableChainCaptures >= 2;
    default:
      return ctx.skillValueGain > 0;
  }
}
```

### ドラフトAI
```typescript
function draftPick(available: Skill[], myPicks: Skill[], opponentPicks: Skill[]): Skill {
  // 1. シナジーを考慮したスコアリング
  const scored = available.map(s => ({
    skill: s,
    score: getBaseValue(s) + getSynergyBonus(s, myPicks) + getCounterBonus(s, opponentPicks)
  }));
  return scored.sort((a, b) => b.score - a.score)[0].skill;
}
```

---

## 9. 技術実装仕様

### 推奨スタック
- **フレームワーク**: React + TypeScript
- **チェスロジック**: chess.js（合法手生成・チェック検出・チェックメイト判定）
- **ボード描画**: react-chessboard または カスタムSVGコンポーネント
- **状態管理**: Zustand
- **スタイリング**: Tailwind CSS
- **ビルド**: Vite

### 主要型定義
```typescript
type SkillCategory = 'move' | 'combat' | 'curse' | 'defense';
type SkillLevel = 1 | 2 | 3;
type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
type Color = 'white' | 'black';
type Square = string; // 'a1'〜'h8'
type GemType = 'blue' | 'red' | 'green' | 'gold';

interface SkillEffect {
  type: 'move-bonus' | 'capture-trigger' | 'captured-trigger' |
        'passive-adjacent' | 'active-target' | 'active-self';
  value: number;
  duration?: number;  // ターン数
  uses?: number;      // 使用回数制限（nullは無制限）
}

interface Skill {
  id: string;
  name: { ja: string; en: string };
  category: SkillCategory;
  level: SkillLevel;
  effects: SkillEffect[];
  descriptions: Record<SkillLevel, string>;
}

interface PieceState {
  type: PieceType;
  color: Color;
  skills: Skill[];
  maxSlots: number;
  experience: number;
  isBound: boolean;       // 呪縛状態
  boundTurns: number;     // 残り行動不能ターン
  isPhantom: boolean;     // 幻影コピーかどうか
  originalSquare?: Square; // 再生で復活する座標
  reviveTurnsLeft?: number;
}

interface GameState {
  chess: Chess;                         // chess.jsインスタンス
  pieces: Map<Square, PieceState>;      // スキル状態マップ
  gems: Map<Square, GemType>;           // 残存宝石
  phase: 'draft' | 'playing' | 'ended';
  currentTurn: Color;
  turnNumber: number;
  winner: Color | null;
  botColor: Color | null;
  botDifficulty: 'easy' | 'medium' | 'hard';
  draft: DraftState;
  pendingAbsorb: {                       // 吸収待ち状態
    capturingSquare: Square;
    capturedSkills: Skill[];
  } | null;
}

interface DraftState {
  whiteHand: Skill[];
  blackHand: Skill[];
  whitePicks: Skill[];
  blackPicks: Skill[];
  phase: 'dealing' | 'picking' | 'assigning' | 'done';
}
```

### 各駒のスロット数定数
```typescript
const PIECE_MAX_SLOTS: Record<PieceType, number> = {
  p: 1, n: 2, b: 2, r: 2, q: 3, k: 1
};
```

### 主要ゲームロジック関数（実装必要）
```typescript
// 宝石踏み処理
function handleGemStep(square: Square, state: GameState): GameState

// スキル吸収処理（モーダル表示→プレイヤー選択後に呼ぶ）
function absorbSkill(
  capturingSquare: Square,
  targetSkill: Skill,
  state: GameState
): GameState

// アクティブスキル発動
function activateSkill(
  skill: Skill,
  sourceSquare: Square,
  targetSquare: Square | null,
  state: GameState
): GameState

// 経験値付与 + 自動レベルアップ
function addExperience(square: Square, amount: number, state: GameState): GameState

// 毎ターン処理（呪縛カウントダウン・腐食適用など）
function processTurnEffects(state: GameState): GameState
```

### 画面構成

**1. タイトル画面**
- ゲームモード選択
- 難易度選択（対Botの場合）

**2. ドラフト画面**
- 手札8枚を表示（カードUI）
- 選択した5枚をハイライト
- 駒への割り当て（スロットシートUI）
- Botは自動でピック（アニメーション付き）

**3. メイン対戦画面**
- チェスボード（中央）
- 宝石マーカーをオーバーレイ（カラードットまたはアイコン）
- 駒のスキルバッジ（駒の上に小さなカラードットを最大3つ）
- 右サイドパネル：選択駒のスキル詳細、EXPプログレスバー
- アクティブスキルはクリックで発動（使用可能時にハイライト）

**4. スキル吸収モーダル**
- 取った相手駒のスキル一覧を表示
- 「吸収する」「スキップ」ボタン
- 吸収先の駒スロットを選択するUI

---

## 10. カードゲーム版コンポーネント一覧（物理版）

| アイテム | 数量 | 備考 |
|---|---|---|
| スキルカード | 64枚 | 16種×4枚、63×88mm |
| 駒タイル | 32枚 | 2色×16駒 |
| スロットシート | 2枚 | A5サイズ、各駒のスキル記録用 |
| 経験値トークン | 60枚 | 1EXP/枚 |
| 宝石タイル | 8枚 | 4種×2枚 |
| レベルマーカー | 30枚 | 三角形チップ |

### カード表面デザイン（Lv1面）
- 上部帯: カテゴリカラー + カテゴリ名
- タイトルエリア: スキル名（日本語）/ (English)
- テキストエリア: Lv1効果テキスト
- 下部: 対応可能駒アイコン（♙♘♗♖♕♔）

### カード裏面（Lv2面）
- 「LV2」ヘッダー
- 強化版効果テキスト
- Lv2状態であることを示す外枠の色変化

---

*GDD Version 1.0 — Komajutsu Chess*
*技術スタック: React + TypeScript + chess.js + Zustand + Tailwind CSS*
