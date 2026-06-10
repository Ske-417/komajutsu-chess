import type { PieceType, GemType, SkillCategory, Skill } from './types';

export const PIECE_MAX_SLOTS: Record<PieceType, number> = {
  p: 1, n: 2, b: 2, r: 2, q: 3, k: 1,
};

export const GEM_POSITIONS: Record<string, GemType> = {
  'c3': 'blue',
  'f6': 'blue',
  'f3': 'red',
  'c6': 'red',
  'b5': 'green',
  'g4': 'green',
  'd4': 'gold',
  'e5': 'gold',
};

export const GEM_EXP: Record<GemType, number> = {
  blue: 3, red: 3, green: 3, gold: 7,
};

export const GEM_COLORS: Record<GemType, string> = {
  blue: '#3b82f6',
  red: '#ef4444',
  green: '#22c55e',
  gold: '#f59e0b',
};

export const CATEGORY_COLORS: Record<SkillCategory, string> = {
  move: '#5b9cf6',
  combat: '#f07070',
  curse: '#b87de8',
  defense: '#3dc9b4',
};

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  move: '移動系',
  combat: '戦闘系',
  curse: '呪い系',
  defense: '防御系',
};

export const EXP_TO_LEVEL: Record<number, number> = {
  2: 10,
  3: 30,
};

export const PIECE_VALUES: Record<PieceType, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
};

export const SKILL_BASE_VALUES: Record<SkillCategory, number> = {
  move: 60, combat: 80, curse: 60, defense: 60,
};

