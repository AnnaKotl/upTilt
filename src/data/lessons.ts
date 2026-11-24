import { studyTitles } from './study-titles';
import type { Topic } from './topics';

type Bilingual = readonly [uk: string, en: string];

interface Lesson {
  id: string;
  title: Bilingual;
  paragraphs: readonly Bilingual[];
  children?: readonly Lesson[];
  detail?: {
    reference: { label: string; url: string };
    figure?: 'wavelength';
    caption?: Bilingual;
    related?: string;
  };
}

function lesson(
  id: string,
  title: Bilingual,
  explanation: Bilingual,
  example: Bilingual,
  children?: readonly Lesson[],
  detail?: Lesson['detail'],
): Lesson {
  return { id, title, paragraphs: [explanation, example], children, detail };
}

export const lessons: Record<Topic['id'], readonly Lesson[]> = {
  radio: [
    lesson(
      'waves',
      ['Радіохвилі', 'Radio waves'],
      [
        'Радіохвиля — це поширення змінного електричного й магнітного полів. У вакуумі радіохвилі рухаються зі швидкістю світла.',
        'A radio wave is a changing electric and magnetic field that travels through space. In a vacuum, radio waves move at the speed of light.',
      ],
      [
        'Коливання можна описати амплітудою, періодом і довжиною хвилі. Це три різні характеристики однієї хвилі.',
        'Amplitude, period and wavelength describe different properties of the same wave.',
      ],
      [
        lesson(
          'wavelength',
          ['Довжина хвилі', 'Wavelength'],
          [
            'Довжина хвилі — відстань між двома сусідніми точками, що коливаються в однаковій фазі. Наприклад, між двома гребенями.',
            'Wavelength is the distance between adjacent points at the same phase, such as two neighbouring peaks.',
          ],
          [
            'У тому самому середовищі вища частота відповідає коротшій довжині хвилі. Їх пов’язує швидкість поширення: v = fλ.',
            'In the same medium, a higher frequency corresponds to a shorter wavelength. Wave speed relates the two through v = fλ.',
          ],
          undefined,
          {
            figure: 'wavelength',
            related: 'frequency',
            caption: [
              'λ — відстань між двома сусідніми гребенями. У формулі v — швидкість поширення, f — частота.',
              'λ is the distance between neighbouring crests. In the equation, v is propagation speed and f is frequency.',
            ],
            reference: {
              label: 'NASA Science · Anatomy of an Electromagnetic Wave',
              url: 'https://science.nasa.gov/ems/02_anatomy/',
            },
          },
        ),
        lesson(
          'reflection',
          ['Відбиття й поглинання', 'Reflection and absorption'],
          [
            'На межі середовищ частина енергії хвилі може відбитися, а частина пройти далі або поглинутися. Співвідношення залежить від матеріалу й частоти.',
            'When a wave reaches a boundary, some energy can be reflected and some can pass through or be absorbed. The proportions depend on the material and frequency.',
          ],
          [
            'Якщо до приймача доходять кілька копій хвилі різними шляхами, їхні поля накладаються. Це явище називають багатопроменевим поширенням.',
            'When copies of a wave reach a receiver along different paths, their fields add together. This is called multipath propagation.',
          ],
        ),
      ],
    ),
    lesson(
      'frequency',
      ['Частота й період', 'Frequency and period'],
      [
        'Частота — кількість коливань за секунду. Період — час одного коливання. Що частіше повторюється цикл, то коротший його період.',
        'Frequency is the number of cycles per second. Period is the time taken by one cycle. Faster repetition means a shorter period.',
      ],
      [
        '1 кГц = 1 000 Гц, 1 МГц = 1 000 кГц, 1 ГГц = 1 000 МГц. Позначення к, М і Г лише змінюють масштаб одиниці.',
        '1 kHz = 1,000 Hz, 1 MHz = 1,000 kHz, and 1 GHz = 1,000 MHz. The prefixes change the scale of the same unit.',
      ],
    ),
    lesson(
      'antennas',
      ['Антени', 'Antennas'],
      [
        'Передавальна антена перетворює електричний сигнал у радіохвилю. Приймальна антена робить зворотне: хвиля створює в ній електричний сигнал.',
        'A transmitting antenna converts an electrical signal into a radio wave. A receiving antenna converts some of that wave’s energy back into an electrical signal.',
      ],
      [
        'Діаграма спрямованості показує, як випромінювання або чутливість змінюються залежно від напрямку.',
        'A radiation pattern shows how an antenna’s transmission or sensitivity varies with direction.',
      ],
    ),
    lesson(
      'electricity',
      ['Напруга, струм і опір', 'Voltage, current and resistance'],
      [
        'Напруга — різниця електричних потенціалів, виміряна у вольтах. Струм — швидкість перенесення електричного заряду, виміряна в амперах. Опір вимірюють в омах.',
        'Voltage is an electric potential difference, measured in volts. Current is the rate of flow of electric charge, measured in amperes. Resistance is measured in ohms.',
      ],
      [
        'Для омічного резистора U = I × R. Якщо опір становить 10 Ом, а напруга 5 В, через резистор тече 0,5 А.',
        'For an ohmic resistor, V = I × R. A 5 V potential difference across a 10 Ω resistor produces a current of 0.5 A.',
      ],
    ),
  ],
  fundamentals: [
    lesson(
      'forces',
      ['Тяга й сила тяжіння', 'Thrust and weight'],
      [
        'Пропелери прискорюють повітря вниз. Реакція повітря створює тягу в протилежному напрямку. Сила тяжіння діє вниз.',
        'The propellers accelerate air downwards. The reaction from the air produces thrust in the opposite direction. Weight acts downwards.',
      ],
      [
        'У нерухомому горизонтальному зависанні сумарна тяга врівноважує силу тяжіння. Вертикальне прискорення виникає, коли сума вертикальних сил відмінна від нуля.',
        'In a stationary, level hover, total thrust balances weight. The quad accelerates vertically when the net vertical force is non-zero.',
      ],
    ),
    lesson(
      'axes',
      ['Крен, тангаж і рискання', 'Roll, pitch and yaw'],
      [
        'Крен — обертання навколо поздовжньої осі, тангаж — навколо поперечної, рискання — навколо вертикальної осі корпусу.',
        'Roll is rotation around the body’s front-to-back axis, pitch around its side-to-side axis, and yaw around its vertical axis.',
      ],
      [
        'Коли коптер нахиляється вперед, сумарна тяга також нахиляється. Її горизонтальна складова створює прискорення вперед, якщо переважає опір повітря.',
        'When a quad tilts forward, its total thrust tilts too. The horizontal component accelerates the quad forward if it exceeds drag.',
      ],
    ),
    lesson(
      'feedback',
      ['Зворотний зв’язок', 'Feedback'],
      [
        'Гіроскоп вимірює швидкість обертання. Польотний контролер порівнює виміряний рух із заданим і обчислює поправку.',
        'A gyroscope measures rotation rate. The flight controller compares measured motion with the requested motion and calculates a correction.',
      ],
      [
        'Цей цикл повторюється: команда, вимірювання, поправка. Так зворотний зв’язок працює і в термостаті, хоча вимірювана величина там інша.',
        'The cycle repeats: command, measurement and correction. A thermostat uses the same feedback principle with a different measured quantity.',
      ],
    ),
  ],
  anatomy: [
    lesson(
      'frame',
      studyTitles['anatomy/frame'],
      [
        'Рама утримує двигуни, електроніку й камеру у визначених місцях. Обтічник захищає частину електроніки й утримує камеру в окремих моделях.',
        'The frame holds the motors, electronics and camera in position. On some models a canopy protects part of the electronics and holds the camera.',
      ],
      [
        'У whoop захист є частиною рами навколо пропелерів. У відкритій рамі двигуни закріплені на променях, а пропелери відкриті.',
        'On a whoop, the frame wraps around the propellers to protect them. On an open frame, motors mount on arms and the propellers are exposed.',
      ],
    ),
    lesson(
      'controller',
      studyTitles['anatomy/controller'],
      [
        'Польотний контролер (FC) обробляє команди та дані сенсорів. Регулятор обертів (ESC) керує подачею електроенергії до двигуна відповідно до цих команд.',
        'The flight controller (FC) processes commands and sensor readings. An electronic speed controller (ESC) controls how power is delivered to a motor in response.',
      ],
      [
        'На маленькому коптері ці функції можуть бути на одній платі. Спільна плата об’єднує апаратні вузли, хоча в кожного своя роль.',
        'On a small quad these functions can share a single circuit board while remaining distinct jobs.',
      ],
    ),
    lesson(
      'propulsion',
      studyTitles['anatomy/propulsion'],
      [
        'Двигун обертає пропелер, а лопаті прискорюють повітря. Саме пропелер створює тягу, яка діє на коптер.',
        'The motor turns the propeller, and its blades accelerate air. The propeller produces the thrust acting on the quad.',
      ],
      [
        'На дошці деталей можна окремо роздивитися металевий двигун і легкий лопатевий пропелер. Разом вони утворюють один рушійний вузол.',
        'On the parts board, compare the metal motor with the lightweight propeller. Together they form one propulsion unit.',
      ],
    ),
  ],
  equipment: [
    lesson(
      'sticks',
      studyTitles['equipment/sticks'],
      [
        'Два стіки мають по дві осі. У типовій розкладці Mode 2 лівий стік відповідає за газ і рискання, правий — за тангаж і крен.',
        'Two sticks provide two axes each. In the common Mode 2 layout, the left stick controls throttle and yaw. The right stick controls pitch and roll.',
      ],
      [
        'Розкладка залежить від режиму пульта. На схемі варто спочатку знайти назву осі, а потім дивитися, де її розташовано.',
        'Stick assignments depend on the transmitter mode. Start by identifying the axis on a diagram, then check where it is assigned.',
      ],
    ),
    lesson(
      'controls',
      studyTitles['equipment/controls'],
      [
        'Стік має неперервний хід. Перемикач зазвичай має кілька фіксованих положень. Екран та індикатори показують стан пульта або активний вибір.',
        'A stick moves through a continuous range. A switch usually has a small number of fixed positions. The display and indicators show transmitter status or the current selection.',
      ],
      [
        'У симуляторі вікно вводу дає побачити, яку вісь програма зчитує при русі стіка.',
        'A simulator’s input screen lets you see which axis the software reads as you move a stick.',
      ],
    ),
  ],
  video: [
    lesson(
      'video-path',
      studyTitles['video/video-path'],
      [
        'Камера створює зображення, відеопередавач (VTX) передає сигнал, а відеоприймач (VRX) приймає його для показу на екрані.',
        'The camera captures the image, the video transmitter (VTX) sends the signal, and the video receiver (VRX) receives it for display.',
      ],
      [
        'Окуляри й монітор виконують ту саму роль у цьому ланцюгу: показують кадр. Приймач може бути вбудований в екран або стояти окремо.',
        'Goggles and monitors serve the same purpose in this chain: they show the received picture. The receiver may be built into the display or separate.',
      ],
    ),
    lesson(
      'osd',
      studyTitles['video/osd'],
      [
        'OSD — дані, накладені поверх відео. Склад показників залежить від підключених датчиків і налаштувань.',
        'An on-screen display (OSD) overlays data on the video. Available readings depend on the sensors and configuration.',
      ],
      [
        'Вольти описують напругу. Позначка mAh у полі витраченого заряду — це оцінка кількості заряду, що пройшов через коло.',
        'Volts measure voltage. When mAh is shown for charge used, it estimates how much charge has passed through the circuit.',
      ],
    ),
  ],
  power: [
    lesson(
      'cells',
      studyTitles['power/cells'],
      [
        'S вказує кількість послідовно з’єднаних комірок. За послідовного з’єднання їхні напруги додаються.',
        'S indicates the number of cells in series. Connecting cells in series adds their voltages.',
      ],
      [
        'Дві однакові комірки з номінальною напругою 3,7 В дають 7,4 В номінально у збірці 2S. Номінальна напруга є довідковим значенням і відрізняється від поточної.',
        'Two identical 3.7 V nominal cells give a nominal 7.4 V in a 2S pack. Nominal voltage is a reference value and differs from the live reading.',
      ],
    ),
    lesson(
      'capacity',
      ['Ємність, енергія й просідання', 'Capacity, energy and voltage sag'],
      [
        'Ємність у mAh описує доступний заряд. Ват-години враховують і напругу, тому краще підходять для порівняння енергії батарей різної напруги.',
        'Capacity in mAh describes available charge. Watt-hours include voltage, making them better for comparing energy across batteries with different voltages.',
      ],
      [
        'Коли струм зростає, напруга на клемах може просісти через внутрішній опір батареї. Після зменшення навантаження напруга частково відновлюється.',
        'When current increases, terminal voltage can sag because of the battery’s internal resistance. Voltage can recover partly when the load drops.',
      ],
    ),
  ],
  workbench: [
    lesson(
      'boards',
      studyTitles['workbench/boards'],
      [
        'Доріжка проводить струм між точками кола. Контактний майданчик — відкрита металева поверхня, до якої приєднують вивід компонента або провід.',
        'A trace conducts current between points in a circuit. A pad is an exposed metal area where a component lead or wire can be attached.',
      ],
      [
        'Електрична схема показує логічні зв’язки, а креслення плати — фізичне розташування деталей і доріжок. Це два різні види одного кола.',
        'A schematic shows logical connections. A board layout shows the physical positions of components and traces. Both describe the same circuit.',
      ],
    ),
    lesson(
      'joints',
      ['Паяне з’єднання', 'A solder joint'],
      [
        'Припій утворює електричний і механічний контакт між металевими поверхнями. Флюс допомагає прибрати оксиди і змочити поверхню припоєм.',
        'Solder forms an electrical and mechanical connection between metal surfaces. Flux helps remove oxides so solder can wet the surface.',
      ],
      [
        'Навчитись розрізняти майданчик, доріжку та вивід зручно на окремій навчальній платі. Мультиметр у режимі прозвонювання допомагає перевірити неперервність на знеструмленій платі.',
        'A practice board is a good place to learn to identify pads, traces and leads. A multimeter’s continuity mode can check for a connection on an unpowered board.',
      ],
    ),
  ],
  firmware: [
    lesson(
      'betaflight',
      ['Польотний контролер і Betaflight', 'Flight controllers and Betaflight'],
      [
        'Betaflight Firmware працює на польотному контролері. Betaflight App відкриває його налаштування, показує стан плати та має окремий розділ Firmware Flasher. Доступні вебзастосунок і офіційні завантаження для підтримуваних систем.',
        'Betaflight Firmware runs on the flight controller. Betaflight App reads and edits its settings, shows the board’s status and has a separate Firmware Flasher tab. The project offers a web app and downloads for supported platforms.',
      ],
      [
        'У версії App 2026.6.1 і новіших Setup показує орієнтацію та стан плати, а калібрування винесено до Sensors. На зібраному коптері спочатку зніми пропелери, звір модель плати й збережи наявну конфігурацію перед змінами.',
        'In App 2026.6.1 and later, Setup shows orientation and board status, while calibration lives under Sensors. On an assembled quad, remove the props, identify the board and save its current configuration before making changes.',
      ],
    ),
    lesson(
      'edgetx',
      ['Пульт, профілі та EdgeTX', 'Transmitters, profiles and EdgeTX'],
      [
        'EdgeTX — прошивка для сумісних радіопультів. Профіль моделі зберігає її налаштування. Inputs описує входи від органів керування, Mixes призначає їх каналам, Outputs визначає вихід, а Channel Monitor показує результат.',
        'EdgeTX is firmware for compatible transmitters. A model profile stores its own settings. Inputs describes the controls, Mixes assigns them to channels, Outputs defines the final signals, and Channel Monitor shows the result.',
      ],
      [
        'EdgeTX Buddy — браузерний засіб оновлення. Companion — настільний застосунок для роботи з моделями й резервними копіями. Для симулятора зручно мати окремий профіль і спочатку перевірити осі в меню вводу гри.',
        'EdgeTX Buddy is the browser-based update tool. Companion is a desktop app for working with models and backups. A separate simulator profile helps keep your settings organised. Check the axes in the simulator’s input screen before flying.',
      ],
    ),
    lesson(
      'versions-and-backups',
      [
        'Модель плати, версії та резервна копія',
        'Board targets, versions and backups',
      ],
      [
        'Назва пристрою, апаратна ревізія, версія прошивки та версія застосунку — різні дані. У Betaflight ціль збірки має відповідати конкретній платі. Для пульта звіряй точну модель з офіційним переліком EdgeTX.',
        'The device name, hardware revision, firmware version and app version are separate details. In Betaflight, the build target must match the actual board. For a transmitter, check the exact model against the EdgeTX compatibility list.',
      ],
      [
        'Резервна копія описує налаштування поточного пристрою. Перед перенесенням її на іншу версію прочитай примітки до випуску: назви параметрів і їхні допустимі значення можуть змінюватися.',
        'A backup contains settings for the current device. Review the release notes before restoring it on another version, since setting names and valid values can change.',
      ],
    ),
  ],
  simulators: [
    lesson(
      'first-laps',
      ['Перші кола', 'First laps'],
      [
        'Почни з вільного польоту або простої траси. Спочатку перевір, чи симулятор бачить пульт і чи рухаються потрібні осі у вікні вводу.',
        'Start in free flight or on a simple course. First check that the simulator detects your transmitter and that the expected axes move on its input screen.',
      ],
      [
        'Спробуй пройти те саме коло кілька разів у спокійному темпі. Повторювана траєкторія дає більше інформації про твоє керування, ніж разовий рекорд швидкості.',
        'Try the same lap several times at a comfortable pace. A repeatable line tells you more about your control than a one-off speed record.',
      ],
    ),
    lesson(
      'flight-modes',
      ['Режими в симуляторі', 'Flight modes in a simulator'],
      [
        'У режимі із самовирівнюванням модель повертається до рівного положення, коли відпускаєш стік крену чи тангажу. У режимі Acro стік задає швидкість обертання.',
        'In a self-levelling mode, the model tends to return to level when you release the roll or pitch stick. In Acro mode, the stick commands a rotation rate.',
      ],
      [
        'Зроби один короткий нахил в обох режимах і порівняй, як змінюється положення віртуального горизонту після повернення стіка в центр.',
        'Make one short tilt in both modes and compare what happens to the virtual horizon when the stick returns to centre.',
      ],
    ),
  ],
};

