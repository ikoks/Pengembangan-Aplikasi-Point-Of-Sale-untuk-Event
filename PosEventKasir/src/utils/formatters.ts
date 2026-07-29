import { formatRp as formatRpConfig } from '../constants/storeConfig';

export const formatRp = (num: number): string => {
  return formatRpConfig(num);
};
