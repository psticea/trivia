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
];

export const QUESTION_COUNT = QUESTIONS.length;