export const ALL_SKILLS: Skill[] = [
  // 移動系 (blue)
  {
    id: 'swift-wind',
    name: { ja: '疾風', en: 'Swift Wind' },
    category: 'move',
    level: 1,
    descriptions: {
      1: 'この駒の移動距離+1（スライド系駒に有効）',
      2: '移動距離+2',
      3: '移動距離+2かつ他の駒を飛び越えて移動できる',
    },
    compatiblePieces: ['r', 'b', 'q'],
  },
  {
    id: 'mist-step',
    name: { ja: '霞歩', en: 'Mist Step' },
    category: 'move',
    level: 1,
    descriptions: {
      1: '1ゲームに1回、任意の空きマスへ瞬間移動',
      2: '2回使用可能',
      3: '3回使用可能、かつ相手駒のいるマスへも移動可',
    },
    compatiblePieces: ['p', 'n', 'b', 'r', 'q', 'k'],
  },
  {
    id: 'double-move',
    name: { ja: '二連撃', en: 'Double Move' },
    category: 'move',
    level: 1,
    descriptions: {
      1: '1ターンに2回移動できる（2回目は取り不可）',
      2: '2回移動、2回目も取り可',
      3: '3回移動、すべての回で取り可',
    },
    compatiblePieces: ['p', 'n', 'b', 'r', 'q'],
  },
  {
    id: 'trample',
    name: { ja: '踏破', en: 'Trample' },
    category: 'move',
    level: 1,
    descriptions: {
      1: 'この駒は自軍・敵軍問わず駒を飛び越えて移動できる',
      2: '飛び越えた相手駒に「呪縛Lv1」を付与する',
      3: '飛び越えたすべての相手駒を取りながら最終マスに到達',
    },
    compatiblePieces: ['r', 'b', 'q'],
  },
  // 戦闘系 (red)
  {
    id: 'explosion',
    name: { ja: '爆裂', en: 'Explosion' },
    category: 'combat',
    level: 1,
    descriptions: {
      1: '取られる時、隣接する相手駒1体を道連れにする',
      2: '隣接する相手駒2体を道連れ',
      3: '3×3マス範囲内の相手駒すべてを道連れ（キングを除く）',
    },
    compatiblePieces: ['p', 'n', 'b', 'r', 'q'],
  },
  {
    id: 'vampirism',
    name: { ja: '吸血', en: 'Vampirism' },
    category: 'combat',
    level: 1,
    descriptions: {
      1: '相手駒を取った時、そのスキルを1つ「借用」（ゲーム終了で消滅）',
      2: '永続的に奪える',
      3: '2つのスキルから1つを選んで永続的に奪える',
    },
    compatiblePieces: ['n', 'b', 'r', 'q'],
  },
  {
    id: 'chain-capture',
    name: { ja: '連鎖', en: 'Chain Capture' },
    category: 'combat',
    level: 1,
    descriptions: {
      1: '1ターンに連続して2体まで取れる',
      2: '連続3体まで',
      3: '連続4体まで、かつ取るたびに移動距離+1',
    },
    compatiblePieces: ['n', 'b', 'r', 'q'],
  },
  {
    id: 'vengeance',
    name: { ja: '復讐', en: 'Vengeance' },
    category: 'combat',
    level: 1,
    descriptions: {
      1: '取られた時、相手キングを1マス強制移動させる',
      2: 'キングを2マス強制移動',
      3: 'キングを3マス強制移動 + 相手の手番を1回スキップ',
    },
    compatiblePieces: ['p', 'n', 'b', 'r', 'q'],
  },
  // 呪い系 (purple)
  {
    id: 'bind',
    name: { ja: '呪縛', en: 'Bind' },
    category: 'curse',
    level: 1,
    descriptions: {
      1: '隣接する相手駒1体を2ターン行動不能に（1ゲーム2回まで）',
      2: '1体を3ターン停止または2体を2ターン停止（3回まで）',
      3: '3体を3ターン停止（使用回数制限なし）',
    },
    compatiblePieces: ['n', 'b', 'r', 'q'],
  },
  {
    id: 'corrosion',
    name: { ja: '腐食', en: 'Corrosion' },
    category: 'curse',
    level: 1,
    descriptions: {
      1: '隣接中の相手駒はスキルを1つ無効化される',
      2: 'スキル2つを無効化',
      3: 'すべてのスキルを無効化 + 毎ターンその駒のEXP-2',
    },
    compatiblePieces: ['n', 'b', 'r', 'q'],
  },
  {
    id: 'phantom',
    name: { ja: '幻影', en: 'Phantom' },
    category: 'curse',
    level: 1,
    descriptions: {
      1: 'この駒のコピー1体を隣接マスに生成（スキルなし）',
      2: 'スキルありコピー1体を生成',
      3: 'スキルありコピー2体を生成',
    },
    compatiblePieces: ['n', 'b', 'r', 'q'],
  },
  {
    id: 'curse-mark',
    name: { ja: '呪印', en: 'Curse Mark' },
    category: 'curse',
    level: 1,
    descriptions: {
      1: '相手駒1体に印をつける。その駒が移動するたびスキルのLvが1下がる',
      2: '移動するたびスキル1つが完全消滅',
      3: '移動するたびスキル2つが消滅 + その駒の移動距離が半減',
    },
    compatiblePieces: ['n', 'b', 'r', 'q'],
  },
  // 防御系 (teal)
  {
    id: 'armor',
    name: { ja: '鎧', en: 'Armor' },
    category: 'defense',
    level: 1,
    descriptions: {
      1: '取られる攻撃を1回無効化（このスキルが消費される）',
      2: '2回無効化',
      3: '3回無効化 + 無効化時に攻撃者を1マス押し返す',
    },
    compatiblePieces: ['p', 'n', 'b', 'r', 'q', 'k'],
  },
  {
    id: 'regeneration',
    name: { ja: '再生', en: 'Regeneration' },
    category: 'defense',
    level: 1,
    descriptions: {
      1: '取られた後、3ターン後に復活（スキルなし）',
      2: '2ターン後に復活（スキルなし）',
      3: '1ターン後に復活、スキルの半分を引き継ぐ',
    },
    compatiblePieces: ['p', 'n', 'b', 'r', 'q'],
  },
  {
    id: 'shadow-clone',
    name: { ja: '影分身', en: 'Shadow Clone' },
    category: 'defense',
    level: 1,
    descriptions: {
      1: 'この駒のコピーを隣接マスに1体生成（スキルなし）',
      2: 'コピー2体（スキルなし）',
      3: 'スキルありコピー2体（スキルも複製）',
    },
    compatiblePieces: ['n', 'b', 'r', 'q'],
  },
  {
    id: 'shield-wall',
    name: { ja: '盾壁', en: 'Shield Wall' },
    category: 'defense',
    level: 1,
    descriptions: {
      1: '隣接する自軍駒すべてが次の1回の特殊スキル攻撃を無効化',
      2: '次の2回の特殊スキル攻撃を無効化',
      3: '永続的に特殊スキル攻撃を無効化（この駒が移動するとリセット）',
    },
    compatiblePieces: ['r', 'q', 'k'],
  },
];

export const SKILLS_BY_CATEGORY: Record<string, Skill[]> = {
  move: ALL_SKILLS.filter(s => s.category === 'move'),
  combat: ALL_SKILLS.filter(s => s.category === 'combat'),
  curse: ALL_SKILLS.filter(s => s.category === 'curse'),
  defense: ALL_SKILLS.filter(s => s.category === 'defense'),
};
