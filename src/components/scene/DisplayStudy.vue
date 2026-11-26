<script setup lang="ts">
import { usePageLanguage } from '../../lib/page-language';
import { usePointerNote } from '../../lib/usePointerNote';
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStudySelection } from '../../lib/useStudySelection';
import { type Locale } from '../../lib/i18n';
import StudyNote from './StudyNote.vue';
import Icon from '../ui/Icon.vue';
const input = defineProps<{ locale: Locale }>();
const locale = usePageLanguage(input.locale);
const modal = ref<InstanceType<typeof StudyNote>>(),
  chapter = ref<HTMLElement>();
const phase = ref(0);
const time = ref(0),
  throttle = ref(0),
  spentVoltage = ref(0),
  usedCharge = ref(0),
  north = ref(0),
  east = ref(0);
const heading = computed(() => 18 * Math.sin(time.value / 16));
const exhausted = computed(() => spentVoltage.value >= 2);
const voltage = computed(() =>
  exhausted.value
    ? 2.35
    : Math.max(2.36, 4.35 - spentVoltage.value - 0.085 * throttle.value),
);
const jammed = ref(false);
let loopOrigin: number | null = null;
let lossTimer = 0;
let sampledProgress = 0,
  sampledAt = 0,
  timer = 0,
  frame = 0,
  previous = 0,
  visible = false;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function advance() {
  clearTimeout(timer);
  if (!visible || document.hidden || reduced() || exhausted.value) return;
  const now = performance.now();
  const seconds = previous ? (now - previous) / 1000 : 0;
  previous = now;
  // Integrate the decaying scroll impulse over real time, including slow animation frames.
  const decay = Math.exp(-seconds / 0.85);
  const effort = throttle.value * 0.85 * (1 - decay);
  throttle.value *= decay;
  time.value += seconds;
  spentVoltage.value = Math.min(
    2,
    spentVoltage.value + 0.009 * seconds + 0.009 * effort,
  );
  const ripple =
    8 * (Math.cos((time.value - seconds) / 8) - Math.cos(time.value / 8));
  usedCharge.value += (2.1 * seconds + 5.8 * effort + 0.22 * ripple) / 3.6;
  // Integrate ground speed into the local north/east displacement in metres.
  const distance = (14 * seconds + 37 * effort + 0.8 * ripple) / 3.6;
  const course = (heading.value * Math.PI) / 180;
  north.value += distance * Math.cos(course);
  east.value += distance * Math.sin(course);
  phase.value =
    time.value < 1.3
      ? 1
      : time.value < 2.6
        ? 2
        : time.value < 3.45
          ? 3
          : time.value < 5.5
            ? 4
            : 5;
  if (loopOrigin !== null || exhausted.value) scroll();
  if (!exhausted.value) timer = window.setTimeout(advance, 150);
}
function position(box: DOMRect) {
  return Math.max(
    0,
    Math.min(1, -box.top / Math.max(1, box.height - innerHeight)),
  );
}
function inView(box: DOMRect) {
  return box.top < innerHeight * 0.38 && box.bottom > innerHeight * 0.36;
}
function flightProgress(progress: number) {
  return loopOrigin === null
    ? progress
    : Math.max(0, Math.min(1, time.value / 32 + progress - loopOrigin));
}
function cancelReplay() {
  clearTimeout(lossTimer);
  lossTimer = 0;
}
function replayAfterLoss() {
  lossTimer = 0;
  const box = chapter.value?.getBoundingClientRect();
  if (!box || !inView(box) || document.hidden || reduced()) return;
  const anchor = position(box);
  if (!exhausted.value && flightProgress(anchor) < 0.949) return;
  loopOrigin = anchor;
  resetFlight();
}
function measure() {
  frame = 0;
  if (!chapter.value || !surface.value) return;
  const box = chapter.value.getBoundingClientRect(),
    h = innerHeight;
  const inside = inView(box);
  if (inside !== visible) {
    visible = inside;
    previous = 0;
    advance();
  }
  const progress = position(box);
  const now = performance.now();
  if (
    inside &&
    sampledAt &&
    !reduced() &&
    !exhausted.value &&
    progress !== sampledProgress
  ) {
    const seconds = Math.max(0.016, Math.min(0.15, (now - sampledAt) / 1000));
    const screens =
      Math.abs(progress - sampledProgress) * Math.max(0, box.height / h - 1);
    const target = Math.min(1, screens / seconds / 2.2);
    advance();
    throttle.value +=
      (target - throttle.value) * (1 - Math.exp(-seconds / 0.08));
  }
  sampledAt = inside ? now : 0;
  sampledProgress = progress;
  const p = flightProgress(progress);
  const strength = Math.min(1, Math.max(0, (p - 0.24) / 0.71));
  jammed.value = !reduced() && p >= 0.949;
  const canReplay =
    inside &&
    !document.hidden &&
    !reduced() &&
    (jammed.value || exhausted.value);
  if (canReplay && !lossTimer) {
    lossTimer = window.setTimeout(replayAfterLoss, 1100);
  } else if (!canReplay) {
    cancelReplay();
  }
  const exit = jammed.value ? 1 : strength * strength * (3 - 2 * strength);
  const approach = Math.min(1, Math.max(0, box.top / h));
  const style = surface.value.style;
  const imageIn = Math.max(0, Math.min(1, (0.65 - approach) / 0.49));
  style.setProperty(
    '--signal-image',
    String(reduced() ? 1 : imageIn * (1 - exit ** 2)),
  );

  style.setProperty('--drift', (reduced() ? 0 : (p - 0.45) * 23) + 'svh');
  style.setProperty('--tilt', (reduced() ? 0 : (p - 0.45) * 8) + 'deg');
  style.setProperty(
    '--bands',
    String(reduced() ? 0 : Math.sin(exit * Math.PI) * 0.42),
  );
  style.setProperty('--zoom', String(reduced() ? 1 : 1.12 + 0.45 * p));
  style.setProperty('--dropout', String(reduced() ? 0 : exit ** 2));
  style.setProperty('--hud-opacity', String(reduced() ? 1 : 1 - exit ** 3));
}
function look(event: PointerEvent) {
  if (!surface.value || reduced() || event.pointerType !== 'mouse') return;
  const rect = surface.value.getBoundingClientRect();
  surface.value.style.setProperty(
    '--look',
    ((event.clientX - rect.left) / rect.width - 0.5) * 9 + 'vw',
  );
  surface.value.style.setProperty(
    '--look-y',
    ((event.clientY - rect.top) / rect.height - 0.5) * 7 + 'svh',
  );
}
function centreView() {
  surface.value?.style.removeProperty('--look');
  surface.value?.style.removeProperty('--look-y');
}
function scroll() {
  if (!frame) frame = requestAnimationFrame(measure);
}
function visibility() {
  if (document.hidden) cancelReplay();
  scroll();
  previous = 0;
  advance();
}
function reset() {
  loopOrigin = null;
  resetFlight();
}
function resetFlight() {
  cancelReplay();
  hover.value = null;
  sampledAt = sampledProgress = previous = phase.value = 0;
  throttle.value = spentVoltage.value = usedCharge.value = time.value = 0;
  north.value = east.value = 0;
  centreView();
  advance();
  measure();
}
onMounted(() => {
  measure();
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('resize', scroll);
  window.addEventListener('tour-restart', reset);
  document.addEventListener('visibilitychange', visibility);
});
onBeforeUnmount(() => {
  clearTimeout(lossTimer);
  clearTimeout(timer);
  cancelAnimationFrame(frame);
  window.removeEventListener('scroll', scroll);
  window.removeEventListener('resize', scroll);
  window.removeEventListener('tour-restart', reset);
  document.removeEventListener('visibilitychange', visibility);
});
const { surface, noteAt, place } = usePointerNote();
const base = import.meta.env.BASE_URL + 'media/study/';
const fieldMarks: Record<string, string> = {
  time: '◷',
  altitude: 'ALT',
  speed: 'GS',
};
const fields = [
  {
    id: 'time',
    value: '00:00',
    uk: 'Таймер',
    en: 'Timer',
    text: {
      uk: 'Час від початку цього польоту у хвилинах і секундах.',
      en: 'Time since the start of this flight, in minutes and seconds.',
    },
  },
  {
    id: 'voltage',
    value: '4.35 V',
    uk: 'Напруга',
    en: 'Battery voltage',
    text: {
      uk: 'Напруга однієї комірки LiHV у вольтах. У цій демонстрації заряджена комірка має 4,35 В.',
      en: 'Voltage across a single LiHV cell, measured in volts. This simulation starts with a fully charged cell at 4.35 V.',
    },
  },
  {
    id: 'current',
    value: '2.1 A',
    uk: 'Струм',
    en: 'Current',
    text: {
      uk: 'Це струм, який у цей момент споживає коптер. Його вимірюють в амперах.',
      en: 'The current drawn by the quad at this instant, measured in amperes.',
    },
  },
  {
    id: 'charge',
    value: '0 mAh',
    uk: 'Витрачений заряд',
    en: 'Charge used',
    text: {
      uk: 'Лічильник показує, скільки заряду вже витрачено з акумулятора.',
      en: 'The counter shows how much charge the quad has drawn from the battery.',
    },
  },
  {
    id: 'link',
    value: 'LQ 100%',
    uk: 'Якість зв’язку',
    en: 'Link quality',
    text: {
      uk: 'Відсоток очікуваних пакетів керування, які отримав приймач. Відеосигнал має окремий канал.',
      en: 'Percentage of expected control packets received. The video feed uses a separate link.',
    },
  },
  {
    id: 'compass',
    value: 'N',
    uk: 'Компас',
    en: 'Compass',
    text: {
      uk: 'Центральна позначка показує курс коптера. Літера N означає північ.',
      en: 'The centre mark shows the heading of the quad. N stands for north.',
    },
  },
  {
    id: 'altitude',
    uk: 'Висота',
    en: 'Altitude',
    value: '12 m',
    text: {
      uk: 'Висота відносно початкової позначки.',
      en: 'Height relative to the starting reference.',
    },
  },
  {
    id: 'rpm',
    uk: 'Оберти двигуна',
    en: 'Motor speed',
    value: '9 200 RPM',
    text: {
      uk: 'Кількість обертів двигуна за хвилину. Це умовний показник для цього кадру.',
      en: 'Motor revolutions per minute. The value shown here belongs to the sample scene.',
    },
  },
  {
    id: 'position',
    uk: 'Координати',
    en: 'Coordinates',
    value: '48.0000° N · 16.0000° E',
    text: {
      uk: 'Спочатку показано широту, потім довготу. Координати тут умовні.',
      en: 'Latitude comes first, followed by longitude. These are sample coordinates.',
    },
  },
  {
    id: 'speed',
    uk: 'Наземна швидкість',
    en: 'Ground speed',
    value: '14 km/h',
    text: {
      uk: 'Швидкість відносно землі за даними GPS. Набір полів залежить від датчиків і профілю OSD.',
      en: 'GPS speed over the ground. The available fields depend on the sensors and OSD profile.',
    },
  },
] as const;
function reading(field: (typeof fields)[number]) {
  if (!time.value) return field.value;
  const t = time.value;
  const wave = Math.sin(t / 8);
  switch (field.id) {
    case 'time':
      return [Math.floor(t / 60), Math.floor(t) % 60]
        .map((n) => String(n).padStart(2, '0'))
        .join(':');
    case 'voltage':
      return voltage.value.toFixed(2) + ' V';
    case 'current':
      return (2.1 + 5.8 * throttle.value + 0.22 * wave).toFixed(1) + ' A';
    case 'charge':
      return Math.round(usedCharge.value) + ' mAh';
    case 'rpm':
      return (
        Math.round((9200 + 5100 * throttle.value + 260 * wave) / 10) * 10 +
        ' RPM'
      );
    case 'link':
      return 'LQ ' + Math.round(98 + 2 * Math.cos(t / 9)) + '%';
    case 'altitude':
      return Math.round(12 + 3 * Math.sin(t / 17)) + ' m';
    case 'speed':
      return Math.round(14 + 37 * throttle.value + 0.8 * wave) + ' km/h';
    case 'compass':
      return (Math.round((360 + heading.value) % 360) % 360) + '°';
    case 'position':
      return (
        (48 + north.value / 111_200).toFixed(4) +
        '° N · ' +
        (16 + east.value / (111_200 * Math.cos((48 * Math.PI) / 180))).toFixed(
          4,
        ) +
        '° E'
      );
  }
}
function inspect(i: number) {
  choose(i);
  hover.value = null;
  modal.value?.show();
}
const { selected, choose, ready } = useStudySelection(fields, 'field');
const hover = ref<number | null>(null);
// Clearing per button would pass through empty and double the note.
function leaveHud(event: FocusEvent) {
  const group = event.currentTarget as HTMLElement;
  if (!group.contains(event.relatedTarget as Node | null)) hover.value = null;
}
const shown = computed(() =>
  hover.value === null || jammed.value || exhausted.value
    ? null
    : fields[hover.value],
);
</script>
<template>
  <section ref="chapter" id="display" data-stop class="goggle-chapter">
    <div
      ref="surface"
      :aria-label="
        locale === 'uk' ? 'Телеметрія в окулярах' : 'Goggle telemetry'
      "
      @keydown.esc="hover = null"
      :data-phase="phase"
      :data-exhausted="exhausted"
      :data-lost="jammed || exhausted"
      tabindex="-1"
      class="goggle-view"
      @pointermove="look"
      @pointerleave="centreView"
    >
      <div class="view-land" aria-hidden="true">
        <img
          :src="base + 'forest-lake.webp'"
          width="1280"
          height="853"
          loading="lazy"
          decoding="async"
          alt=""
        />
      </div>
      <div class="view-shade"></div>
      <div class="season-weather" aria-hidden="true"></div>
      <div
        class="video-noise"
        :style="{ backgroundImage: `url(${base}video-grain.png)` }"
        aria-hidden="true"
      ></div>
      <div
        class="osd-hud"
        :inert="jammed || exhausted"
        @pointerleave="hover = null"
        @focusout="leaveHud"
      >
        <div class="osd-status">
          {{ voltage <= 3.48 ? 'LOW BATTERY' : phase === 1 ? 'ARMED' : '' }}
        </div>
        <button
          v-for="(field, i) in fields"
          :key="field.id"
          :class="'hud-' + field.id"
          :disabled="!ready"
          :aria-label="field[locale] + ' · ' + reading(field)"
          :aria-pressed="selected === i"
          @pointerenter="
            hover = i;
            place($event);
          "
          @pointermove="place"
          @focus="
            hover = i;
            place($event);
          "
          @click="inspect(i)"
          :aria-describedby="
            shown?.id === field.id ? 'osd-note-' + field.id : undefined
          "
        >
          <template v-if="field.id === 'compass'"
            ><span class="compass-tape" aria-hidden="true"
              ><span
                class="bearing-scale"
                :style="{
                  transform: 'translateX(' + (-heading / 90) * 100 + '%)',
                }"
                ><i>NW</i><i>N</i><i>NE</i></span
              ></span
            ><span class="bearing-value">{{ reading(field) }}</span></template
          >
          <template v-else>
            <Icon
              v-if="field.id === 'voltage'"
              name="battery"
              class="osd-battery"
            />
            <span
              v-else-if="fieldMarks[field.id]"
              class="osd-icon"
              aria-hidden="true"
              >{{ fieldMarks[field.id] }}</span
            >
            {{ reading(field) }}
          </template>
        </button>
        <div class="horizon-tick" aria-hidden="true"><i></i>○<i></i></div>
      </div>
      <Transition name="note-fade" mode="out-in"
        ><div
          v-if="shown"
          :key="shown.id"
          :id="'osd-note-' + shown.id"
          class="osd-note cursor-note"
          :style="noteAt"
          role="tooltip"
        >
          <b>{{ shown[locale] }}</b>
          <p>{{ shown.text[locale] }}</p>
        </div>
      </Transition>
      <StudyNote
        ref="modal"
        :title="fields[selected][locale]"
        :body="fields[selected].text[locale]"
        :locale="locale"
        article="video/osd"
      />
    </div>
  </section>
</template>
