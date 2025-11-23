// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as tf from '@tensorflow/tfjs';
import * as toxicity from '@tensorflow-models/toxicity';
import { Filter } from 'bad-words';

const TOXICITY_THRESHOLD = 0.9;
const TOXICITY_LABELS = [
  'identity_attack',
  'insult',
  'obscene',
  'severe_toxicity',
  'sexual_explicit',
  'threat',
  'toxicity'
];

const filter = new Filter();
filter.addWords('facebook', 'instagram', 'twitter', 'snapchat', 'tiktok', 'discord', 'reddit');

const regexes = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // email
  /\+?\d{1,3}?[-.\s]?(\d{1,4}[-.\s]?){2,3}\d{1,4}/, // phone numbers
  /\b(send to all|forward this|share this with|must circle around the globe|post this on .* other games)\b/i // chain mail phrases
];

let toxicityModel: toxicity.ToxicityClassifier | null = null;
async function loadModel() {
  if (!toxicityModel) {
    toxicityModel = await toxicity.load(TOXICITY_THRESHOLD, TOXICITY_LABELS);
  }
}

export async function checkString(originaltext: string) {
  const text = originaltext.toLowerCase();

  await tf.ready();
  await loadModel();

  const hasBadWords = filter.isProfane(text);

  const hasRegexMatch = regexes.some((r) => r.test(text));

  const predictions = await toxicityModel!.classify([text]);
  const hasToxicity = predictions.some((p) => p.results[0].match);

  return {
    text,
    hasBadWords,
    hasRegexMatch,
    hasToxicity,
    isUnsafe: hasBadWords || hasRegexMatch || hasToxicity
  };
}

if (import.meta.main) {
  console.log('Running tests...');
  await (async () => {
    const result = await checkString(
      'Hey, contact me at applecat@example.com and join my Discord server!'
    );
    console.log(result);
  })();
  await (async () => {
    const result = await checkString(
      "We're dudes on computers, moron. You are quite astonishingly stupid."
    );
    console.log(result);
  })();
  await (async () => {
    const result = await checkString(
      'Please stop. If you continue to vandalize Wikipedia, as you did to AmpMod, you will be blocked from editing.'
    );
    console.log(result);
  })();
  await (async () => {
    const result = await checkString('I love this game!');
    console.log(result);
  })();
  await (async () => {
    const result = await checkString('Please post this on 10 other games or you are doomed.');
    console.log(result);
  })();
}
