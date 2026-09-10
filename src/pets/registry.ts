import type { ComponentType } from 'react';
import {
  PET_ROSTER,
  isBuiltInPetId,
  type LocalPetId,
  type PetAction,
  type PetId,
  type PetMeta,
} from '../types/pet';

export type LocalPetQuoteType = 'alldone' | 'celebrate' | 'poke';

export interface LocalPetSpeechContext {
  completionRate: number;
  completedCount: number;
  totalCount: number;
}

export interface LocalPetVisualProps {
  action: PetAction;
}

type LocalPetQuoteSource =
  | string[]
  | ((context: LocalPetSpeechContext) => string[]);

export interface LocalPetDefinition {
  meta: PetMeta & { id: LocalPetId };
  Visual: ComponentType<LocalPetVisualProps>;
  quotes?: Partial<Record<LocalPetQuoteType, LocalPetQuoteSource>>;
  aliases?: string[];
}

interface LocalPetModule {
  default: LocalPetDefinition;
}

const localModules = import.meta.glob<LocalPetModule>('../local-pets/*.tsx', {
  eager: true,
});

const localPets = Object.values(localModules)
  .map((module) => module.default)
  .filter((definition): definition is LocalPetDefinition => {
    return Boolean(
      definition?.meta?.id.startsWith('local:') && definition.Visual,
    );
  });

export const AVAILABLE_PETS: PetMeta[] = [
  ...Object.values(PET_ROSTER),
  ...localPets.map((definition) => definition.meta),
];

export const getLocalPetDefinition = (
  petId: string,
): LocalPetDefinition | undefined =>
  localPets.find(
    (definition) =>
      definition.meta.id === petId || definition.aliases?.includes(petId),
  );

export const resolvePetId = (petId: string): PetId => {
  if (isBuiltInPetId(petId)) return petId;
  return getLocalPetDefinition(petId)?.meta.id ?? 'cat';
};

export const getAvailablePetIds = (): PetId[] =>
  AVAILABLE_PETS.map((pet) => pet.id);

export const getLocalPetQuotes = (
  petId: string,
  type: LocalPetQuoteType,
  context: LocalPetSpeechContext,
): string[] | undefined => {
  const source = getLocalPetDefinition(petId)?.quotes?.[type];
  return typeof source === 'function' ? source(context) : source;
};
