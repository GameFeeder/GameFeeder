export type subscriber = {
  gameSubs: string[],
  id: string,
  prefix: string,
};

export type subscribers = {
  [index: string]: subscriber[],
  discord: subscriber[],
  telegram: subscriber[],
};

export default class DataManager {
  
}
