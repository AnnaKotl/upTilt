export const studyTitles = {
  'anatomy/frame': ['Рама й захист', 'Frame and guards'],
  'anatomy/propulsion': ['Двигун і пропелер', 'Motor and propeller'],
  'anatomy/controller': [
    'Контролер і регулятори обертів',
    'Flight controller and ESCs',
  ],
  'equipment/controls': [
    'Стіки, перемикачі й індикатори',
    'Sticks, switches and indicators',
  ],
  'equipment/sticks': ['Стіки й осі', 'Sticks and axes'],
  'video/osd': ['Що показує OSD', 'Reading an OSD'],
  'video/video-path': ['Шлях зображення', 'The video path'],
  'power/cells': ['Комірки й позначення S', 'Cells and the S rating'],
  'workbench/boards': ['Плата, доріжка й контакт', 'Boards, traces and pads'],
} as const;
export type StudyPath = keyof typeof studyTitles;
const partArticles: Record<string, StudyPath> = {
  propeller: 'anatomy/propulsion',
  motor: 'anatomy/propulsion',
  board: 'anatomy/controller',
  esc: 'anatomy/controller',
  camera: 'video/video-path',
  video: 'video/video-path',
  antenna: 'video/video-path',
  battery: 'power/cells',
  connector: 'workbench/boards',
  'power-lead': 'workbench/boards',
  receiver: 'workbench/boards',
  'light-strip': 'workbench/boards',
};
export function partArticle(id: string): StudyPath {
  return partArticles[id] ?? 'anatomy/frame';
}