export const topicIntroductions: Record<Topic['id'], Bilingual> = {
  radio: [
    'Зв’язок починається з передавача й закінчується приймачем. Радіосигнал переносить інформацію, а характеристики хвилі можна описати фізичними величинами. Почни з одиниць і простих електричних кіл, а далі розглянь, як працюють хвилі та антени.',
    'A radio link runs from a transmitter to a receiver. The signal carries information, and the wave itself has measurable physical properties. Start with units and simple circuits, then look at waves and antennas.',
  ],
  fundamentals: [
    'Положення коптера змінюється під дією сил і моментів. Тяга зміщує апарат, а різниця тяги між двигунами може його повернути. Звідси можна перейти від стрілок на схемі до трьох осей обертання.',
    'Forces change how a quad moves, and torques change how it rotates. Thrust moves the aircraft, while differences in thrust between motors can rotate it. That connects the arrows on a diagram to the three axes of rotation.',
  ],
  anatomy: [
    'Механічні частини тримають конструкцію й створюють тягу. Електроніка читає команди та рух коптера, а відеосистема показує кадр із камери. Розклади модель на ці три групи, щоб простіше читати схему.',
    'Mechanical parts support the structure and produce thrust. The electronics read commands and motion, while the video system shows the camera view. Grouping the parts by those jobs makes a diagram easier to read.',
  ],
  equipment: [
    'Для польоту з видом від першої особи потрібні радіопульт і спосіб бачити відео. Пульт передає команди, а окуляри чи монітор показують кадр. У симуляторі роль пульта може виконувати сумісний USB-контролер.',
    'Flying from a first-person view requires a way to send commands and see the video. The transmitter handles control, while goggles or a monitor show the picture. In a simulator, a compatible USB controller can serve as the transmitter.',
  ],
  video: [
    'Відеоканал і канал керування виконують різні завдання. Відео передає кадри з борту. Керування передає команди на борт. Екранні показники допомагають читати стан системи, коли вони доступні.',
    'The video link carries pictures from the aircraft. The control link carries commands to it. On-screen readings help you interpret the system’s state when that data is available.',
  ],
  power: [
    'Батарея віддає енергію електроніці та двигунам. Під час польоту напруга змінюється і зі ступенем розряду, і з навантаженням. Тому одне миттєве число варто читати разом з іншими показниками.',
    'The battery supplies energy to the electronics and motors. In flight, voltage changes with both the remaining charge and the load. Read an instantaneous voltage alongside the other battery indicators.',
  ],
  workbench: [
    'Збірка починається з розуміння того, що має з’єднуватися механічно, а що електрично. На платі за електричний зв’язок відповідають доріжки й контакти, а паяні з’єднання приєднують деталі до кола.',
    'Assembly starts with knowing which parts need a mechanical connection and which need an electrical one. Traces and pads carry connections on a board, and solder joints attach components to the circuit.',
  ],
  firmware: [
    'У FPV-коптера й пульта окремі прошивки та інтерфейси. Betaflight працює з польотним контролером. EdgeTX на сумісному пульті перетворює рухи стіків і перемикачів на канали. Нижче можна порівняти, де саме це видно на екрані.',
    'The quad and its transmitter run separate firmware and have different interfaces. Betaflight works with the flight controller. On a compatible transmitter, EdgeTX turns stick and switch movements into channels. Compare the screens below to see where each part fits.',
  ],
  simulators: [
    'У симуляторі можна повторювати коротку вправу, одразу бачити реакцію моделі й почати спочатку після зіткнення. Обирай за тим, що хочеш потренувати: польоти в кімнатах, проходження воріт чи вільний політ.',
    'A simulator lets you repeat a short exercise, see how the model responds and start again after a crash. Choose one around what you want to practise: indoor flying, following a course through gates or free flight.',
  ],
};

// Shared by static lesson routes and their search records.
export function lessonTrails(
  nodes: readonly Lesson[],
  parents: readonly Lesson[] = [],
): Lesson[][] {
  return nodes.flatMap((node) => {
    const trail = [...parents, node];
    return [trail, ...lessonTrails(node.children ?? [], trail)];
  });
}
