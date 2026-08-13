import type { Question } from './types';
import { istQuestions } from './questions/istorie';
import { geoQuestions } from './questions/geografie';
import { stiQuestions } from './questions/stiinta';
import { artQuestions } from './questions/arta';
import { muzQuestions } from './questions/muzica';
import { flmQuestions } from './questions/film';
import { spoQuestions } from './questions/sport';
import { tehQuestions } from './questions/tehnologie';
import { gasQuestions } from './questions/gastronomie';
import { relQuestions } from './questions/religie';

import { istCopiiQuestions } from './questions/copii/istorie';
import { geoCopiiQuestions } from './questions/copii/geografie';
import { stiCopiiQuestions } from './questions/copii/stiinta';
import { artCopiiQuestions } from './questions/copii/arta';
import { muzCopiiQuestions } from './questions/copii/muzica';
import { flmCopiiQuestions } from './questions/copii/film';
import { spoCopiiQuestions } from './questions/copii/sport';
import { tehCopiiQuestions } from './questions/copii/tehnologie';
import { gasCopiiQuestions } from './questions/copii/gastronomie';
import { relCopiiQuestions } from './questions/copii/religie';

export const QUESTIONS: Question[] = [
  ...istQuestions,
  ...geoQuestions,
  ...stiQuestions,
  ...artQuestions,
  ...muzQuestions,
  ...flmQuestions,
  ...spoQuestions,
  ...tehQuestions,
  ...gasQuestions,
  ...relQuestions,

  ...istCopiiQuestions,
  ...geoCopiiQuestions,
  ...stiCopiiQuestions,
  ...artCopiiQuestions,
  ...muzCopiiQuestions,
  ...flmCopiiQuestions,
  ...spoCopiiQuestions,
  ...tehCopiiQuestions,
  ...gasCopiiQuestions,
  ...relCopiiQuestions,
];

export const QUESTION_COUNT = QUESTIONS.length;
