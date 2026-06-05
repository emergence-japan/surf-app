import { fukuiPoints } from './fukui';
import { kyotoPoints } from './kyoto';
import { tottoriPoints } from './tottori';
import { miePoints } from './mie';
import { wakayamaPoints } from './wakayama';
import { tokushimaPoints } from './tokushima';
import { aichiPoints } from './aichi';
import { shimanePoints } from './shimane';
import { kochiPoints } from './kochi';

export type { SurfPoint, BayGeometry, Obstacle, BreakProfile } from './types';

export const surfPoints = [
  ...fukuiPoints,
  ...kyotoPoints,
  ...tottoriPoints,
  ...miePoints,
  ...wakayamaPoints,
  ...tokushimaPoints,
  ...aichiPoints,
  ...shimanePoints,
  ...kochiPoints,
];
