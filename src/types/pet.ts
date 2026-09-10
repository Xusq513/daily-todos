export type BuiltInPetId = 'cat' | 'dog' | 'slime' | 'robot';
export type LocalPetId = `local:${string}`;
export type PetId = BuiltInPetId | LocalPetId;

export type PetAction = 'idle' | 'walk' | 'happy' | 'sleep' | 'poke';

export interface PetMeta {
  id: PetId;
  name: string;
  species: string;
  tagline: string;
  themeColor: string;
  emoji: string;
}

export const PET_ROSTER: Record<BuiltInPetId, PetMeta> = {
  cat: {
    id: 'cat',
    name: '咪咪 (Mimi)',
    species: '三花小猫',
    tagline: '温顺治愈，喜欢在你专注时安安静静打瞌睡~',
    themeColor: 'from-amber-400 to-orange-500',
    emoji: '🐱',
  },
  dog: {
    id: 'dog',
    name: '哈希 (Hachi)',
    species: '元气柴犬',
    tagline: '活力四射，每当你搞定一条待办它就疯狂摇尾巴！',
    themeColor: 'from-yellow-400 to-amber-600',
    emoji: '🐶',
  },
  slime: {
    id: 'slime',
    name: '果冻 (Jelly)',
    species: '弹力史莱姆',
    tagline: '晶莹剔透Q弹如果冻，随着你的进度开心Duang Duang跳跃。',
    themeColor: 'from-emerald-400 to-teal-500',
    emoji: '🧪',
  },
  robot: {
    id: 'robot',
    name: '智子 (Robo-01)',
    species: '赛博小助手',
    tagline: '极客科技风，雷达全天候扫描待办，喷气悬浮伴你编程。',
    themeColor: 'from-blue-400 to-indigo-600',
    emoji: '🤖',
  },
};

export const isBuiltInPetId = (petId: string): petId is BuiltInPetId =>
  Object.prototype.hasOwnProperty.call(PET_ROSTER, petId);
