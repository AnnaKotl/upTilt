export const parts = [
  {
    id: 'frame',
    view: 'underside',
    x: 51,
    y: 58,
    uk: 'Рама',
    en: 'Frame',
    description: {
      uk: 'Чотири промені з’єднують двигуни з центральною частиною рами. Знизу добре видно її форму.',
      en: 'Four arms connect the motors to the centre of the frame. Their shape is easiest to see from below.',
    },
  },
  {
    id: 'propeller',
    view: 'front',
    x: 77,
    y: 42,
    uk: 'Пропелер',
    en: 'Propeller',
    description: {
      uk: 'На цьому коптері помаранчеві пропелери мають по три лопаті. Кожен пропелер обертається разом із валом свого двигуна.',
      en: 'The orange propellers on this quad each have three blades. Each propeller turns with its motor shaft.',
    },
  },
  {
    id: 'camera',
    view: 'front',
    x: 50,
    y: 80,
    uk: 'Камера FPV',
    en: 'FPV camera',
    description: {
      uk: 'Невелика камера спереду дає пілоту вид із борту. Над нею на цьому зразку закріплено окрему камеру для запису.',
      en: 'The small forward-facing camera gives the pilot an onboard view. This quad also carries a separate recording camera above it.',
    },
  },
] as const;
