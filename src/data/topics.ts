// Declaration order is the reading order. It drives the knowledge index,
// the hero board and the search facets, so change it here and nowhere else.
export const topics = [
  {
    id: 'radio',
    icon: 'radio',
    title: {
      uk: 'Радіозв’язок',
      en: 'Radio links',
    },
    summary: {
      uk: 'Радіохвилі, частота, антени й основи електрики.',
      en: 'Radio waves, frequency, antennas and basic electricity.',
    },
    question: {
      uk: 'Що таке частота?',
      en: 'What is frequency?',
    },
    note: {
      uk: 'Частота показує, скільки повних коливань відбувається за секунду. Одиниця вимірювання — герц (Гц). Один мегагерц дорівнює мільйону герців.',
      en: 'Frequency is the number of complete cycles per second. Its unit is the hertz (Hz). One megahertz is one million hertz.',
    },
    source: {
      label: 'NASA Science',
      url: 'https://science.nasa.gov/ems/05_radiowaves/',
    },
  },
  {
    id: 'simulators',
    icon: 'game',
    title: {
      uk: 'Симулятори',
      en: 'Simulators',
    },
    summary: {
      uk: 'Віртуальні моделі й середовища польоту.',
      en: 'Virtual aircraft and flying sites.',
    },
    question: {
      uk: 'Що відтворює симулятор?',
      en: 'What does a simulator model?',
    },
    note: {
      uk: 'У симуляторі рух обчислює програма. Liftoff: FPV Drone Racing відтворює польоти спортивних квадрокоптерів у віртуальному середовищі.',
      en: 'A simulator calculates how a virtual aircraft moves. Liftoff: FPV Drone Racing lets you fly racing quadcopters in a range of virtual environments.',
    },
    source: {
      label: 'Liftoff',
      url: 'https://www.liftoff-game.com/',
    },
  },
  {
    id: 'anatomy',
    icon: 'layers',
    title: {
      uk: 'Будова дрона',
      en: 'Drone anatomy',
    },
    summary: {
      uk: 'Рама, камера й пропелери.',
      en: 'Frame, camera and propellers.',
    },
    question: {
      uk: 'Що тримає рама?',
      en: 'What does the frame hold?',
    },
    note: {
      uk: 'У мікрокоптера типу whoop рама об’єднує чотири захисні кільця. Усередині кожного розташовані двигун і пропелер.',
      en: 'A whoop frame joins four propeller guards into one structure. Each guard surrounds a motor and its propeller.',
    },
    source: {
      label: 'BETAFPV · Air65',
      url: 'https://betafpv.com/products/air65-brushless-whoop-quadcopter',
    },
  },
  {
    id: 'fundamentals',
    icon: 'flight',
    title: {
      uk: 'Фізика польоту',
      en: 'Flight physics',
    },
    summary: {
      uk: 'Сили та рух у повітрі.',
      en: 'Forces and motion in the air.',
    },
    question: {
      uk: 'Як читати стрілку сили?',
      en: 'What does a force arrow show?',
    },
    note: {
      uk: 'Сила має величину й напрямок. На схемі напрямок показує вістря стрілки, а довжина дає змогу порівняти величини сил, якщо масштаб однаковий.',
      en: 'A force has both magnitude and direction. The arrowhead shows its direction. On a diagram drawn to scale, a longer arrow represents a larger force.',
    },
    source: {
      label: 'NASA Glenn',
      url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/four-forces-on-an-airplane/',
    },
  },
  {
    id: 'equipment',
    icon: 'transmitter',
    title: {
      uk: 'Пульт і спорядження',
      en: 'Radio and flight gear',
    },
    summary: {
      uk: 'Стіки, перемикачі та індикатори пульта.',
      en: 'Transmitter sticks, switches and indicators.',
    },
    question: {
      uk: 'Що показує монітор каналів?',
      en: 'What does a channel monitor show?',
    },
    note: {
      uk: 'На пульті монітор каналів відображає вихідні значення поточного профілю моделі. За ними видно, як рух стіка або перемикання змінює значення каналу.',
      en: 'The transmitter’s channel monitor displays the outputs of the current model profile. It shows how a stick movement or switch position changes a channel value.',
    },
    source: {
      label: 'EdgeTX',
      url: 'https://manual.edgetx.org/',
    },
  },
  {
    id: 'firmware',
    icon: 'firmware',
    title: { uk: 'Прошивка', en: 'Firmware' },
    summary: {
      uk: 'Betaflight для коптера, EdgeTX і налаштування пульта.',
      en: 'Betaflight for the quad, EdgeTX and transmitter setup.',
    },
    question: {
      uk: 'Прошивка й налаштування — у чому різниця?',
      en: 'How do firmware and settings differ?',
    },
    note: {
      uk: 'Прошивка — програма, що працює на пристрої. Налаштування — збережені параметри цієї програми. Зміна імені моделі на пульті або перегляд каналів у Betaflight App не потребують перепрошивки.',
      en: 'Firmware is the software running on the device. Settings are the parameters it stores. Renaming a transmitter model or inspecting channels in Betaflight App does not require flashing firmware.',
    },
    source: {
      label: 'Betaflight App',
      url: 'https://betaflight.com/docs/wiki/app',
    },
  },
  {
    id: 'video',
    icon: 'goggles',
    title: { uk: 'FPV-окуляри', en: 'FPV goggles' },
    summary: {
      uk: 'Зображення з камери та екранні показники.',
      en: 'The onboard view and its on-screen readings.',
    },
    question: { uk: 'Що показують окуляри?', en: 'What do the goggles show?' },
    note: {
      uk: 'Екран в окулярах показує зображення з камери коптера. Деякі окуляри також записують отримане відео на карту пам’яті.',
      en: 'The screen inside the goggles shows the view from the quad. Some goggles can also record the incoming video to a memory card.',
    },
    source: {
      label: 'BETAFPV · VR03',
      url: 'https://betafpv.com/products/vr03-fpv-goggles',
    },
  },
  {
    id: 'power',
    icon: 'battery',
    title: { uk: 'Живлення', en: 'Batteries' },
    summary: {
      uk: 'Акумулятор і позначення на ньому.',
      en: 'Cells, packs and the markings on a battery.',
    },
    question: { uk: 'Що означає 1S?', en: 'What does 1S mean?' },
    note: {
      uk: 'На акумуляторі мікрокоптера часто є напис 1S. Він означає одну комірку за напругою. Саме такий акумулятор показаний на дошці деталей.',
      en: 'A micro quad battery often carries the marking 1S. It has a single cell in series. This is the type shown on the parts board.',
    },
    source: {
      label: 'BETAFPV · Air65',
      url: 'https://betafpv.com/products/air65-brushless-whoop-quadcopter',
    },
  },
  {
    id: 'workbench',
    icon: 'circuit',
    title: {
      uk: 'Паяння та збірка',
      en: 'Soldering and assembly',
    },
    summary: {
      uk: 'Плати, компоненти та з’єднання.',
      en: 'Boards, components and connections.',
    },
    question: {
      uk: 'Що таке друкована плата?',
      en: 'What is a printed circuit board?',
    },
    note: {
      uk: 'На друкованій платі закріплені електронні компоненти. Провідні доріжки з’єднують їх у коло. В англомовній документації таку плату часто називають PCB.',
      en: 'A printed circuit board (PCB) supports electronic components. Conductive tracks on the board connect the components to form a circuit.',
    },
    source: {
      label: 'KiCad',
      url: 'https://docs.kicad.org/',
    },
  },
] as const;
export type Topic = (typeof topics)[number];
