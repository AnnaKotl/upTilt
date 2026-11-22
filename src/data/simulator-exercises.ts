export const simulatorExercises = [
  {
    id: 'hover',
    title: ['Зліт і зависання', 'Takeoff and hover'],
    text: [
      'Піднімися над міткою на невелику висоту й протримайся над нею десять секунд.',
      'Lift off over a marker and hold a low hover for ten seconds.',
    ],
    check: [
      'Мітка майже не зміщується, висота стабільна.',
      'The marker barely drifts and your altitude stays steady.',
    ],
  },
  {
    id: 'landing',
    title: ['Посадка на мітку', 'Landing on a marker'],
    text: [
      'Підлети до мітки на малій швидкості, загальмуй над нею й плавно опустися.',
      'Approach a marker slowly, come to a stop above it, then descend gently.',
    ],
    check: [
      'Три посадки поспіль у межах майданчика.',
      'Three consecutive landings inside the landing area.',
    ],
  },
  {
    id: 'out-and-back',
    title: ['Пряма з поверненням', 'Out and back'],
    text: [
      'Пролети від однієї мітки до іншої, виконай широкий розворот і повернися тією самою прямою.',
      'Fly from one marker to another, make a wide turn and return along the same line.',
    ],
    check: [
      'Після розвороту повертаєшся на лінію без різких поправок.',
      'You rejoin the line after the turn without abrupt corrections.',
    ],
  },
  {
    id: 'rectangle',
    title: ['Прямокутник', 'Rectangle'],
    text: [
      'Облети чотири орієнтири. Після кожного повороту зроби коротку пряму ділянку. Повтори у зворотному напрямку.',
      'Fly around four landmarks. Add a short straight after every turn, then repeat in the opposite direction.',
    ],
    check: [
      'Чотири кути читаються, сторони не зливаються в коло.',
      'All four corners are distinct and the sides stay straight.',
    ],
  },
  {
    id: 'orbit',
    title: ['Орбіта', 'Orbit'],
    text: [
      'Вибери один орієнтир. Облети його по широкому колу, тримаючи в кадрі, потім зміни напрямок.',
      'Pick a landmark and circle it on a wide line, keeping it in view. Then circle the other way.',
    ],
    check: [
      'Радіус і висота приблизно однакові від початку до кінця.',
      'The radius and height stay roughly constant throughout.',
    ],
  },
  {
    id: 'slalom',
    title: ['Змійка', 'Slalom'],
    text: [
      'Візьми три або чотири віртуальні стійки в ряд і обходь їх почергово зліва та справа.',
      'Set up three or four virtual posts in a line and alternate left and right around them.',
    ],
    check: [
      'Однаковий ритм між стійками й жодного торкання.',
      'A steady rhythm between posts and no contact.',
    ],
  },
  {
    id: 'figure-eight',
    title: ['Вісімка', 'Figure eight'],
    text: [
      'Облети дві мітки, змінюючи напрямок повороту в центрі між ними. Розведи мітки далі, якщо бракує місця.',
      'Circle two markers, reversing your turn direction halfway between them. Move them farther apart if you need more room.',
    ],
    check: [
      'Обидві петлі приблизно однакові, перехід у центрі плавний.',
      'Both loops are about the same size and the crossover is smooth.',
    ],
  },
  {
    id: 'gate-laps',
    title: ['Кола через ворота', 'Gate laps'],
    text: [
      'Збери короткий віртуальний маршрут із прямих, широкого повороту й кількох воріт. Повтори його без гонитви за часом.',
      'Make a short virtual course with straights, a wide turn and a few gates. Repeat it at a comfortable pace.',
    ],
    check: [
      'Три чисті кола поспіль зі схожою траєкторією.',
      'Three clean laps in a row on a similar line.',
    ],
  },
] as const;
